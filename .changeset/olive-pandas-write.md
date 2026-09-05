---
'@kubb/cli': patch
---

`kubb init` and `kubb generate --watch` now print plain lines when the terminal cannot carry
clack's gutter, such as a piped run or CI. They wrote box-drawing and cursor escapes into the
output before. Spinner steps print as lines there instead of disappearing with the animation.
