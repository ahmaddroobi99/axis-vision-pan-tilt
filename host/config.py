"""Load config.yaml from the repo root."""
from __future__ import annotations

from pathlib import Path
import yaml

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_PATH = ROOT / "config.yaml"


def load_config(path: Path | None = None) -> dict:
    p = path or DEFAULT_PATH
    with p.open("r", encoding="utf-8") as fh:
        return yaml.safe_load(fh)
