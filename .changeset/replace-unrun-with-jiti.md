---
'@kubb/cli': patch
'@kubb/mcp': patch
---

Replace `unrun` with `jiti` for loading TypeScript config files at runtime. `jiti` is pure JavaScript (no native binaries), eliminating platform-specific `.node` binding errors when running on `linux-arm64` or other architectures that differ from the build host.
