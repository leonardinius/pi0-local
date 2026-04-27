"""
Schema extraction from structure.sql files.

Parses PostgreSQL structure.sql dumps and produces compact schema cache files
for fast table/column lookups during development.

Usage:
    python3 schema_extract.py                     Extract using schemas.json config
    python3 schema_extract.py --discover /path     Auto-discover structure.sql files
    python3 schema_extract.py --check              Show which sources are stale
"""

import json
import os
import re
import sys
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from paths import SCHEMAS_CONFIG, SCHEMAS_DIR


def expand_config_path(value):
    """Expand ~ and environment variables in paths from schemas.json."""
    if not value:
        return ""
    return os.path.abspath(os.path.expandvars(os.path.expanduser(value)))


def portable_config_path(value):
    """Store paths under the user's home directory as ~/... for portability."""
    absolute = expand_config_path(value)
    home = os.path.abspath(os.path.expanduser("~"))
    if absolute == home:
        return "~"
    if absolute.startswith(home + os.sep):
        return "~" + absolute[len(home):]
    return absolute

# ---------------------------------------------------------------------------
# Type simplification
# ---------------------------------------------------------------------------

# Only entries that actually shorten the type — identity mappings fall through
# to the default return in simplify_type().
TYPE_MAP = [
    (re.compile(r"character varying(\(\d+\))?"), "varchar"),
    (re.compile(r"timestamp(\(\d+\))? without time zone"), "timestamp"),
    (re.compile(r"timestamp(\(\d+\))? with time zone"), "timestamptz"),
    (re.compile(r"double precision"), "double"),
    (re.compile(r"numeric\(\d+,\s*\d+\)"), "numeric"),
    (re.compile(r"integer"), "int"),
    (re.compile(r"boolean"), "bool"),
]


def simplify_type(raw_type):
    """Map a verbose PostgreSQL type to a compact form."""
    raw = raw_type.strip().lower()
    for pattern, short in TYPE_MAP:
        if pattern.fullmatch(raw):
            return short
    # Arrays of known types
    arr_match = re.match(r"(.+)\[\]$", raw)
    if arr_match:
        inner = simplify_type(arr_match.group(1))
        return inner + "[]"
    # Fall through: return as-is (stripped)
    return raw


# ---------------------------------------------------------------------------
# SQL parsing
# ---------------------------------------------------------------------------

# SQL keywords that start non-column lines inside CREATE TABLE blocks
_NON_COLUMN_KEYWORDS = frozenset(
    {
        "CONSTRAINT",
        "CHECK",
        "PRIMARY",
        "UNIQUE",
        "FOREIGN",
        "EXCLUDE",
        "LIKE",
        "INHERITS",
        "PARTITION",
        "WITH",
    }
)


def _extract_column(line):
    """Parse a single column line, returning (name, simplified_type, not_null) or None."""
    stripped = line.rstrip().rstrip(",").strip()
    if not stripped:
        return None

    # Split on first whitespace to get column name
    parts = stripped.split(None, 1)
    if len(parts) < 2:
        return None

    col_name = parts[0]
    remainder = parts[1]

    # Reject lines that start with SQL keywords, not column definitions
    if col_name.upper() in _NON_COLUMN_KEYWORDS:
        return None

    not_null = bool(re.search(r"\bNOT\s+NULL\b", remainder, re.IGNORECASE))

    # Strip DEFAULT clause and NOT NULL to isolate the type
    # Remove NOT NULL first
    type_str = re.sub(r"\s+NOT\s+NULL\b", "", remainder, flags=re.IGNORECASE)
    # Remove DEFAULT ... (greedy up to NOT NULL boundary or end)
    type_str = re.sub(r"\s+DEFAULT\s+.*", "", type_str, flags=re.IGNORECASE)
    # Remove trailing comma
    type_str = type_str.rstrip(",").strip()

    if not type_str:
        return None

    simple = simplify_type(type_str)
    return (col_name, simple, not_null)


