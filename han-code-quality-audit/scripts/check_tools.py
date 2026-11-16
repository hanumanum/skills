#!/usr/bin/env python3
"""Report which external tools a run needs and which are missing."""

from __future__ import annotations

import argparse
import json
import shutil
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from catalog import EXTERNAL_TOOLS, needed_tools, resolve_properties
from detect_languages import detect
from scope import enrich_path


def main() -> None:
    enrich_path()
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo", required=True)
    parser.add_argument("--properties", default="all")
    args = parser.parse_args()
    repo = Path(args.repo).resolve()
    properties = resolve_properties(args.properties)
    languages = [item["id"] for item in detect(repo)["languages"]]
    needed = needed_tools([str(prop["id"]) for prop in properties], languages)
    present = []
    missing = []
    for name in needed:
        spec = EXTERNAL_TOOLS[name]
        if shutil.which(spec["bin"]):
            present.append({"name": name, "bin": spec["bin"]})
        else:
            missing.append(
                {"name": name, "bin": spec["bin"], "install": spec["install"], "why": spec["why"]}
            )
    json.dump(
        {
            "properties": [str(prop["id"]) for prop in properties],
            "languages": languages,
            "present": present,
            "missing": missing,
            "shipped": shipped(properties),
        },
        sys.stdout,
        indent=2,
    )
    sys.stdout.write("\n")


def shipped(properties: list[dict]) -> list[str]:
    ids = {str(prop["id"]) for prop in properties}
    tools = []
    if "02" in ids:
        tools.append("byte-identical")
    if "07" in ids:
        tools.append("import-graph")
    return tools


if __name__ == "__main__":
    main()
