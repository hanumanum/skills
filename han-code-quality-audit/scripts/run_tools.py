#!/usr/bin/env python3
"""Run shipped and installed tools. Never installs anything."""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from catalog import LIZARD_PRIMARY, PREFERRED, needed_tools, resolve_properties
from detect_languages import detect
from progress import cmd_tool
from scope import enrich_path

LIZARD_EXCLUDE = (
    r".*/(node_modules|dist|build|target|vendor|third_party|third-party|\.git|han-code-quality-audit|generated)/.*"
)


class Args:
    def __init__(self, run_dir: Path, name: str, state: str, language: str = "", output: str = "", detail: str = ""):
        self.run_dir = str(run_dir)
        self.name = name
        self.state = state
        self.language = language
        self.output = output
        self.detail = detail


def mark(run_dir: Path, name: str, state: str, language: str = "", output: str = "", detail: str = "") -> None:
    cmd_tool(Args(run_dir, name, state, language, output, detail))


def run(cmd: list[str], cwd: Path, out_path: Path) -> tuple[int, str]:
    completed = subprocess.run(cmd, cwd=cwd, text=True, capture_output=True, check=False)
    text = completed.stdout
    if completed.stderr:
        text += ("\n" if text else "") + completed.stderr
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(text, encoding="utf-8")
    return completed.returncode, text


def finish(run_dir: Path, name: str, language: str, out_path: Path, repo: Path, code: int, text: str) -> None:
    relative = out_path.resolve().relative_to(repo.resolve()).as_posix()
    if code == 0 or text.strip():
        mark(run_dir, name, "done", language, relative, "" if code == 0 else f"exit {code}")
    else:
        mark(run_dir, name, "failed", language, relative, f"exit {code}")


def run_jscpd(repo: Path, run_dir: Path, timestamp: str) -> None:
    tooling = run_dir / "tooling"
    config = {
        "minLines": 10,
        "minTokens": 50,
        "reporters": ["json"],
        "output": str(tooling),
        "ignore": [
            "**/node_modules/**",
            "**/dist/**",
            "**/build/**",
            "**/target/**",
            "**/vendor/**",
            "**/third_party/**",
            "**/third-party/**",
            "**/.git/**",
            "**/han-code-quality-audit/**",
            "**/generated/**",
        ],
    }
    config_path = tooling / f"jscpd.config.{timestamp}.json"
    config_path.write_text(json.dumps(config), encoding="utf-8")
    out = tooling / f"jscpd.{timestamp}.json"
    mark(run_dir, "jscpd", "running")
    code, text = run(["jscpd", str(repo), "--config", str(config_path)], repo, out)
    produced = tooling / "jscpd-report.json"
    if produced.exists():
        produced.replace(out)
    finish(run_dir, "jscpd", "", out, repo, code, text)


def run_lizard(repo: Path, run_dir: Path, timestamp: str, languages: list[str]) -> None:
    out = run_dir / "tooling" / f"lizard.{timestamp}.xml"
    cmd = ["lizard", "-X", "-x", LIZARD_EXCLUDE]
    for lang in languages:
        cmd.extend(["-l", lang])
    cmd.append(str(repo))
    mark(run_dir, "lizard", "running", ",".join(languages))
    code, text = run(cmd, repo, out)
    finish(run_dir, "lizard", ",".join(languages), out, repo, code, text)


def run_radon(repo: Path, run_dir: Path, timestamp: str) -> None:
    out = run_dir / "tooling" / f"radon.python.{timestamp}.json"
    mark(run_dir, "radon", "running", "python")
    code, text = run(
        ["radon", "cc", "-s", "-j", "-e", "node_modules/*,dist/*,vendor/*,han-code-quality-audit/*,.git/*", "."],
        repo,
        out,
    )
    finish(run_dir, "radon", "python", out, repo, code, text)


def run_gocyclo(repo: Path, run_dir: Path, timestamp: str) -> None:
    out = run_dir / "tooling" / f"gocyclo.go.{timestamp}.txt"
    mark(run_dir, "gocyclo", "running", "go")
    code, text = run(["gocyclo", "-over", "1", "."], repo, out)
    finish(run_dir, "gocyclo", "go", out, repo, code, text)