def parse_structure_sql(filepath):
    """Parse a structure.sql file, returning {table_name: [(col, type, not_null), ...]}."""
    with open(filepath) as f:
        content = f.read()

    tables = {}

    # Match CREATE TABLE blocks.
    # The block starts with CREATE TABLE and ends at the closing ) which may be
    # followed by WITH (...); or PARTITION BY ...; or just ;
    pattern = re.compile(
        r"CREATE\s+TABLE\s+(\S+)\s*\(\s*\n(.*?)\n\)",
        re.DOTALL | re.IGNORECASE,
    )

    for m in pattern.finditer(content):
        raw_name = m.group(1)
        body = m.group(2)

        # Strip public. prefix and quote marks
        table_name = raw_name.replace("public.", "").strip('"')

        columns = []
        for line in body.split("\n"):
            col = _extract_column(line)
            if col:
                columns.append(col)

        if columns:
            tables[table_name] = columns

    return tables


# ---------------------------------------------------------------------------
# Output writers
# ---------------------------------------------------------------------------


def _today():
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def _format_column(name, typ, not_null):
    return f"{name} {typ} NOT NULL" if not_null else f"{name} {typ}"


def write_schema_file(schema_id, tables, source_path, output_dir):
    """Write a compact per-source schema file."""
    os.makedirs(output_dir, exist_ok=True)
    # Sanitize schema_id to prevent path traversal
    safe_id = os.path.basename(schema_id)
    filepath = os.path.join(output_dir, f"{safe_id}.md")

    lines = [
        f"# {schema_id} -- {len(tables)} tables",
        f"> Extracted: {_today()} from {source_path}",
        "",
    ]

    for table_name in sorted(tables):
        col_strs = [_format_column(*col) for col in tables[table_name]]
        lines.append(f"## {table_name}")
        lines.append(", ".join(col_strs))
        lines.append("")

    with open(filepath, "w") as f:
        f.write("\n".join(lines))

    return filepath


def write_global_index(all_tables, bq_datasets, output_dir):
    """Write the _tables.md global index file."""
    os.makedirs(output_dir, exist_ok=True)

    total = sum(len(t) for t in all_tables.values())
    lines = [
        f"# Schema Table Index -- {total} tables",
        f"> Last extracted: {_today()}",
        "",
    ]

    if bq_datasets:
        lines.append("## BigQuery Dataset Mappings")
        for dataset, schema_id in sorted(bq_datasets.items()):
            lines.append(f"{dataset} -> {schema_id}")
        lines.append("")

    lines.append("## Table -> Schema")
    mapping = sorted((table, sid) for sid, tables in all_tables.items() for table in tables)
    for table_name, schema_id in mapping:
        lines.append(f"{table_name} -> {schema_id}")
    lines.append("")

    filepath = os.path.join(output_dir, "_tables.md")
    with open(filepath, "w") as f:
        f.write("\n".join(lines))

    return filepath


# ---------------------------------------------------------------------------
# Discovery
# ---------------------------------------------------------------------------


def discover_sources(workspace_dir):
    """Walk workspace to find structure.sql files and generate schemas.json."""
    workspace_dir = expand_config_path(workspace_dir)
    sources = []
    seen_ids = set()

    def _add(schema_id, rel_path, **extra):
        if schema_id not in seen_ids:
            seen_ids.add(schema_id)
            source = {"id": schema_id, "path": rel_path}
            source.update(extra)
            sources.append(source)

    for entry in sorted(os.listdir(workspace_dir)):
        repo_dir = os.path.join(workspace_dir, entry)
        if not os.path.isdir(repo_dir):
            continue

        db_dir = os.path.join(repo_dir, "db")
        if not os.path.isdir(db_dir):
            continue

        base_id = entry.lower().replace(" ", "-")

        if os.path.isfile(os.path.join(db_dir, "structure.sql")):
            _add(base_id, f"{entry}/db/structure.sql")

        if os.path.isfile(os.path.join(db_dir, "yugabyte_structure.sql")):
            _add(
                f"{base_id}-yugabyte",
                f"{entry}/db/yugabyte_structure.sql",
                database="yugabyte",
            )

    config = {
        "workspace": portable_config_path(workspace_dir),
        "sources": sources,
        "bigquery_datasets": {},
    }

    with open(SCHEMAS_CONFIG, "w") as f:
        json.dump(config, f, indent=2)

    print(f"Discovered {len(sources)} source(s), wrote {SCHEMAS_CONFIG}", file=sys.stderr)
    for s in sources:
        print(f"  {s['id']}: {s['path']}", file=sys.stderr)

    return config


