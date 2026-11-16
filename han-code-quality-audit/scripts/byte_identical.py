#!/usr/bin/env python3
"""Group in-scope files that are byte-identical."""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from collections import defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from scope import iter_files, language_of, rel

MAX_BYTES = 2_000_000
MIN_BYTES = 40
MAX_GROUPS = 200


def scan(repo: Path) -> dict:
    by_size: dict[int, list[Path]] = defaultdict(list)
    for path in iter_files(repo):
        if language_of(path) is None:
            continue
        try:
            size = path.stat().st_size
        except OSError:
            continue
        if size < MIN_BYTES or size > MAX_BYTES:
            continue
        by_size[size].append(path)
    groups = []
    for size, paths in by_size.items():
        if len(paths) < 2:
            continue
        by_hash: dict[str, list[str]] = defaultdict(list)
        for path in paths:
            try:
                digest = hashlib.sha256(path.read_bytes()).hexdigest()
            except OSError:
                continue
            by_hash[digest].append(rel(repo, path))
        for digest, files in by_hash.items():
            if len(files) < 2:
                continue
            files.sort()
            groups.append({"sha256": digest, "bytes": size, "files": files})
    groups.sort(key=lambda item: (-len(item["files"]), -item["bytes"], item["files"][0]))
    truncated = len(groups) > MAX_GROUPS
    return {"groups": groups[:MAX_GROUPS], "truncated": truncated}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo", required=True)
    parser.add_argument("--out", required=True)
    args = parser.parse_args()
    repo = Path(args.repo).resolve()
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(scan(repo), indent=2), encoding="utf-8")
    print(out)


if __name__ == "__main__":
    main()
