# Separation of concerns

Slug: `separation-of-concerns`

Write each finding in the report shape in SKILL.md.

No tool. A problem is one unit (function, class, component, job, handler, or file) with more than one reason to change. A reason to change is a fact that can change while the unit's other facts stay the same.

Report a problem only when you can point at the code. Do not force a finding for every category. Name a category only when at least one issue matches it.

## How to search

Do both passes. The catalog pass misses a mix the list did not name. The second pass is what makes the search complete. Do not stop after the longest file in the first application.

1. Walk entry points and boundaries. Entry points: handlers, queue consumers, jobs, commands, UI routes, stores, subscribers. Boundaries: database calls, external calls, file and document generation, secrets, notification sends, clock checks, environment branches. Open each entry point, not a sample of them.
2. Open the largest units by length and by number of imports. Write the reasons each would change. If a reason is not that unit's job, report it even when it matches no category. Say which two reasons share the unit.

## Categories

1. `delivery-in-decision` — the unit chooses a transport status or throws the framework's error type, and a caller branches on that type. One function throws that error and a neighbor returns it. A persistence failure, an upstream failure, and a business refusal are the same object. Or the handler both parses the request and runs the rule.
2. `whole-use-case` — one function loads state, decides policy, calls an external system, and writes storage, with no seam. Orchestration is a valid job only when the function sequences steps and does not contain the steps.
3. `cross-feature` — one feature reads another product's tables, calls another feature's use cases, or enforces another feature's step rules. A shared module contains a rule only one feature owns.
4. `decision-copied` — the same status machine, price rule, permission, or validation lives in two layers, and each copy chooses a route, a label, or whether an action is allowed.
5. `storage-in-rule` — the unit names tables, collections, query fields, or write payloads next to the business condition.
6. `upstream-in-rule` — request building, response parsing, provider status phrases, upstream auth, retries, or timeouts share a function with the business decision. An upstream payload is used without the schema the client already has. The same upstream client retries in one caller and not in another.
7. `credentials-in-operation` — the unit reads a private key, signs a token, or builds an auth header while it also pays, signs a document, or expires a record.
8. `mode-in-operation` — a production function branches on mock mode, fixtures, or a flag and then either calls the real system or reads fake data. A flag that only sets a threshold is not this.
9. `presentation-and-state` — a page renders, validates, submits, and navigates. A store holds unsaved input and the fetched record. A component draws the screen and decides the next workflow step.
10. `time-in-rule` — expiry math, cron intervals, sleep, or retry loops sit in the same function as the business condition. The job is the use case.
11. `mechanism-buries-rule` — a transaction, idempotency key, lock, cache, retry, audit write, or metric is written through the business function so the rule cannot be read without the mechanism. A thin wrapper that starts a transaction and calls one use case is not this.
12. `auth-mixed-with-precondition` — "who may call" and "which state allows this action" are decided in the same branch.
13. `content-in-state-change` — email, message, or document composition happens in the function that changes the record.
14. `representation-in-decision` — mapping, localization, money or date formatting, or encoding happens in the function that decides.
15. `policy-literals` — thresholds, fees, status names, or allowed transitions are raw values in more than one place, or a connection string or timeout sits inside a business function. A single literal in the function that owns the rule is not this. Duplicated literals are the hardcoded-literals pass when this pass is not also looking at a mixed unit. Report it here only when the literal shares a unit with another job.
16. `validation-mixed-with-invariant` — the edge schema and the domain rule live in one function, or the domain function re-parses raw input the edge already parsed.

## Traps

Call these out in the finding when they are real. The direction must not "fix" them by changing behavior.

- Two lists look the same and are not. Name the difference. Do not tell anyone to merge them.
- Two sequences look like one cancel flow and run different steps. Do not collapse them into one function that always does every step.
- A secret is constructed or returned from a use case.
- A debug print or a second logger sits next to the real logger.
- An untyped or widened request body is written to storage when a schema at the boundary already exists.
- A catch turns every failure into one outcome, so an outage and a missing record take the same path.
- Two copies of a helper differ by a field name. The direction keeps both fields.

A pure import-direction problem, with no unit doing two jobs, is out of this pass. One sentence at the end of the report can say that modularity owns it. Do not list those imports as findings.

## Finding text

**Where** names the unit and both jobs it is doing.

**Why it is bad** names the failure an editor hits if the two jobs stay together, and the failure if they "fix" it by collapsing a trap. When a trap above is real, the reason is that trap, with the lines that differ.

**How to improve** says which job stays in this unit and which job moves. Name the destination file (the service that already owns that job, or a new file next to it). Do not describe a sequence of edits.
