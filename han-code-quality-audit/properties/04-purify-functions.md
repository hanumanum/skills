# Purify functions

Slug: `purify-functions`

Write each finding in the report shape in SKILL.md. **Excerpt** is the inline block. **How to improve** names the destination file and the signature, with the parameter and return types that already exist. Group related functions into one issue when they belong in one module.

No tool. A pure function is deterministic: the same inputs always produce the same output. It does not read a database, call the network, log, mutate its arguments, read the environment, or call the clock, a random source, or an id generator. When the result depends on the clock, a random value, or config, that value is an argument. The function returns a value. The caller throws, navigates, persists, or logs.

Open handlers, services, jobs, stores, composables, and pages in every application. Do not stop after the first module. Tests are evidence only to confirm a helper already exists. Look for logic that is still inline:

- mapping one payload shape to another
- eligibility and status decisions
- totals, filters, and groupings
- date, money, name, address, and identifier formatting
- building a request or response body from data that is already loaded

Skip a trivial one-line filter. Skip a helper that is already named and already lives in a small module whose only job is that logic.

Do not invent types. Use the types already imported in the file. If a return shape is anonymous, describe the fields the code actually returns.

## Extract

Kind: `extract`

**Excerpt** is the inline block. **Why it is bad** says which I/O in the caller makes this block untestable where it sits, and what stays behind so the extracted function can be called without that I/O. The symbol is the suggested function name. **How to improve** names the destination file and the signature, with the parameter and return types that already exist. Group related functions into one module. Do not create one file per function.

If the current code mutates an input or throws, the extracted function returns the new value or a result descriptor. The caller assigns or throws.

If two copies look alike but the rules differ, report them as separate functions and say how they differ. Do not propose merging them.

## Already named, wrong file

Kind: `wrong-file`

The function already has a name and lives inside a service, job, store, composable, or component that also does I/O, navigation, or rendering.

Leave a function that already lives alone in a small module. Leave a function whose job is to throw a transport error; the decision table it uses can still move. When a function defaults to the current time, the direction drops that default and passes the clock from the caller.

**How to improve** is the destination file and the existing signature.

## Direction

Move an already-named function before extracting a new one that would call it. That is one sentence in the finding's direction, not a batch plan.
