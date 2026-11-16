#!/usr/bin/env python3
"""Create a run folder and serve the live progress page."""

from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import datetime
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

sys.path.insert(0, str(Path(__file__).resolve().parent))

from catalog import resolve_properties

SKILL_ROOT = Path(__file__).resolve().parents[1]
TEMPLATE = SKILL_ROOT / "templates" / "progress.html"
PHASES = {
    "detecting",
    "waiting",
    "running-tool",
    "reading",
    "analyzing",
    "writing",
    "done",
}


def now_iso() -> str:
    return datetime.now().astimezone().isoformat(timespec="seconds")


def new_run_id() -> str:
    return datetime.now().strftime("%Y-%m-%dT%H%M%S")


def status_path(run_dir: Path) -> Path:
    return run_dir / "status.json"


def load(run_dir: Path) -> dict:
    path = status_path(run_dir)
    if not path.exists():
        raise SystemExit(f"No status file at {path}. Run init first.")
    return json.loads(path.read_text(encoding="utf-8"))


def save(run_dir: Path, data: dict) -> None:
    data["updatedAt"] = now_iso()
    path = status_path(run_dir)
    temporary = path.with_suffix(".json.tmp")
    temporary.write_text(json.dumps(data, indent=2), encoding="utf-8")
    os.replace(temporary, path)


def push_log(data: dict, phase: str, detail: str) -> None:
    data.setdefault("log", [])
    data["log"].insert(0, {"at": now_iso(), "phase": phase, "detail": detail})
    del data["log"][40:]


def cmd_init(args: argparse.Namespace) -> None:
    repo = Path(args.repo).resolve()
    if not repo.is_dir():
        raise SystemExit(f"Repository path is not a directory: {repo}")
    properties = resolve_properties(args.properties)
    run_id = new_run_id()
    run_dir = repo / "han-code-quality-audit" / run_id
    suffix = 2
    while run_dir.exists():
        run_dir = repo / "han-code-quality-audit" / f"{run_id}-{suffix}"
        suffix += 1
        run_id = run_dir.name
    (run_dir / "tooling").mkdir(parents=True)
    data = {
        "runId": run_id,
        "repoName": repo.name,
        "startedAt": now_iso(),
        "updatedAt": now_iso(),
        "activity": {"phase": "detecting", "detail": "Starting the run"},
        "properties": [
            {
                "id": prop["id"],
                "name": prop["name"],
                "state": "queued",
                "mode": None,
                "findings": None,
                "report": None,
            }
            for prop in properties
        ],
        "tools": [],
        "log": [{"at": now_iso(), "phase": "detecting", "detail": "Starting the run"}],
    }
    save(run_dir, data)
    print(f"RUN_ID={run_id}")
    print(f"RUN_DIR={run_dir}")


def cmd_activity(args: argparse.Namespace) -> None:
    if args.phase not in PHASES:
        raise SystemExit(f"Unknown phase: {args.phase}")
    run_dir = Path(args.run_dir)
    data = load(run_dir)
    data["activity"] = {"phase": args.phase, "detail": args.detail}
    push_log(data, args.phase, args.detail)
    save(run_dir, data)


def cmd_property(args: argparse.Namespace) -> None:
    run_dir = Path(args.run_dir)
    data = load(run_dir)
    found = False
    for prop in data["properties"]:
        if prop["id"] != args.id:
            continue
        found = True
        prop["state"] = args.state
        if args.mode:
            prop["mode"] = args.mode
        if args.findings is not None:
            prop["findings"] = args.findings
        if args.report:
            prop["report"] = args.report
        detail = f"{prop['name']} · {args.state}"
        if args.mode:
            detail += f" · {args.mode}"
        push_log(data, data["activity"]["phase"], detail)
        break
    if not found:
        raise SystemExit(f"Property {args.id} is not in this run")
    save(run_dir, data)


