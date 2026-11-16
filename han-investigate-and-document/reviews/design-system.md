# Henaket design system

Write `docs/quality-security/design-system.md`. Template: [section-templates.md](../templates/section-templates.md). The root README cites this file.

Henaket is the design system government user interfaces are expected to use. Compatibility means the surface uses Henaket components or tokens. A similar color or a Bootstrap theme is not Henaket unless the code names it.

## What to establish

Search `Henaket`, `henaket`, and design-system package names. Then list every user surface and the UI stack the code actually uses (Web Forms, Razor, Blade, WinForms, Infragistics, CoreUI, and so on).

| Surface | Record |
|---------|--------|
| Citizen-facing pages | Host, template, and whether any file references Henaket |
| Staff web screens | Same |
| Desktop windows | Same. A staff-only program still gets a row. Say that it has no citizen-facing page. |

No match in the tree means this repository does not reference Henaket. Say that, and name the UI that is implemented. Do not infer compatibility from a screenshot or a ministry name.

## README and verdict

One "What is wrong" bullet lists the surfaces, states that they do not reference Henaket when that is the evidence, names the UI stack, and links `docs/quality-security/design-system.md`.

The verdict requires Henaket on surfaces a person uses. A replacement that keeps WinForms, Web Forms, or an admin template copied from a vendor does not meet it.
