---
'@kubb/plugin-react-query': minor
'@kubb/plugin-vue-query': minor
---

Add support for `nextParam` and `previousParam` in infinite queries with nested field access. This enables independent cursor extraction for bidirectional pagination using dot notation (e.g., `'pagination.next.id'`) or array paths (e.g., `['pagination', 'next', 'id']`). The existing `cursorParam` option is deprecated but remains functional for backward compatibility.
