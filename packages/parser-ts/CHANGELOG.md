# @kubb/parser-ts

## 5.0.0-alpha.71

### Patch Changes

- Updated dependencies []:
  - @kubb/core@5.0.0-alpha.71

## 5.0.0-alpha.70

### Patch Changes

- Updated dependencies [[`b710e97`](https://github.com/kubb-labs/kubb/commit/b710e97ef71758f2a0138b85099bfad966cf2f3b), [`649874b`](https://github.com/kubb-labs/kubb/commit/649874b2f1d05cec0160da62daef23579b400f66)]:
  - @kubb/core@5.0.0-alpha.70

## 5.0.0-alpha.69

### Patch Changes

- Updated dependencies []:
  - @kubb/core@5.0.0-alpha.69

## 5.0.0-alpha.67

### Patch Changes

- Updated dependencies []:
  - @kubb/core@5.0.0-alpha.67

## 5.0.0-alpha.66

### Patch Changes

- Updated dependencies []:
  - @kubb/core@5.0.0-alpha.66

## 5.0.0-alpha.65

### Patch Changes

- Updated dependencies []:
  - @kubb/core@5.0.0-alpha.65

## 5.0.0-alpha.64

### Patch Changes

- Updated dependencies []:
  - @kubb/core@5.0.0-alpha.64

## 5.0.0-alpha.63

### Patch Changes

- Updated dependencies []:
  - @kubb/core@5.0.0-alpha.63

## 5.0.0-alpha.62

### Patch Changes

- Updated dependencies []:
  - @kubb/core@5.0.0-alpha.62

## 5.0.0-alpha.61

### Patch Changes

- Updated dependencies []:
  - @kubb/core@5.0.0-alpha.61

## 5.0.0-alpha.60

### Patch Changes

- Updated dependencies []:
  - @kubb/core@5.0.0-alpha.60

## 5.0.0-alpha.59

### Patch Changes

- [#3156](https://github.com/kubb-labs/kubb/pull/3156) [`a91e448`](https://github.com/kubb-labs/kubb/commit/a91e448f6f08fc78c956cfe0662ffec75fac14cd) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Internal cleanup: dedupe backend code and drop unused exports.

  - `@kubb/parser-ts`: add `src/constants.ts` (regex + path-prefix literals); dedupe `printFunction`/`printArrowFunction` via `formatGenerics` / `formatReturnType`; dedupe the import/export path resolution inside `parserTs.parse` into `resolveOutputPath`.
  - `@kubb/core`: collapse `FileManager#add` and `FileManager#upsert` onto a shared private `#store` helper (`mergeFilesByPath`); drop unused `DEFAULT_CONCURRENCY` / `PATH_SEPARATORS` constants.
  - `@kubb/ast`: drop unused `parameterLocations` and `DEFAULT_STATUS_CODE` constants.
  - `@kubb/cli`: remove unreferenced `GENERATE_FLAGS` / `VALIDATE_FLAGS` / `INIT_FLAGS` / `AGENT_START_FLAGS` / `ARGS` sets; rename `QUITE_FLAGS` → `QUIET_FLAGS`.
  - `@internals/utils`: un-export internal `randomColors` constant (only used by `randomCliColor`).
  - Tests: extract `createSetupCtxStub` in `definePlugin.test.ts` to kill three copies of the same setup-ctx literal.

- Updated dependencies [[`a91e448`](https://github.com/kubb-labs/kubb/commit/a91e448f6f08fc78c956cfe0662ffec75fac14cd)]:
  - @kubb/core@5.0.0-alpha.59

## 5.0.0-alpha.58

### Patch Changes

- Updated dependencies []:
  - @kubb/core@5.0.0-alpha.58

## 5.0.0-alpha.57

### Patch Changes

- Updated dependencies []:
  - @kubb/core@5.0.0-alpha.57

## 5.0.0-alpha.56

### Patch Changes

- Updated dependencies [[`45acd89`](https://github.com/kubb-labs/kubb/commit/45acd890db6c022c654de8102c284ee898d019b8)]:
  - @kubb/core@5.0.0-alpha.56

## 5.0.0-alpha.55

### Patch Changes

- Updated dependencies [[`fd014c6`](https://github.com/kubb-labs/kubb/commit/fd014c6870ae4eefbe5ea8fac32ab9ba226defa9), [`535a2db`](https://github.com/kubb-labs/kubb/commit/535a2db4acbe2f37966190c1330d76f541afed00)]:
  - @kubb/core@5.0.0-alpha.55

## 5.0.0-alpha.54

### Patch Changes

- Updated dependencies [[`edf99aa`](https://github.com/kubb-labs/kubb/commit/edf99aaae51d8a70ee8d919bf619951a998d5a13)]:
  - @kubb/core@5.0.0-alpha.54

## 5.0.0-alpha.53

### Patch Changes

- Updated dependencies [[`72025d7`](https://github.com/kubb-labs/kubb/commit/72025d7255c7d09b69b2665b938a9a5fd3890cf7)]:
  - @kubb/core@5.0.0-alpha.53

## 5.0.0-alpha.52

### Patch Changes

- Updated dependencies [[`8d7cec1`](https://github.com/kubb-labs/kubb/commit/8d7cec1bf37e74dfdc6c03f61582b619284132c2)]:
  - @kubb/core@5.0.0-alpha.52

## 5.0.0-alpha.51

### Patch Changes

- Updated dependencies [[`570d8d5`](https://github.com/kubb-labs/kubb/commit/570d8d514e8c1864c1981763ff61ac5cdc4c10db)]:
  - @kubb/core@5.0.0-alpha.51

## 5.0.0-alpha.50

### Patch Changes

- Updated dependencies [[`80d43c6`](https://github.com/kubb-labs/kubb/commit/80d43c66c86ee69359c78184024497f4e2eb1d3e)]:
  - @kubb/core@5.0.0-alpha.50

## 5.0.0-alpha.49

### Patch Changes

- Updated dependencies []:
  - @kubb/core@5.0.0-alpha.49

## 5.0.0-alpha.48

### Patch Changes

- Updated dependencies [[`14312ef`](https://github.com/kubb-labs/kubb/commit/14312efe209087fc3da44c4a5c2286242f721308)]:
  - @kubb/core@5.0.0-alpha.48

## 5.0.0-alpha.47

### Patch Changes

- Updated dependencies [[`0917caf`](https://github.com/kubb-labs/kubb/commit/0917caf89b1e94268a890c5320c2db43cc6b9dde)]:
  - @kubb/core@5.0.0-alpha.47

## 5.0.0-alpha.46

### Patch Changes

- Updated dependencies [[`7705bc8`](https://github.com/kubb-labs/kubb/commit/7705bc8cc5c99242afe99aab61d8c1bcb9766be9)]:
  - @kubb/core@5.0.0-alpha.46

## 5.0.0-alpha.45

### Patch Changes

- Updated dependencies [[`c5f4e9b`](https://github.com/kubb-labs/kubb/commit/c5f4e9b23c98d901d1c1aba1e398d895a1f04e77)]:
  - @kubb/core@5.0.0-alpha.45

## 5.0.0-alpha.44

### Patch Changes

- Updated dependencies [[`96ac140`](https://github.com/kubb-labs/kubb/commit/96ac140638e1c10bbdf91840f0c8271c91124c03)]:
  - @kubb/core@5.0.0-alpha.44

## 5.0.0-alpha.43

### Patch Changes

- Updated dependencies [[`8c7f0bd`](https://github.com/kubb-labs/kubb/commit/8c7f0bd19201f842bb418fe42ae3bda17951ce66)]:
  - @kubb/core@5.0.0-alpha.43

## 5.0.0-alpha.42

### Patch Changes

- Updated dependencies []:
  - @kubb/core@5.0.0-alpha.42

## 5.0.0-alpha.41

### Patch Changes

- Updated dependencies [[`d3d2d81`](https://github.com/kubb-labs/kubb/commit/d3d2d816dc93c0b328eb2f43827d7513fe4d988b)]:
  - @kubb/core@5.0.0-alpha.41

## 5.0.0-alpha.40

### Patch Changes

- Updated dependencies [[`ce8322c`](https://github.com/kubb-labs/kubb/commit/ce8322c37dfeb078a2408c5c80e3cf26f0aa0d75)]:
  - @kubb/core@5.0.0-alpha.40

## 5.0.0-alpha.39

### Patch Changes

- Updated dependencies []:
  - @kubb/core@5.0.0-alpha.39

## 5.0.0-alpha.38

### Patch Changes

- Updated dependencies []:
  - @kubb/core@5.0.0-alpha.38

## 5.0.0-alpha.37

### Patch Changes

- Updated dependencies [[`f7d19bb`](https://github.com/kubb-labs/kubb/commit/f7d19bb69177fbd1b54c855423b3b55c399678b0)]:
  - @kubb/core@5.0.0-alpha.37

## 5.0.0-alpha.36

### Patch Changes

- Updated dependencies [[`e2910e9`](https://github.com/kubb-labs/kubb/commit/e2910e96ac7647f3c5bbc5253a2e6ef82161592b)]:
  - @kubb/core@5.0.0-alpha.36

## 5.0.0-alpha.35

### Patch Changes

- Updated dependencies [[`c8a1efb`](https://github.com/kubb-labs/kubb/commit/c8a1efb4e71d475eb383a93ebf02da9afda33f79), [`25db26e`](https://github.com/kubb-labs/kubb/commit/25db26eb9a91ab8e43f83df8b94a912067e46ce5), [`964067f`](https://github.com/kubb-labs/kubb/commit/964067ff1a21713af2b2c86795ff2ec59a12d0d6), [`e877926`](https://github.com/kubb-labs/kubb/commit/e877926222b4e3d56c7ccf07caaf7cdaba71bcd6)]:
  - @kubb/core@5.0.0-alpha.35

## 5.0.0-alpha.34

### Patch Changes

- Updated dependencies []:
  - @kubb/core@5.0.0-alpha.34

## 5.0.0-alpha.33

### Patch Changes

- Updated dependencies [[`3ac7d1f`](https://github.com/kubb-labs/kubb/commit/3ac7d1f9b75099bfe793e35152e5c322e65aa6ad), [`9e6a772`](https://github.com/kubb-labs/kubb/commit/9e6a772c7ca1ee54e931d2dbf0f2448f67707c0e)]:
  - @kubb/core@5.0.0-alpha.33

## 5.0.0-alpha.32

### Patch Changes

- Updated dependencies []:
  - @kubb/core@5.0.0-alpha.32

## 5.0.0-alpha.31

### Patch Changes

- Updated dependencies [[`6c49d8d`](https://github.com/kubb-labs/kubb/commit/6c49d8d02d7c4bf5341fb6f0114f6aa2ee735e1e)]:
  - @kubb/core@5.0.0-alpha.31
