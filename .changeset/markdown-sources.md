---
"@kubb/ast": patch
"@kubb/renderer-jsx": patch
---

Keep every `Heading`, `Paragraph`, `List`, `Callout`, and `Frontmatter` in a markdown file. Each one used to share a source name, so a file kept only the first of each kind. An unnamed source now only drops when the same node is added twice, so a file can repeat a paragraph or a table.
