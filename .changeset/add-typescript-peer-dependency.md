---
'@kubb/plugin-ts': patch
---

Add TypeScript as a peerDependency to fix mapper feature compatibility. The `mapper` option uses TypeScript's factory API (ts.PropertySignature), so TypeScript must be installed by consumers using this feature.
