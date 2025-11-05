---
'@kubb/plugin-client': minor
---

- add configurable `bundle` option defaulting to false so generated clients re-use `@kubb/plugin-client/clients/*` by default
- keep `.kubb/fetcher.ts` bundling available when explicitly enabling the option for Kubb v4.5 compatibility