def run_rubocop(repo: Path, run_dir: Path, timestamp: str) -> None:
    out = run_dir / "tooling" / f"rubocop.ruby.{timestamp}.json"
    mark(run_dir, "rubocop", "running", "ruby")
    code, text = run(["rubocop", "--only", "Metrics/CyclomaticComplexity", "--format", "json"], repo, out)
    finish(run_dir, "rubocop", "ruby", out, repo, code, text)


def run_madge(repo: Path, run_dir: Path, timestamp: str, languages: list[str]) -> None:
    exts = ["js", "jsx", "mjs", "cjs"]
    if "typescript" in languages:
        exts.extend(["ts", "tsx"])
    out = run_dir / "tooling" / f"madge.{timestamp}.json"
    mark(run_dir, "madge", "running", ",".join(languages))
    code, text = run(["madge", "--circular", "--json", "--extensions", ",".join(exts), "."], repo, out)
    finish(run_dir, "madge", ",".join(languages), out, repo, code, text)


def run_shipped(script: str, args: list[str], run_dir: Path, name: str, language: str, output: str) -> None:
    mark(run_dir, name, "running", language, output)
    completed = subprocess.run(
        [sys.executable, str(Path(__file__).resolve().parent / script), *args],
        text=True,
        capture_output=True,
        check=False,
    )
    detail = (completed.stderr or "").strip().splitlines()
    if completed.returncode == 0:
        mark(run_dir, name, "done", language, output)
    else:
        mark(run_dir, name, "failed", language, output, "\n".join(detail[-4:]))


def main() -> None:
    enrich_path()
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo", required=True)
    parser.add_argument("--run-dir", required=True)
    parser.add_argument("--properties", default="all")
    parser.add_argument("--skip", default="", help="Comma-separated tool names the user refused")
    args = parser.parse_args()
    repo = Path(args.repo).resolve()
    run_dir = Path(args.run_dir).resolve()
    timestamp = run_dir.name
    properties = [str(prop["id"]) for prop in resolve_properties(args.properties)]
    detected = [item["id"] for item in detect(repo)["languages"]]
    skipped = {part.strip() for part in args.skip.split(",") if part.strip()}
    needed = needed_tools(properties, detected)

    def available(name: str) -> bool:
        return name not in skipped and shutil.which(name) is not None

    for name in needed:
        if not available(name):
            reason = "install declined" if name in skipped else "not installed"
            mark(run_dir, name, "skipped", "", "", reason)

    if "02" in properties:
        out = run_dir / "tooling" / f"byte-identical.{timestamp}.json"
        run_shipped(
            "byte_identical.py",
            ["--repo", str(repo), "--out", str(out)],
            run_dir,
            "byte-identical",
            "",
            out.resolve().relative_to(repo).as_posix(),
        )
    if "07" in properties and detected:
        run_shipped(
            "import_graph.py",
            [
                "--repo",
                str(repo),
                "--out-dir",
                str(run_dir / "tooling"),
                "--languages",
                ",".join(detected),
                "--timestamp",
                timestamp,
            ],
            run_dir,
            "import-graph",
            ",".join(detected),
            f"han-code-quality-audit/{timestamp}/tooling/import-graph.*.{timestamp}.json",
        )
    if "jscpd" in needed and available("jscpd"):
        run_jscpd(repo, run_dir, timestamp)
    if "madge" in needed and available("madge"):
        run_madge(repo, run_dir, timestamp, [lang for lang in detected if lang in {"javascript", "typescript"}])

    lizard_langs = [lang for lang in detected if lang in LIZARD_PRIMARY]
    for lang, tool in PREFERRED.items():
        if lang in detected and available("lizard") and not available(tool):
            lizard_langs.append(lang)
    if "radon" in needed and available("radon"):
        run_radon(repo, run_dir, timestamp)
    if "gocyclo" in needed and available("gocyclo"):
        run_gocyclo(repo, run_dir, timestamp)
    if "rubocop" in needed and available("rubocop"):
        run_rubocop(repo, run_dir, timestamp)
    if available("lizard") and lizard_langs and ("08" in properties):
        run_lizard(repo, run_dir, timestamp, lizard_langs)


if __name__ == "__main__":
    main()
