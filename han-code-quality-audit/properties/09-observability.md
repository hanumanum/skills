# Observability

Slug: `observability`

Write each finding in the report shape in SKILL.md. **Why it is bad** says which log line, error response, or trace a later reader cannot correlate, or which client receives a field the guide says stays on the server. **How to improve** names the logger, constant, or handler the guide already uses. Same status codes, same client messages, same writes.

No tool. This property reads one logging or observability guide, then compares server-side source to that guide.

## Which guide

Search the repository for a document whose subject is observability, logging, tracing, or error handling for logs. A file counts when its name or its title contains "logging", "observability", "tracing", or "error handling". Ignore this audit's reports, agent instruction files, and README sentences that only say how to start a process.

If at least one such document exists, that document is the guide. When several exist, use all of them and quote the rule each finding breaks. Do not replace a repository guide with the fallback, and do not merge the two.

If none exist, the guide is `guides/03.logging-guide.md` next to this skill. Paths, package names, and product names in that file are examples of the rule. Map each rule onto the logger, error type, and request-id field this repository actually has. Do not file a finding because an example path is absent. Do not name the example product in the report.

The checklist is the guide's rules and its tracing or profiling section. Tutorial snippets and "adding a new module" samples are not findings. A comment that disagrees with the code is ignored. The code is what is compared to the rule.

The opening of the report, before the index, names the guide by repo-relative path, or `guides/03.logging-guide.md` when the fallback was used. Quote the rules this pass applied, in a few sentences. Use this heading:

```markdown
## Guide
```

## Coverage

Open every server path that logs or throws: request handlers, services, jobs, server routes, plugins, and middleware, in every application. Client-only code is in scope only where the guide states a rule for it, such as a required client-error reporter. Do not stop after the first file or the first logger.

A call that already matches the guide is not a finding. The exception the guide states, such as a process-exit path that runs before the logger exists, is not a finding. Name that file in the opening.

## What to find

One issue per broken rule. When the same break is in many call sites, one issue holds a table of file, symbol, and the missing or wrong field. Do not write a second essay per row.

1. A server-side `console.log`, `console.warn`, `console.error`, or `console.debug` where the guide requires the logger.
2. An event name written as a string where the guide requires the shared event constant.
3. A logger call whose structured object omits `event` or `event_type` where the guide requires both.
4. A correlation field under a name the guide forbids, such as `reqId` where the guide requires `requestId`.
5. An error log that does not pass the error as `err` where the guide requires that key so the serializer keeps the stack.
6. A response log whose level does not follow the guide's status rule: success at info, 4xx at warn, 5xx at error.
7. A handler `catch` that returns an error response and does not rethrow, where the guide says to let the error reach the global handler or to log and rethrow.
8. An external-call failure that throws without the integration log the guide requires first.
9. A client error body that includes a stack, or that omits `code`, `message`, or `requestId`, where the guide fixes that body.
10. A tracing or profiling hook the guide says exists and the source does not, or a provider the guide says is unused and the source imports. Do not invent a tracer, an exporter, or a profiler the guide does not require.

## Kinds

- `console-log`
- `hardcoded-event`
- `missing-log-fields`
- `request-id-name`
- `error-not-serialized`
- `level-mismatch`
- `swallowed-error`
- `integration-not-logged`
- `client-error-body`
- `trace-hook`

The symbol is the function that logs or throws. Use `file` when the problem is the whole module.

**How to improve** points at the logger module, the event constant, or the error handler the guide names. It does not add a new APM stack. It does not change a status code or a client message except to drop a field the guide says the client must not receive, or to add `requestId` where the guide requires it and the handler already has the id.
