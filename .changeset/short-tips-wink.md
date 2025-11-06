---
'@kubb/plugin-client': patch
'@kubb/plugin-react-query': patch
'@kubb/plugin-vue-query': patch
'@kubb/plugin-solid-query': patch
'@kubb/plugin-svelte-query': patch
'@kubb/plugin-swr': patch
---

- add configurable `bundle` option defaulting to false so generated clients re-use `@kubb/plugin-client/clients/*` by default
- keep `.kubb/fetch.ts` bundling available when explicitly enabling the option for Kubb v4.5 compatibility
- align `@kubb/plugin-{react,vue,solid,svelte}-query` and `@kubb/plugin-swr` defaults to the shared runtime while exposing the same opt-in bundling flag
