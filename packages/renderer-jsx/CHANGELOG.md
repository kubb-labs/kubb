# @kubb/renderer-jsx

## 5.0.0-alpha.42

### Patch Changes

- Updated dependencies []:
  - @kubb/ast@5.0.0-alpha.42

## 5.0.0-alpha.41

### Patch Changes

- Updated dependencies []:
  - @kubb/ast@5.0.0-alpha.41

## 5.0.0-alpha.40

### Patch Changes

- Updated dependencies []:
  - @kubb/ast@5.0.0-alpha.40

## 5.0.0-alpha.39

### Patch Changes

- Updated dependencies []:
  - @kubb/ast@5.0.0-alpha.39

## 5.0.0-alpha.38

### Patch Changes

- Updated dependencies []:
  - @kubb/ast@5.0.0-alpha.38

## 5.0.0-alpha.37

### Patch Changes

- Updated dependencies []:
  - @kubb/ast@5.0.0-alpha.37

## 5.0.0-alpha.36

### Patch Changes

- Updated dependencies []:
  - @kubb/ast@5.0.0-alpha.36

## 5.0.0-alpha.35

### Patch Changes

- Updated dependencies []:
  - @kubb/ast@5.0.0-alpha.35

## 5.0.0-alpha.34

### Patch Changes

- Updated dependencies []:
  - @kubb/ast@5.0.0-alpha.34

## 5.0.0-alpha.33

### Minor Changes

- [#2994](https://github.com/kubb-labs/kubb/pull/2994) [`9e6a772`](https://github.com/kubb-labs/kubb/commit/9e6a772c7ca1ee54e931d2dbf0f2448f67707c0e) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Add `@kubb/renderer-jsx` — a lightweight JSX renderer for Kubb plugins.
  - New package `@kubb/renderer-jsx` with a custom JSX runtime (`jsx-runtime`, `jsx-dev-runtime`)
  - Provides `createRenderer` to render JSX trees into `FileNode` arrays without React
  - Built-in components: `File`, `Const`, `Function`, `Type`, `Root`
  - Context helpers: `KubbContext`, `OasContext`
  - Replaces `@kubb/react-fabric` as the rendering layer inside Kubb plugins

### Patch Changes

- Updated dependencies []:
  - @kubb/ast@5.0.0-alpha.33