# ---------------------------------------------------------------------------
# Config loading + Extraction
# ---------------------------------------------------------------------------


def _load_config():
    """Load and validate schemas.json, exiting on error."""
    if not os.path.isfile(SCHEMAS_CONFIG):
        print(
            f"ERROR: {SCHEMAS_CONFIG} not found. Run with --discover first.",
            file=sys.stderr,
        )
        sys.exit(1)

    with open(SCHEMAS_CONFIG) as f:
        config = json.load(f)

    if not config.get("sources"):
        print("No sources configured in schemas.json; writing an empty schema index.", file=sys.stderr)
        config["sources"] = []

    return config


def extract_all():
    """Read schemas.json, parse each source, write cache files."""
    config = _load_config()
    workspace = expand_config_path(config.get("workspace", ""))
    sources = config["sources"]
    bq_datasets = config.get("bigquery_datasets", {})

    os.makedirs(SCHEMAS_DIR, exist_ok=True)

    all_tables = {}  # schema_id -> {table_name: columns}
    total_tables = 0
    errors = 0

    for source in sources:
        schema_id = source["id"]
        rel_path = source["path"]
        full_path = os.path.join(workspace, rel_path)

        if not os.path.isfile(full_path):
            print(f"  SKIP {schema_id}: {full_path} not found", file=sys.stderr)
            errors += 1
            continue

        tables = parse_structure_sql(full_path)
        count = len(tables)
        total_tables += count

        write_schema_file(schema_id, tables, rel_path, SCHEMAS_DIR)
        all_tables[schema_id] = tables
        print(f"  {schema_id}: {count} tables", file=sys.stderr)

    write_global_index(all_tables, bq_datasets, SCHEMAS_DIR)

    print(
        f"\nExtracted {total_tables} tables from {len(sources) - errors} source(s) into {SCHEMAS_DIR}",
        file=sys.stderr,
    )
    if errors:
        print(f"  {errors} source(s) skipped (file not found)", file=sys.stderr)

    return total_tables


# ---------------------------------------------------------------------------
# Staleness check
# ---------------------------------------------------------------------------


def check_staleness():
    """Compare file mtimes of sources vs cached schema files."""
    config = _load_config()
    workspace = expand_config_path(config.get("workspace", ""))
    sources = config["sources"]
    stale = []

    for source in sources:
        schema_id = source["id"]
        rel_path = source["path"]
        full_path = os.path.join(workspace, rel_path)
        cache_path = os.path.join(SCHEMAS_DIR, f"{schema_id}.md")

        if not os.path.isfile(full_path):
            print(f"  {schema_id}: source missing ({rel_path})", file=sys.stderr)
            continue

        if not os.path.isfile(cache_path):
            stale.append(schema_id)
            print(f"  {schema_id}: not yet extracted", file=sys.stderr)
            continue

        source_mtime = os.path.getmtime(full_path)
        cache_mtime = os.path.getmtime(cache_path)

        if source_mtime > cache_mtime:
            stale.append(schema_id)
            print(f"  {schema_id}: STALE (source newer than cache)", file=sys.stderr)
        else:
            print(f"  {schema_id}: up to date", file=sys.stderr)

    if stale:
        print(
            f"\n{len(stale)} source(s) need re-extraction. Run schema-refresh.",
            file=sys.stderr,
        )
    else:
        print("\nAll schema caches are up to date.", file=sys.stderr)

    return stale


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def main():
    args = sys.argv[1:]

    if not args:
        extract_all()
    elif args[0] == "--discover" and len(args) >= 2:
        workspace = expand_config_path(args[1])
        if not os.path.isdir(workspace):
            print(f"ERROR: {workspace} is not a directory.", file=sys.stderr)
            sys.exit(1)
        discover_sources(workspace)
    elif args[0] == "--check":
        check_staleness()
    else:
        print(__doc__.strip(), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
