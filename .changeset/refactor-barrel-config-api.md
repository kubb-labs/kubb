---
"@kubb/middleware-barrel": major
---

Replace string-based `barrelType` with an object-based `barrel` configuration.

- Root config: `barrel?: { type: 'all' | 'named' } | false`
- Plugin level: `barrel?: { type: 'all' | 'named', nested?: boolean } | false`
- `barrelType: 'propagate'` replaced with `barrel: { type: 'all' | 'named', nested: true }`
