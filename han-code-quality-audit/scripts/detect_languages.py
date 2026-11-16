#!/usr/bin/env python3
"""Detect which of the ten supported languages are in a repository."""

from __future__ import annotations

import argparse
import json
import sys
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from scope import enrich_path, iter_files, language_of

TEN = (
    "javascript",
    "typescript",
    "python",
    "java",
    "csharp",
    "cpp",
    "php",
    "go",
    "rust",
    "ruby",
)


def detect(repo: Path) -> dict:
    counts: Counter[str] = Counter()
    other: Counter[str] = Counter()
    for path in iter_files(repo):
        lang = language_of(path)
        if lang is None:
            continue
        if lang in TEN:
            counts[lang] += 1
        else:
            other[lang] += 1
    return {
        "languages": [{"id": lang, "files": counts[lang]} for lang in TEN if counts[lang]],
        "other": [{"id": lang, "files": other[lang]} for lang in sorted(other)],
    }


def main() -> None:
    enrich_path()
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo", required=True)
    args = parser.parse_args()
    repo = Path(args.repo).resolve()
    if not repo.is_dir():
        raise SystemExit(f"Repository path is not a directory: {repo}")
    json.dump(detect(repo), sys.stdout, indent=2)
    sys.stdout.write("\n")


if __name__ == "__main__":
    main()
