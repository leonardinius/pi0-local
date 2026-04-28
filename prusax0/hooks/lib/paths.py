"""
Path resolution for the prusax0 Pi resource tree.

All paths are computed relative to this file's location:
  prusax0/hooks/lib/paths.py -> prusax0/ is 3 dirname() calls up.
"""

import os


def _resource_root():
    """Compute the prusax0 resource root directory from this file's location."""
    return os.path.dirname(os.path.dirname(os.path.dirname(os.path.realpath(__file__))))


RESOURCE_ROOT = _resource_root()
MEMORY_DIR = os.path.join(RESOURCE_ROOT, "memory")
LONG_TERM_DIR = os.path.join(MEMORY_DIR, "long_term")
SHORT_TERM_DIR = os.path.join(MEMORY_DIR, "short_term")
INVESTIGATIONS_FILE = os.path.join(LONG_TERM_DIR, "investigations.md")
INDEX_FILE = os.path.join(LONG_TERM_DIR, "_index.md")
STATE_FILE = os.path.join(RESOURCE_ROOT, "hooks", ".proactive_save_state.json")
