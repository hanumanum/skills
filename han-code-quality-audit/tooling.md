# Tooling

External tools are optional. The scripts under `scripts/` never install them. Shipped scanners always run when their property is in the run.

Detection covers ten languages: JavaScript, TypeScript, Python, Java, C#, C++, PHP, Go, Rust, and Ruby. Other source the scanner recognizes (Kotlin, Swift, Vue, shell, SQL, and the rest of the list in `scripts/scope.py`) is still read by the agent. No extra tool is installed for it.

## Ask once

`check_tools.py` prints a JSON object with `missing[].name`, `missing[].install`, and `missing[].why`. Ask for every missing tool in one message. On yes, run only the install commands they accepted, then run `check_tools.py` again. If a tool is still missing, pass it in `--skip` and read the source for that signal. On no, pass the refused names in `--skip`.

Do not use `sudo`, `npx --yes`, or a package manager before they agree.

## What each tool is for

| Tool | Properties | Languages | Install |
| --- | --- | --- | --- |
| jscpd | 02 exact copies, 05 near-duplicates | whatever it can parse in the tree | `npm install -g jscpd` |
| radon | 08 complexity | Python | `python3 -m pip install --user radon` |
| gocyclo | 08 complexity | Go | `go install github.com/fzipp/gocyclo/cmd/gocyclo@latest` |
| rubocop | 08 complexity | Ruby | `gem install rubocop --user-install` |
| lizard | 08 complexity | JavaScript, TypeScript, Java, C#, C++, PHP, Rust. Also Python, Go, or Ruby when the preferred tool above is missing and lizard is already installed | `python3 -m pip install --user lizard` |
| madge | 07 modularity | JavaScript, TypeScript | `npm install -g madge` |
| byte-identical | 02 exact copies | in-scope source | shipped, `scripts/byte_identical.py` |
| import-graph | 07 modularity | the ten languages | shipped, `scripts/import_graph.py` |

Properties 01, 03, 04, 06, and 09 have no tool. They are read from source. Observability also reads the logging or observability guide named in its property file.

Complexity tools report cyclomatic counts. They do not apply the cognitive-complexity rubric. That score is read from the source.

## Scope the scripts already apply

Included: application source and tests, including source in languages outside the ten.

Skipped: dependency directories, build output, vendored trees, lockfiles, generated files, documentation (markdown, rst, adoc, txt, pdf), and `han-code-quality-audit/`. The directory and filename rules live in `scripts/scope.py`. When reading, do not open a path those rules skip.

Config files the program loads (yaml, toml, json that is not a lockfile), locale catalogs, and document or notification templates may be read on the hardcoded-literals pass and on both dedup passes. Do not feed them to the clone detector by hand. The exact-copy pass still reports a detector self-clone of generated JSON as one leave-it finding when the detector output contains it.

## Output names

Tool files go in the run's `tooling/` directory. The timestamp is the run id.

- `byte-identical.{timestamp}.json`
- `jscpd.{timestamp}.json`
- `import-graph.{language}.{timestamp}.json`
- `madge.{timestamp}.json`
- `lizard.{timestamp}.xml`
- `radon.python.{timestamp}.json`
- `gocyclo.go.{timestamp}.txt`
- `rubocop.ruby.{timestamp}.json`

A non-zero exit with a non-empty output file is still evidence. Read it. Do not treat the exit code as the finding.
