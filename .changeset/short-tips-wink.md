---
'@kubb/plugin-client': minor
'@kubb/plugin-react-query': minor
'@kubb/plugin-vue-query': minor
'@kubb/plugin-solid-query': minor
'@kubb/plugin-svelte-query': minor
'@kubb/plugin-swr': minor
---

- add configurable `bundle` option defaulting to false so generated clients re-use `@kubb/plugin-client/clients/*` by default
- keep `.kubb/fetcher.ts` bundling available when explicitly enabling the option for Kubb v4.5 compatibility
- align `@kubb/plugin-{react,vue,solid,svelte}-query` and `@kubb/plugin-swr` defaults to the shared runtime while exposing the same opt-in bundling flag
