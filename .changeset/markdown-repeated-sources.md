---
'@kubb/ast': patch
---

Markdown files keep every heading, paragraph, and list. `createFile` deduplicated sources by name, and the Markdown components of `@kubb/renderer-jsx` all share one name per kind, so a file kept only its first heading, first paragraph, and first list.
