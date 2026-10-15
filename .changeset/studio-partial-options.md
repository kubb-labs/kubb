---
'@kubb/studio': minor
---

Report the editable parts of an object option that also holds code. For `output: { path: './gen', banner: () => '' }`, the plugin view now carries `value: { path: './gen' }` and `locked: [['banner']]`, so Studio can edit `output.path` and keep `banner` as it is. Options that are entirely literal or entirely code report the same as before.
