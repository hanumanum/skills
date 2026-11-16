# Architectural consistency

Slug: `architectural-consistency`

Write each finding in the report shape in SKILL.md. **Why it is bad** says which request gets the wrong status, write, or payload if the use case stays where it is. The reference handler is quoted in the opening, not repeated as its own issue.

No tool. This is the only property that reads architecture documents. Other properties do not.

## Stated style, or the nearest one

Search the repository for files whose subject is an architectural style or an architectural decision. That includes ADRs, architecture notes, and a comment or docstring that states a style or a decision. A README counts only for the sentences that state a style or a decision. Ignore setup instructions, agent instruction files, and this audit's own reports.

If at least one such document exists, the style is whatever those documents say. Quote each document that states a rule. Compare the code to those rules. A finding is a place the code breaks a stated rule. Do not replace the stated style with a different one you would prefer.

If no document states a style or a decision, do not invent one from a template. Read how requests are composed and how a handler reaches persistence or an upstream client. From the folders, imports, and call paths, name the style that is the shortest move away from the current structure. Say what is already in place, and what one change of shape would make the rest of the code match it. If the code never introduces ports, aggregates, or repositories, do not pick a style that needs them.

The first paragraphs of the report, before any finding, are the architecture to follow. Use this heading:

```markdown
## Architecture to follow
```

When documents state a style, that section quotes the rules and names the files. That stated style is the one to follow. Do not substitute a different style.

When no document states a style, that section names the nearest style and why it is the short move from the current structure. That nearest style is the one to follow.

Findings come after this section. Each finding is a break from the architecture to follow.

## What to establish

1. The style from the case above, and the dependency rule it implies: who may import whom, and where a use case is supposed to live.
2. Where that rule is broken in the code.

Breaks to look for:

- a use case written in a handler
- a use-case function exported from a route file
- a shared module importing a feature module
- feature modules importing each other
- persistence or an upstream client called from the route file
- a handler that calls two services, with a check between them

State the reference once, above the findings, when one route already does all of the following: the handler reads the request context and validated input, calls exactly one use-case function, that function lives in a service module, loading and checks and persistence and outbound calls happen inside that function, and the handler parses the response and returns it. Name the route file, the service file, and the function. Quote the handler.

If no route has that shape, say so in the opening and do not invent one. Findings still stand.

## Coverage

Open every route file mounted by each application's composition root, including routes in a second or third app. A route that already matches the reference is not a finding. A route you did not open is not a route you left.

Cookie and session-token checks stay in the handler. They are part of reading the request. Do not file that route.

A helper exported from a route file for tests or for another module is a finding even when the handler itself is one call. Name those tests and callers in the finding. The service file is the one that module already uses. Router wiring files stay wiring files.

## Findings

Report a break, not a route that already matches the reference.

Kinds:

- `use-case-in-handler`
- `use-case-exported-from-route`
- `shared-imports-feature`
- `feature-imports-feature`
- `persistence-from-route`
- `upstream-from-route`
- `handler-calls-two-services`

**How to improve** is one of:

- Fold: name the single service function that should own the calls.
- Move: name the service file and the function.
- Leave the request-boundary work in the handler when it only reads a cookie or a session token and returns the unauthenticated response. Do not file that as a finding.

Behavior stays as it is: same status codes, same error reasons, same writes. Do not propose a repository interface, a new domain model, or a new module boundary.
