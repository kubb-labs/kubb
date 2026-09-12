---
'@kubb/plugin-barrel': patch
'@kubb/core': patch
---

Report a diagnostic instead of emitting a barrel that cannot parse.

Two files in one barrel directory are free to declare the same name, but a barrel re-exporting both
produces a duplicate binding — a parse error, not a type error. The barrel was emitted anyway, so
the failure surfaced from whatever bundler read it, pointing at the generated file rather than at
the two sources that collided. The duplicate is now dropped and reported as
`KUBB_BARREL_DUPLICATE_EXPORT`, naming both files.
