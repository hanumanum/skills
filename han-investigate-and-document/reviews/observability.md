# Observability

The page is `docs/operations/observability-guide.md`. Add a **Gaps** section. Do not create a second observability file. Template: [section-templates.md](../templates/section-templates.md). The root README cites this file.

## What to establish

Search logs, metrics, traces, health routes, and alert config. Cite the file for each row.

| Mechanism | Record |
|-----------|--------|
| Logs | Library, file or sink, level, and whether a person or a correlation id is on the line. Empty log folders are evidence the tree has no sample, not evidence that production is silent. |
| Metrics | Endpoint or exporter, or none |
| Traces | Propagated trace id, or none |
| Alerts | Rule, dashboard, or none. A table of failed jobs with no notifier is not an alert. |
| Health | Route or probe that checks the process, or none. An error page that the pipeline names and that does not exist is a gap. |

Write the mechanisms that exist and the ones that do not. A file log means the system is not without logging. Say which of metrics, traces, alerts, and health are absent.

When the code records who changed a record, cite that file. When it does not, say so on this page. Do not fold that into "no logs" when a log file exists.
