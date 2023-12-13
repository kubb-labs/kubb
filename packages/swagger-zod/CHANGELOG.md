# @kubb/swagger-zod

## 2.0.2

### Patch Changes

- [#718](https://github.com/kubb-project/kubb/pull/718) [`31c7870`](https://github.com/kubb-project/kubb/commit/31c7870c0519b6368f4209ff6817029bdfc630f9) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Generated zod schema causes ReferenceError in case of self-referencing property

- Updated dependencies []:
  - @kubb/core@2.0.2
  - @kubb/parser@2.0.2
  - @kubb/react@2.0.2
  - @kubb/swagger@2.0.2

## 2.0.1

### Patch Changes

- Updated dependencies []:
  - @kubb/core@2.0.1
  - @kubb/parser@2.0.1
  - @kubb/react@2.0.1
  - @kubb/swagger@2.0.1

## 2.0.0

### Major Changes

- [#686](https://github.com/kubb-project/kubb/pull/686) [`0c894ca`](https://github.com/kubb-project/kubb/commit/0c894ca935045272a3427ed5646a83184646e354) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - swagger-ts with output object

- [#678](https://github.com/kubb-project/kubb/pull/678) [`48b7ff2`](https://github.com/kubb-project/kubb/commit/48b7ff246a3459bb7a9be6d430407c2538d3b2eb) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - swagger `Infer<typeof oas>` type

### Minor Changes

- [`210d58f`](https://github.com/kubb-project/kubb/commit/210d58fd1fcc1e8d84f38fdfabbb59630a7394b5) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - `exportType` to disable the creation of barrel files

- [#683](https://github.com/kubb-project/kubb/pull/683) [`c7722cf`](https://github.com/kubb-project/kubb/commit/c7722cf16113e4d7ac33e5281e650e707a1e5f88) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - add `const` logic + move `schema.format` to `getBaseTypeFromSchema` instead of `getTypeFromProperties`

### Patch Changes

- [#689](https://github.com/kubb-project/kubb/pull/689) [`8044907`](https://github.com/kubb-project/kubb/commit/8044907f560f1e9a6120df259568b9213a4f1e4a) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - path.extName to set `.ts` or `.js` to the barrel files

- [#707](https://github.com/kubb-project/kubb/pull/707) [`955f8ed`](https://github.com/kubb-project/kubb/commit/955f8edc26ca303f3432ed875a97e249c88df89b) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - use of combineFiles

- [`e17bc7c`](https://github.com/kubb-project/kubb/commit/e17bc7ccfb91aeab52488e847356890464aa6166) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - tsup build cleanup with `splitting`

- Updated dependencies [[`0c894ca`](https://github.com/kubb-project/kubb/commit/0c894ca935045272a3427ed5646a83184646e354), [`955f8ed`](https://github.com/kubb-project/kubb/commit/955f8edc26ca303f3432ed875a97e249c88df89b), [`d729470`](https://github.com/kubb-project/kubb/commit/d729470b74121eef6776649654921ce61b35da51), [`d729470`](https://github.com/kubb-project/kubb/commit/d729470b74121eef6776649654921ce61b35da51), [`48b7ff2`](https://github.com/kubb-project/kubb/commit/48b7ff246a3459bb7a9be6d430407c2538d3b2eb), [`8044907`](https://github.com/kubb-project/kubb/commit/8044907f560f1e9a6120df259568b9213a4f1e4a), [`6348057`](https://github.com/kubb-project/kubb/commit/634805723409381eace8e68fd5f2eab6f737dd7a), [`210d58f`](https://github.com/kubb-project/kubb/commit/210d58fd1fcc1e8d84f38fdfabbb59630a7394b5), [`0c894ca`](https://github.com/kubb-project/kubb/commit/0c894ca935045272a3427ed5646a83184646e354), [`48b7ff2`](https://github.com/kubb-project/kubb/commit/48b7ff246a3459bb7a9be6d430407c2538d3b2eb), [`955f8ed`](https://github.com/kubb-project/kubb/commit/955f8edc26ca303f3432ed875a97e249c88df89b), [`d729470`](https://github.com/kubb-project/kubb/commit/d729470b74121eef6776649654921ce61b35da51), [`955f8ed`](https://github.com/kubb-project/kubb/commit/955f8edc26ca303f3432ed875a97e249c88df89b), [`e17bc7c`](https://github.com/kubb-project/kubb/commit/e17bc7ccfb91aeab52488e847356890464aa6166)]:
  - @kubb/swagger@2.0.0
  - @kubb/core@2.0.0
  - @kubb/parser@2.0.0
  - @kubb/react@2.0.0
