"""Local wrapper for creating LogiTrack Redpanda topics.

Docker Compose uses services/redpanda-topics/create_redpanda_topics.py. This
wrapper keeps the same command available from the repository root.
"""

import runpy
from pathlib import Path


SCRIPT = Path(__file__).resolve().parents[1] / "services" / "redpanda-topics" / "create_redpanda_topics.py"

runpy.run_path(str(SCRIPT), run_name="__main__")
