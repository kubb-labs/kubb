---
paths:
  - "**/*.md"
  - "**/*.mdx"
---

# Markdown structure

The writing voice (no dashes or clause-joining semicolons, sentence-case headings, no emoji, no
marketing words, cut filler) is set by the always-on `house` output style, and the `humanizer`
skill is the full reference. For the complete writing guide (voice, content patterns, SEO) use
the `documentation` skill. This rule adds only the markdown-structure specifics:

- No inline-header bullet lists (`- **Speed**: faster load times`). Write a sentence instead
- Do not bold product names or ordinary words mid-sentence

## Exception

`docs/changelog.md` follows the `changelog` skill's emoji-prefixed section format
(`### ✨ Features`, `🐛 Bug Fixes`, `🚀 Breaking Changes`, `📦 Dependencies`).

## Before committing

Run the `humanizer` skill over any user-facing markdown you write or edit (READMEs, docs,
changesets, plugin copy) and fix the tells it surfaces in that same pass. Do this by default as
part of writing the file, not only when asked.
