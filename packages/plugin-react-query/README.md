<div align="center">

<!-- <img src="assets/logo.png" alt="logo" width="200" height="auto" /> -->
<h1>@kubb/plugin-tanstack-query</h1>

<p>
   Swagger integration for React-Query to generate all the different hooks based on an OpenAPI specification.
  </p>
  <img src="https://raw.githubusercontent.com/kubb-labs/kubb/main/assets/banner.png" alt="logo"  height="auto" />

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![Coverage][coverage-src]][coverage-href]
[![License][license-src]][license-href]

<h4>
    <a href="https://codesandbox.io/s/github/kubb-labs/kubb/tree/alpha/examples/typescript" target="_blank">View Demo</a>
    <span> · </span>
      <a href="https://kubb.dev/" target="_blank">Documentation</a>
    <span> · </span>
      <a href="https://github.com/kubb-labs/kubb/issues/" target="_blank">Report Bug</a>
    <span> · </span>
      <a href="https://github.com/kubb-labs/kubb/issues/" target="_blank">Request Feature</a>
  </h4>
</div>

## Supporting Kubb

Kubb uses an MIT-licensed open source project with its ongoing development made possible entirely by the support of Sponsors. If you would like to become a sponsor, please consider:

- [Become a Sponsor on GitHub](https://github.com/sponsors/stijnvanhulle)

<p align="center">
  <a href="https://github.com/sponsors/stijnvanhulle">
    <img src="https://raw.githubusercontent.com/stijnvanhulle/sponsors/main/sponsors.svg" alt="My sponsors" />
  </a>
</p>


<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/@kubb/plugin-tanstack-query?flat&colorA=18181B&colorB=f58517
[npm-version-href]: https://npmjs.com/package/@kubb/plugin-tanstack-query
[npm-downloads-src]: https://img.shields.io/npm/dm/@kubb/plugin-tanstack-query?flat&colorA=18181B&colorB=f58517
[npm-downloads-href]: https://npmjs.com/package/@kubb/plugin-tanstack-query
[license-src]: https://img.shields.io/github/license/kubb-labs/kubb.svg?flat&colorA=18181B&colorB=f58517
[license-href]: https://github.com/kubb-labs/kubb/blob/main/LICENSE
[build-src]: https://img.shields.io/github/actions/workflow/status/kubb-labs/kubb/ci.yaml?style=flat&colorA=18181B&colorB=f58517
[build-href]: https://www.npmjs.com/package/@kubb/plugin-tanstack-query
[minified-src]: https://img.shields.io/bundlephobia/min/@kubb/plugin-tanstack-query?style=flat&colorA=18181B&colorB=f58517
[minified-href]: https://www.npmjs.com/package/@kubb/plugin-tanstack-query
[coverage-src]: https://img.shields.io/codecov/c/github/kubb-labs/kubb?style=flat&colorA=18181B&colorB=f58517
[coverage-href]: https://www.npmjs.com/package/@kubb/plugin-tanstack-query

## options query

### v4

UseBaseQueryOptions => react-query only
UseQueryOptions => vue-query only
CreateQueryOptions => solid-query only
CreateQueryOptions => svelte-query only

### v5

UseBaseQueryOptions => react-query only https://github.com/TanStack/query/blob/ce1305c27e7ac7988656d171d882a665a286cc6a/packages/react-query/src/types.ts#L18
QueryObserverOptions => vue-query only https://github.com/TanStack/query/blob/main/packages/vue-query/src/useQuery.ts#L24
UseQueryOptions => solid-query only

## result query

### v4

UseQueryResult => react-query only
UseQueryReturnType => vue-query only
CreateQueryResult => solid-query only
CreateQueryResult => svelte-query only

### v5

UseQueryResult => react-query only
UseQueryReturnType => vue-query only

## queryOptions() query

### v5

queryOptions => react-query only

```typescript
{
  query: {
    types: {
      options: 'UseBaseQueryOptions'
      result: 'UseQueryResult'
    }
  }
}
```

## options mutation

### v4

UseMutationOptions => react-query only
VueMutationObserverOptions => vue-query only

### v5

UseMutationOptions => react-query only
MutationObserverOptions => vue-query only

## result mutation

### v4

UseMutationResult => react-query only
UseMutationReturnType => vue-query only

### v5

UseMutationResult => react-query only
UseMutationReturnType => vue-query only
