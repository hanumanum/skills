# Complexity

Slug: `complexity`

Write the report in the report shape in SKILL.md. The opening is the method and the band counts. Recurring shapes come before the numbered issues. Number full issues by the risk order in SKILL.md. A behavior bug comes before a high score that only makes the next edit easy to get wrong. Critical and high are full issues. Moderate stays one paragraph plus the index table, after the full issues; each index row still has an Id line, and that row is the whole write-up.

Kind on every id: `complexity`. The symbol is the function name. A band change on a later run keeps the same id.

Cyclomatic counts come from the tool output when the tool parsed that function: `lizard.{run-id}.xml`, `radon.python.{run-id}.json`, `gocyclo.go.{run-id}.txt`, `rubocop.ruby.{run-id}.json`. Cognitive counts come from reading the source. Where the tool and the source disagree on a cyclomatic count, the source wins, and the evidence quotes the construct that was miscounted. Do not invent a cognitive score for a function you did not open.

Score every function, method, closure, and script entry point you can open. Score a nested function on its own. Do not add its score to the parent. Name an anonymous one by how it is used.

Score tests separately from production code. Do not mix test scores into the production tables. Report the test maximum and whether any test crosses the moderate line.

Migrations are in scope and are scored the same way. Say so in the scope paragraph. A generated file or a vendored tree stays out of scope. If a tool scored one anyway, say so, and do not drop a critical or high function from that output without looking at it.

A template or view is in scope. Count the branching constructs in the markup (`v-if`, `if` blocks, conditional JSX, and loops). A long chain there is the same finding shape as a long chain in a function. Say what data the view should render instead.

## Cyclomatic

Start at 1. Add 1 for each conditional, each loop, each match arm that can be taken (not the fallback arm), each catch, each conditional expression, and each short-circuit boolean or null-coalescing operator. `else` does not add a point beyond its `if`. A nested function is scored on its own and is not added to the parent.

## Cognitive

Use the Sonar model. The same breaks in straight-line flow add 1 plus the current nesting level: if, conditional expression, switch, loop, catch, and a nested function inside one of those. `else` and `else if` add 1 and do not add a further nesting bonus. A run of the same logical operator adds 1, not 1 per operator. A change of operator, or parentheses, starts a new run. Each optional read adds 1. A direct recursive call adds 1. An unlabeled break or continue does not. A labeled break that leaves more than the innermost structure does.

Where the cognitive score is mostly optional reads, also give a structure score: cognitive minus those optional-read increments.

## Bands

| Band | Rule |
| --- | --- |
| Moderate | cyclomatic ≥ 10 or cognitive ≥ 10 |
| High | cyclomatic ≥ 15 or cognitive ≥ 15 |
| Critical | cyclomatic ≥ 20 or cognitive ≥ 25 |

A long flat switch is high cyclomatic and only moderate cognitive. Say which kind you are looking at.

## What to write

Scope, in a few lines: which trees were scored, which tool files were used, how many functions were scored, and that the scores came from the source. Open every function for a cognitive score, including those under cyclomatic 10. A function you did not open has no cognitive score. Say that count. Do not give it a cognitive score of 1.

Summary: production counts by cognitive band and by cyclomatic band, for the functions you actually scored. Hottest function. Test result in one or two sentences.

Recurring shapes: a pattern that shows up more than once. These are findings only when you also write each function up below. The shape paragraph says why one helper would apply to all of them.

Critical and high: one finding each, or one finding for a set of twins (the same function copied, or the same ladder copied). **Where** includes both scores, the structure score when it differs, and the length. **Excerpt** is the code that causes the score. **Why it is bad** says which edit is unsafe: a branch an editor will miss, a test that cannot name the path, or a user-visible outcome the nesting hides. **How to improve** names the helper, table, or split that removes that risk. Do not paste a rewrite. Do not split a function only because the number is high.

If the branching hides a behavior bug, the user-visible or data-visible effect is the reason, and the split is only how to make that effect local. A handled error that falls through, a success value returned on an unknown failure, a check that accepts input it was meant to reject, or a literal id buried in a client, are this kind of finding.

Moderate: do not write a full section per function. One paragraph on the recurring moderate patterns. Then an index table: cognitive, cyclomatic, length, hardness, name, path. Hardness is the label from SKILL.md. Each index row is still a finding and still has an Id line so the next run can match it. The row is the full writeup for a moderate function.

Drop empty sections and say they are empty.

## Avoid

- Do not add a complexity limit and then suppress it on the files in this report.
- Do not split a flat list of guards into tiny functions that only throw. A rule table keeps the messages searchable.
- Do not treat a flat switch of routes as a nesting problem.