def cmd_tool(args: argparse.Namespace) -> None:
    run_dir = Path(args.run_dir)
    data = load(run_dir)
    tools = data.setdefault("tools", [])
    record = next((item for item in tools if item["name"] == args.name), None)
    if record is None:
        record = {"name": args.name, "language": args.language or "", "startedAt": now_iso()}
        tools.append(record)
    record["state"] = args.state
    if args.language:
        record["language"] = args.language
    if args.output:
        record["output"] = args.output
    if args.detail:
        record["detail"] = args.detail
    if args.state == "running":
        record["startedAt"] = record.get("startedAt") or now_iso()
    else:
        record["endedAt"] = now_iso()
    detail = f"{args.name} · {args.state}"
    if args.detail:
        detail += f" · {args.detail}"
    phase = "running-tool" if args.state == "running" else data["activity"]["phase"]
    data["activity"] = {"phase": phase, "detail": detail}
    push_log(data, phase, detail)
    save(run_dir, data)


def make_handler(run_dir: Path):
    page = TEMPLATE.read_text(encoding="utf-8")

    class Handler(BaseHTTPRequestHandler):
        def do_GET(self) -> None:  # noqa: N802
            path = urlparse(self.path).path
            if path == "/status.json":
                body = status_path(run_dir).read_bytes()
                self._send(200, "application/json; charset=utf-8", body)
                return
            if path in ("/", "/index.html"):
                self._send(200, "text/html; charset=utf-8", page.encode("utf-8"))
                return
            self._send(404, "text/plain; charset=utf-8", b"Not found")

        def _send(self, code: int, content_type: str, body: bytes) -> None:
            self.send_response(code)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(body)

        def log_message(self, fmt: str, *args) -> None:
            return

    return Handler


def cmd_serve(args: argparse.Namespace) -> None:
    run_dir = Path(args.run_dir).resolve()
    if not status_path(run_dir).exists():
        raise SystemExit(f"No status file at {status_path(run_dir)}")
    if not TEMPLATE.exists():
        raise SystemExit(f"Missing progress template: {TEMPLATE}")
    handler = make_handler(run_dir)
    server = None
    port = 0
    for candidate in range(8765, 8800):
        try:
            server = ThreadingHTTPServer(("127.0.0.1", candidate), handler)
            port = candidate
            break
        except OSError:
            continue
    if server is None:
        raise SystemExit("Could not bind a progress port on 127.0.0.1:8765-8799")
    url = f"http://127.0.0.1:{port}/"
    (run_dir / "progress.url").write_text(url + "\n", encoding="utf-8")
    print(f"PROGRESS_URL={url}", flush=True)
    server.serve_forever()


def main() -> None:
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="command", required=True)

    init = sub.add_parser("init")
    init.add_argument("--repo", required=True)
    init.add_argument("--properties", default="all")
    init.set_defaults(func=cmd_init)

    activity = sub.add_parser("activity")
    activity.add_argument("--run-dir", required=True)
    activity.add_argument("--phase", required=True)
    activity.add_argument("--detail", required=True)
    activity.set_defaults(func=cmd_activity)

    prop = sub.add_parser("property")
    prop.add_argument("--run-dir", required=True)
    prop.add_argument("--id", required=True)
    prop.add_argument("--state", required=True, choices=("queued", "running", "done", "skipped"))
    prop.add_argument("--mode", choices=("baseline", "delta"))
    prop.add_argument("--findings", type=int)
    prop.add_argument("--report")
    prop.set_defaults(func=cmd_property)

    tool = sub.add_parser("tool")
    tool.add_argument("--run-dir", required=True)
    tool.add_argument("--name", required=True)
    tool.add_argument("--state", required=True, choices=("running", "done", "failed", "skipped"))
    tool.add_argument("--language", default="")
    tool.add_argument("--output", default="")
    tool.add_argument("--detail", default="")
    tool.set_defaults(func=cmd_tool)

    serve = sub.add_parser("serve")
    serve.add_argument("--run-dir", required=True)
    serve.set_defaults(func=cmd_serve)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
