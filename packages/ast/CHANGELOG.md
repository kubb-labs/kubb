# @kubb/ast

## 5.0.0-alpha.3

### Minor Changes

- [#2752](https://github.com/kubb-labs/kubb/pull/2752) [`827b444`](https://github.com/kubb-labs/kubb/commit/827b444e7c7c62d36ba9eaed7303ed0d18a7fa45) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - - Improved discriminator handling — named and inline enum variants are now generated correctly for discriminator properties.
  - Better support for string-based types (`uuid`, `email`, `url`, `datetime`, `date`, `time`) so they are consistently emitted as plain strings when expected.
  - Operation paths are now available in Express-style format (e.g. `/pets/:petId`) making it easier to use them directly in route definitions.

## 5.0.0-alpha.2

## 5.0.0-alpha.1

### Major Changes

- [`a4682ea`](https://github.com/kubb-labs/kubb/commit/a4682ea8896ef7d9ccae1b6e9abd6ed7bcaac073) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - The minimum required Node.js version is 22.

## 5.0.0-alpha.0

## 4.36.1

## 4.36.0

## 4.35.1

## 4.35.0

## 4.34.0

### Minor Changes

- [`6223e05`](https://github.com/kubb-labs/kubb/commit/6223e05881dafdd7bf4b2301e75dd853afcc5718) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Add `RootMeta` type to `RootNode` with optional `meta` field for format-agnostic API document metadata (`title`, `version`, `baseURL`). Convert all node `interface` declarations to `type` aliases for consistency.

## 4.33.5
