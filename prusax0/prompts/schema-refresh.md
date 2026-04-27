---
argument-hint: Optional: --discover /path/to/workspace to auto-discover repos
---

Refresh the schema cache from structure.sql files.

If `~/.pi/agent/prusax0/schemas.json` is missing:
- If `$ARGUMENTS` includes `--discover <path>`, use that.
- Else if `~/src` exists and contains repos with `db/structure.sql` or `db/yugabyte_structure.sql`, run discovery on `~/src`.
- Else ask the user for the workspace path instead of guessing.

Commands:

```bash
# Discover sources, when needed
python3 ~/.pi/agent/prusax0/hooks/lib/schema_extract.py --discover <workspace>

# Extract/refresh configured schemas
python3 ~/.pi/agent/prusax0/hooks/lib/schema_extract.py
```

After extraction, report:
- Number of sources processed
- Total tables extracted
- Path to `_tables.md`
- Any errors or if no schema sources were found
