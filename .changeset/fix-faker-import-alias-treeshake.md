---
'@kubb/ast': patch
---

Fixed `combineImports` incorrectly tree-shaking aliased named imports.

When an import uses a local alias (e.g. `import { fakerDE as faker } from '@faker-js/faker'`), the used-check now tests the alias (`faker`) rather than the original export name (`fakerDE`). Previously, any aliased import whose propertyName did not appear verbatim in the generated source was silently dropped, leaving files with no import at all.
