# @kubb/plugin-solid-query

## 3.0.6

### Patch Changes

- Updated dependencies [[`fa04933`](https://github.com/kubb-labs/kubb/commit/fa049330f3c41fd148169b6483ca1bdaa223c715), [`b634bc9`](https://github.com/kubb-labs/kubb/commit/b634bc905fc660e270908d6ee09b01b7f3811bf5), [`a12aa73`](https://github.com/kubb-labs/kubb/commit/a12aa737cf9e5fe63f1b5347cde151de2a6e405e), [`a12aa73`](https://github.com/kubb-labs/kubb/commit/a12aa737cf9e5fe63f1b5347cde151de2a6e405e)]:
  - @kubb/react@3.0.6
  - @kubb/oas@3.0.6
  - @kubb/core@3.0.6
  - @kubb/plugin-oas@3.0.6
  - @kubb/plugin-ts@3.0.6
  - @kubb/plugin-zod@3.0.6
  - @kubb/fs@3.0.6

## 3.0.5

### Patch Changes

- Updated dependencies [[`23b8137`](https://github.com/kubb-labs/kubb/commit/23b8137bd69cbc896046a497dc4cbf7bf23d70ec)]:
  - @kubb/react@3.0.5
  - @kubb/plugin-oas@3.0.5
  - @kubb/plugin-ts@3.0.5
  - @kubb/plugin-zod@3.0.5
  - @kubb/core@3.0.5
  - @kubb/fs@3.0.5
  - @kubb/oas@3.0.5

## 3.0.4

### Patch Changes

- Updated dependencies [[`87f83c1`](https://github.com/kubb-labs/kubb/commit/87f83c191aed01ae4f46da797ba94090778f37a9)]:
  - @kubb/plugin-zod@3.0.4
  - @kubb/core@3.0.4
  - @kubb/fs@3.0.4
  - @kubb/oas@3.0.4
  - @kubb/plugin-oas@3.0.4
  - @kubb/plugin-ts@3.0.4
  - @kubb/react@3.0.4

## 3.0.3

### Patch Changes

- Updated dependencies [[`b3540fe`](https://github.com/kubb-labs/kubb/commit/b3540fe67e682bc367c2f39ca7595decab94a6aa)]:
  - @kubb/plugin-oas@3.0.3
  - @kubb/plugin-ts@3.0.3
  - @kubb/plugin-zod@3.0.3
  - @kubb/core@3.0.3
  - @kubb/fs@3.0.3
  - @kubb/oas@3.0.3
  - @kubb/react@3.0.3

## 3.0.2

### Patch Changes

- [#1382](https://github.com/kubb-labs/kubb/pull/1382) [`154e5d2`](https://github.com/kubb-labs/kubb/commit/154e5d2e00c0aaccb66d64b67a96cde53717cad9) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - remove the requirement of `@kubb/plugin-client`

- Updated dependencies []:
  - @kubb/core@3.0.2
  - @kubb/fs@3.0.2
  - @kubb/oas@3.0.2
  - @kubb/plugin-oas@3.0.2
  - @kubb/plugin-ts@3.0.2
  - @kubb/plugin-zod@3.0.2
  - @kubb/react@3.0.2

## 3.0.1

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.0.1
  - @kubb/fs@3.0.1
  - @kubb/oas@3.0.1
  - @kubb/plugin-oas@3.0.1
  - @kubb/plugin-ts@3.0.1
  - @kubb/plugin-zod@3.0.1
  - @kubb/react@3.0.1

## 3.0.0

### Major Changes

- [#1274](https://github.com/kubb-labs/kubb/pull/1274) [`39072a9`](https://github.com/kubb-labs/kubb/commit/39072a98195adb22b83d5e9857afbc329f20ecac) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Removal of `extName` in every plugin in favour of one `output.extension`

- [#1276](https://github.com/kubb-labs/kubb/pull/1276) [`ebbfac2`](https://github.com/kubb-labs/kubb/commit/ebbfac2dfa9f5245a928070c5fee3fdca7f76059) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Removal of `group.output` in favour of `group.name`(no need to specify the output/root)

### Minor Changes

- [#1365](https://github.com/kubb-labs/kubb/pull/1365) [`a8d645c`](https://github.com/kubb-labs/kubb/commit/a8d645c6a2e1b823f28679d5d27c8166c44cc7e2) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - allow to disable the generation of useQuery or createQuery hooks

- [#1259](https://github.com/kubb-labs/kubb/pull/1259) [`2c860f2`](https://github.com/kubb-labs/kubb/commit/2c860f2b8c49cda8ad08540cd3cbfbdd7c12632a) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - 'generators' option for all plugins

- [#1183](https://github.com/kubb-labs/kubb/pull/1183) [`428f700`](https://github.com/kubb-labs/kubb/commit/428f700f2ef5527904cb0c7e9db5238fdcf1a3ca) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Support for TypeScript `strict` mode and use of data object for `mutationFn: async(data: {})`

- [#1268](https://github.com/kubb-labs/kubb/pull/1268) [`3a756a6`](https://github.com/kubb-labs/kubb/commit/3a756a61a3000d642637a30fb342239d05a5e275) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Use of `enabled` based on optional params

- [`622073d`](https://github.com/kubb-labs/kubb/commit/622073d5223180f0945ef0919dc3df841359019f) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - use of `baseURL` to override the default baseURL in every call

- [#1358](https://github.com/kubb-labs/kubb/pull/1358) [`4db1509`](https://github.com/kubb-labs/kubb/commit/4db150923c5fee6dc952779880a13c8d4c0245b5) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - `paramsType` to change the amount of parameters when calling a query

- [`a0d31a7`](https://github.com/kubb-labs/kubb/commit/a0d31a7bd390f7fe96a6ec03735150049672f02f) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Support for cancellation of queries with the help of `signal`

### Patch Changes

- Updated dependencies [[`7bb4a34`](https://github.com/kubb-labs/kubb/commit/7bb4a340927077d5f587f938d09b1381787a4310), [`c8cb50d`](https://github.com/kubb-labs/kubb/commit/c8cb50d1e4a13669a05ca11a18352b86a558bce1), [`0bcb15b`](https://github.com/kubb-labs/kubb/commit/0bcb15b5502c1ced18205077c0b2e23811660033), [`8ad561d`](https://github.com/kubb-labs/kubb/commit/8ad561d3ff79b0e3dac21bc970106049a2338fba), [`9ef278a`](https://github.com/kubb-labs/kubb/commit/9ef278acc3550b96d9477ef3770e5e68fead2cba), [`833da08`](https://github.com/kubb-labs/kubb/commit/833da0820d3b91051d829e53ea2b981a74d37e84), [`7bb4a34`](https://github.com/kubb-labs/kubb/commit/7bb4a340927077d5f587f938d09b1381787a4310), [`8413897`](https://github.com/kubb-labs/kubb/commit/8413897bdc8511090cfdebd7783ad4823a6abf30), [`2fbc18a`](https://github.com/kubb-labs/kubb/commit/2fbc18a74d4e78effb9ce9844ad3ffe7ce7afbdf), [`39072a9`](https://github.com/kubb-labs/kubb/commit/39072a98195adb22b83d5e9857afbc329f20ecac), [`b5bccfa`](https://github.com/kubb-labs/kubb/commit/b5bccfaa79064f74925692966b12ae7906f2eed7), [`a8d645c`](https://github.com/kubb-labs/kubb/commit/a8d645c6a2e1b823f28679d5d27c8166c44cc7e2), [`0fc2205`](https://github.com/kubb-labs/kubb/commit/0fc22058bf79cf8ad543428fbd938cccd604d15c), [`8e7a819`](https://github.com/kubb-labs/kubb/commit/8e7a819e72abc1a2abb570947a73c8f72c89a069), [`20930e9`](https://github.com/kubb-labs/kubb/commit/20930e9b944cb30e134fdf22ddefefab9a1190c0), [`0860556`](https://github.com/kubb-labs/kubb/commit/08605565794fb1181677a33ea8610b2237f4ee94), [`20930e9`](https://github.com/kubb-labs/kubb/commit/20930e9b944cb30e134fdf22ddefefab9a1190c0), [`20930e9`](https://github.com/kubb-labs/kubb/commit/20930e9b944cb30e134fdf22ddefefab9a1190c0), [`20930e9`](https://github.com/kubb-labs/kubb/commit/20930e9b944cb30e134fdf22ddefefab9a1190c0), [`3a9859a`](https://github.com/kubb-labs/kubb/commit/3a9859a5f383f6832a9f056136665f1f7ca6fb72), [`3afc193`](https://github.com/kubb-labs/kubb/commit/3afc1935af6c5ad5233c22ad7c9a135693f0a850), [`2c860f2`](https://github.com/kubb-labs/kubb/commit/2c860f2b8c49cda8ad08540cd3cbfbdd7c12632a), [`5b7852b`](https://github.com/kubb-labs/kubb/commit/5b7852b461886f3ae6e7ee75c195013be8d7859c), [`79c2153`](https://github.com/kubb-labs/kubb/commit/79c2153b93187c2dad7d54bc00d6ad869213bb7b), [`79c2153`](https://github.com/kubb-labs/kubb/commit/79c2153b93187c2dad7d54bc00d6ad869213bb7b), [`a5b8d9e`](https://github.com/kubb-labs/kubb/commit/a5b8d9e396e2b4a61126696309c0d6dbf6d3b990), [`e8e5e03`](https://github.com/kubb-labs/kubb/commit/e8e5e039b413680f4420eb74b2f00c4ef7ed306f), [`622073d`](https://github.com/kubb-labs/kubb/commit/622073d5223180f0945ef0919dc3df841359019f), [`ede86d6`](https://github.com/kubb-labs/kubb/commit/ede86d69e5083252d80f1b1e2f1c18c55e245937), [`81b3a78`](https://github.com/kubb-labs/kubb/commit/81b3a78474b3e53446d98db88571a31a452384e0), [`ebbfac2`](https://github.com/kubb-labs/kubb/commit/ebbfac2dfa9f5245a928070c5fee3fdca7f76059), [`962e2d6`](https://github.com/kubb-labs/kubb/commit/962e2d6d49dff55563be13b1ded832d10743ec29), [`d70bdfc`](https://github.com/kubb-labs/kubb/commit/d70bdfc40aeeee4389123c2fb175a6c34ec94489), [`4d5f8d3`](https://github.com/kubb-labs/kubb/commit/4d5f8d3dae94e2cbe82fbbb6578532bdf41bee0d), [`4b02d38`](https://github.com/kubb-labs/kubb/commit/4b02d38f1d169887f29934d616fb889373ae410d), [`4ae54c7`](https://github.com/kubb-labs/kubb/commit/4ae54c7b0a2ab52701b1215f341595a9d1e7903d), [`ebfcb48`](https://github.com/kubb-labs/kubb/commit/ebfcb48dd59e0dc5ec28582b94035d8e25c9ea8d), [`e8c2a7f`](https://github.com/kubb-labs/kubb/commit/e8c2a7f3ef6c41e74acaa6ba6bf7b78a9de00769), [`2fbc18a`](https://github.com/kubb-labs/kubb/commit/2fbc18a74d4e78effb9ce9844ad3ffe7ce7afbdf)]:
  - @kubb/plugin-zod@3.0.0
  - @kubb/plugin-oas@3.0.0
  - @kubb/plugin-ts@3.0.0
  - @kubb/oas@3.0.0
  - @kubb/core@3.0.0
  - @kubb/react@3.0.0
  - @kubb/fs@3.0.0

## 3.0.0-beta.12

### Minor Changes

- [#1365](https://github.com/kubb-labs/kubb/pull/1365) [`a8d645c`](https://github.com/kubb-labs/kubb/commit/a8d645c6a2e1b823f28679d5d27c8166c44cc7e2) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - allow to disable the generation of useQuery or createQuery hooks

### Patch Changes

- Updated dependencies [[`a8d645c`](https://github.com/kubb-labs/kubb/commit/a8d645c6a2e1b823f28679d5d27c8166c44cc7e2)]:
  - @kubb/core@3.0.0-beta.12
  - @kubb/plugin-oas@3.0.0-beta.12
  - @kubb/plugin-ts@3.0.0-beta.12
  - @kubb/plugin-zod@3.0.0-beta.12
  - @kubb/react@3.0.0-beta.12
  - @kubb/fs@3.0.0-beta.12
  - @kubb/oas@3.0.0-beta.12

## 3.0.0-beta.11

### Minor Changes

- [`622073d`](https://github.com/kubb-labs/kubb/commit/622073d5223180f0945ef0919dc3df841359019f) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - use of `baseURL` to override the default baseURL in every call

### Patch Changes

- Updated dependencies [[`622073d`](https://github.com/kubb-labs/kubb/commit/622073d5223180f0945ef0919dc3df841359019f), [`4d5f8d3`](https://github.com/kubb-labs/kubb/commit/4d5f8d3dae94e2cbe82fbbb6578532bdf41bee0d)]:
  - @kubb/plugin-oas@3.0.0-beta.11
  - @kubb/plugin-ts@3.0.0-beta.11
  - @kubb/plugin-zod@3.0.0-beta.11
  - @kubb/core@3.0.0-beta.11
  - @kubb/fs@3.0.0-beta.11
  - @kubb/oas@3.0.0-beta.11
  - @kubb/react@3.0.0-beta.11

## 3.0.0-beta.10

### Minor Changes

- [#1358](https://github.com/kubb-labs/kubb/pull/1358) [`4db1509`](https://github.com/kubb-labs/kubb/commit/4db150923c5fee6dc952779880a13c8d4c0245b5) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - `paramsType` to change the amount of parameters when calling a query

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.0.0-beta.10
  - @kubb/fs@3.0.0-beta.10
  - @kubb/oas@3.0.0-beta.10
  - @kubb/plugin-oas@3.0.0-beta.10
  - @kubb/plugin-ts@3.0.0-beta.10
  - @kubb/plugin-zod@3.0.0-beta.10
  - @kubb/react@3.0.0-beta.10

## 3.0.0-beta.9

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.0.0-beta.9
  - @kubb/fs@3.0.0-beta.9
  - @kubb/oas@3.0.0-beta.9
  - @kubb/plugin-oas@3.0.0-beta.9
  - @kubb/plugin-ts@3.0.0-beta.9
  - @kubb/plugin-zod@3.0.0-beta.9
  - @kubb/react@3.0.0-beta.9

## 3.0.0-beta.8

### Patch Changes

- Updated dependencies [[`e8c2a7f`](https://github.com/kubb-labs/kubb/commit/e8c2a7f3ef6c41e74acaa6ba6bf7b78a9de00769)]:
  - @kubb/plugin-zod@3.0.0-beta.8
  - @kubb/core@3.0.0-beta.8
  - @kubb/fs@3.0.0-beta.8
  - @kubb/oas@3.0.0-beta.8
  - @kubb/plugin-oas@3.0.0-beta.8
  - @kubb/plugin-ts@3.0.0-beta.8
  - @kubb/react@3.0.0-beta.8

## 3.0.0-beta.7

### Patch Changes

- Updated dependencies [[`e8e5e03`](https://github.com/kubb-labs/kubb/commit/e8e5e039b413680f4420eb74b2f00c4ef7ed306f)]:
  - @kubb/plugin-oas@3.0.0-beta.7
  - @kubb/plugin-ts@3.0.0-beta.7
  - @kubb/plugin-zod@3.0.0-beta.7
  - @kubb/core@3.0.0-beta.7
  - @kubb/fs@3.0.0-beta.7
  - @kubb/oas@3.0.0-beta.7
  - @kubb/react@3.0.0-beta.7

## 3.0.0-beta.6

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.0.0-beta.6
  - @kubb/fs@3.0.0-beta.6
  - @kubb/oas@3.0.0-beta.6
  - @kubb/plugin-oas@3.0.0-beta.6
  - @kubb/plugin-ts@3.0.0-beta.6
  - @kubb/plugin-zod@3.0.0-beta.6
  - @kubb/react@3.0.0-beta.6

## 3.0.0-beta.5

### Patch Changes

- Updated dependencies [[`d70bdfc`](https://github.com/kubb-labs/kubb/commit/d70bdfc40aeeee4389123c2fb175a6c34ec94489)]:
  - @kubb/plugin-zod@3.0.0-beta.5
  - @kubb/core@3.0.0-beta.5
  - @kubb/fs@3.0.0-beta.5
  - @kubb/oas@3.0.0-beta.5
  - @kubb/plugin-oas@3.0.0-beta.5
  - @kubb/plugin-ts@3.0.0-beta.5
  - @kubb/react@3.0.0-beta.5

## 3.0.0-beta.4

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.0.0-beta.4
  - @kubb/fs@3.0.0-beta.4
  - @kubb/oas@3.0.0-beta.4
  - @kubb/plugin-oas@3.0.0-beta.4
  - @kubb/plugin-ts@3.0.0-beta.4
  - @kubb/plugin-zod@3.0.0-beta.4
  - @kubb/react@3.0.0-beta.4

## 3.0.0-beta.3

### Patch Changes

- Updated dependencies [[`4b02d38`](https://github.com/kubb-labs/kubb/commit/4b02d38f1d169887f29934d616fb889373ae410d)]:
  - @kubb/plugin-zod@3.0.0-beta.3
  - @kubb/core@3.0.0-beta.3
  - @kubb/fs@3.0.0-beta.3
  - @kubb/oas@3.0.0-beta.3
  - @kubb/plugin-oas@3.0.0-beta.3
  - @kubb/plugin-ts@3.0.0-beta.3
  - @kubb/react@3.0.0-beta.3

## 3.0.0-beta.2

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.0.0-beta.2
  - @kubb/plugin-ts@3.0.0-beta.2
  - @kubb/plugin-zod@3.0.0-beta.2
  - @kubb/react@3.0.0-beta.2
  - @kubb/plugin-oas@3.0.0-beta.2
  - @kubb/fs@3.0.0-beta.2
  - @kubb/oas@3.0.0-beta.2

## 3.0.0-beta.1

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.0.0-beta.1
  - @kubb/fs@3.0.0-beta.1
  - @kubb/oas@3.0.0-beta.1
  - @kubb/plugin-oas@3.0.0-beta.1
  - @kubb/plugin-ts@3.0.0-beta.1
  - @kubb/plugin-zod@3.0.0-beta.1
  - @kubb/react@3.0.0-beta.1

## 3.0.0-alpha.31

### Major Changes

- [#1276](https://github.com/kubb-labs/kubb/pull/1276) [`ebbfac2`](https://github.com/kubb-labs/kubb/commit/ebbfac2dfa9f5245a928070c5fee3fdca7f76059) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Removal of `group.output` in favour of `group.name`(no need to specify the output/root)

### Patch Changes

- Updated dependencies [[`ebbfac2`](https://github.com/kubb-labs/kubb/commit/ebbfac2dfa9f5245a928070c5fee3fdca7f76059)]:
  - @kubb/plugin-oas@3.0.0-alpha.31
  - @kubb/plugin-zod@3.0.0-alpha.31
  - @kubb/plugin-ts@3.0.0-alpha.31
  - @kubb/react@3.0.0-alpha.31
  - @kubb/core@3.0.0-alpha.31
  - @kubb/fs@3.0.0-alpha.31
  - @kubb/oas@3.0.0-alpha.31

## 3.0.0-alpha.30

### Major Changes

- [#1274](https://github.com/kubb-labs/kubb/pull/1274) [`39072a9`](https://github.com/kubb-labs/kubb/commit/39072a98195adb22b83d5e9857afbc329f20ecac) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Removal of `extName` in every plugin in favour of one `output.extension`

### Patch Changes

- Updated dependencies [[`39072a9`](https://github.com/kubb-labs/kubb/commit/39072a98195adb22b83d5e9857afbc329f20ecac)]:
  - @kubb/plugin-oas@3.0.0-alpha.30
  - @kubb/plugin-zod@3.0.0-alpha.30
  - @kubb/plugin-ts@3.0.0-alpha.30
  - @kubb/react@3.0.0-alpha.30
  - @kubb/core@3.0.0-alpha.30
  - @kubb/fs@3.0.0-alpha.30
  - @kubb/oas@3.0.0-alpha.30

## 3.0.0-alpha.29

### Minor Changes

- [#1268](https://github.com/kubb-labs/kubb/pull/1268) [`3a756a6`](https://github.com/kubb-labs/kubb/commit/3a756a61a3000d642637a30fb342239d05a5e275) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Use of `enabled` based on optional params

- [`a0d31a7`](https://github.com/kubb-labs/kubb/commit/a0d31a7bd390f7fe96a6ec03735150049672f02f) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Support for cancellation of queries with the help of `signal`

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.0.0-alpha.29
  - @kubb/fs@3.0.0-alpha.29
  - @kubb/oas@3.0.0-alpha.29
  - @kubb/plugin-oas@3.0.0-alpha.29
  - @kubb/plugin-ts@3.0.0-alpha.29
  - @kubb/plugin-zod@3.0.0-alpha.29
  - @kubb/react@3.0.0-alpha.29

## 3.0.0-alpha.28

### Patch Changes

- Updated dependencies [[`0bcb15b`](https://github.com/kubb-labs/kubb/commit/0bcb15b5502c1ced18205077c0b2e23811660033)]:
  - @kubb/plugin-zod@3.0.0-alpha.28
  - @kubb/core@3.0.0-alpha.28
  - @kubb/fs@3.0.0-alpha.28
  - @kubb/oas@3.0.0-alpha.28
  - @kubb/plugin-oas@3.0.0-alpha.28
  - @kubb/plugin-ts@3.0.0-alpha.28
  - @kubb/react@3.0.0-alpha.28

## 3.0.0-alpha.27

### Minor Changes

- [#1183](https://github.com/kubb-labs/kubb/pull/1183) [`428f700`](https://github.com/kubb-labs/kubb/commit/428f700f2ef5527904cb0c7e9db5238fdcf1a3ca) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Support for TypeScript `strict` mode and use of data object for `mutationFn: async(data: {})`

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.0.0-alpha.27
  - @kubb/fs@3.0.0-alpha.27
  - @kubb/oas@3.0.0-alpha.27
  - @kubb/plugin-oas@3.0.0-alpha.27
  - @kubb/plugin-ts@3.0.0-alpha.27
  - @kubb/plugin-zod@3.0.0-alpha.27
  - @kubb/react@3.0.0-alpha.27

## 3.0.0-alpha.26

### Minor Changes

- [#1259](https://github.com/kubb-labs/kubb/pull/1259) [`2c860f2`](https://github.com/kubb-labs/kubb/commit/2c860f2b8c49cda8ad08540cd3cbfbdd7c12632a) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - 'generators' option for all plugins

### Patch Changes

- Updated dependencies [[`2c860f2`](https://github.com/kubb-labs/kubb/commit/2c860f2b8c49cda8ad08540cd3cbfbdd7c12632a)]:
  - @kubb/plugin-zod@3.0.0-alpha.26
  - @kubb/plugin-ts@3.0.0-alpha.26
  - @kubb/core@3.0.0-alpha.26
  - @kubb/fs@3.0.0-alpha.26
  - @kubb/oas@3.0.0-alpha.26
  - @kubb/plugin-oas@3.0.0-alpha.26
  - @kubb/react@3.0.0-alpha.26

## 3.0.0-alpha.25

### Patch Changes

- Updated dependencies [[`c8cb50d`](https://github.com/kubb-labs/kubb/commit/c8cb50d1e4a13669a05ca11a18352b86a558bce1)]:
  - @kubb/plugin-oas@3.0.0-alpha.25
  - @kubb/plugin-zod@3.0.0-alpha.25
  - @kubb/plugin-ts@3.0.0-alpha.25
  - @kubb/oas@3.0.0-alpha.25
  - @kubb/core@3.0.0-alpha.25
  - @kubb/fs@3.0.0-alpha.25
  - @kubb/react@3.0.0-alpha.25

## 3.0.0-alpha.24

### Patch Changes

- Updated dependencies [[`a5b8d9e`](https://github.com/kubb-labs/kubb/commit/a5b8d9e396e2b4a61126696309c0d6dbf6d3b990)]:
  - @kubb/plugin-oas@3.0.0-alpha.24
  - @kubb/plugin-ts@3.0.0-alpha.24
  - @kubb/plugin-zod@3.0.0-alpha.24
  - @kubb/core@3.0.0-alpha.24
  - @kubb/fs@3.0.0-alpha.24
  - @kubb/oas@3.0.0-alpha.24
  - @kubb/react@3.0.0-alpha.24

## 3.0.0-alpha.23

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.0.0-alpha.23
  - @kubb/fs@3.0.0-alpha.23
  - @kubb/oas@3.0.0-alpha.23
  - @kubb/plugin-oas@3.0.0-alpha.23
  - @kubb/plugin-ts@3.0.0-alpha.23
  - @kubb/plugin-zod@3.0.0-alpha.23
  - @kubb/react@3.0.0-alpha.23

## 3.0.0-alpha.22

### Patch Changes

- Updated dependencies [[`8413897`](https://github.com/kubb-labs/kubb/commit/8413897bdc8511090cfdebd7783ad4823a6abf30), [`b5bccfa`](https://github.com/kubb-labs/kubb/commit/b5bccfaa79064f74925692966b12ae7906f2eed7), [`ebfcb48`](https://github.com/kubb-labs/kubb/commit/ebfcb48dd59e0dc5ec28582b94035d8e25c9ea8d)]:
  - @kubb/plugin-oas@3.0.0-alpha.22
  - @kubb/plugin-ts@3.0.0-alpha.22
  - @kubb/plugin-zod@3.0.0-alpha.22
  - @kubb/core@3.0.0-alpha.22
  - @kubb/fs@3.0.0-alpha.22
  - @kubb/oas@3.0.0-alpha.22
  - @kubb/react@3.0.0-alpha.22

## 3.0.0-alpha.21

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.0.0-alpha.21
  - @kubb/fs@3.0.0-alpha.21
  - @kubb/oas@3.0.0-alpha.21
  - @kubb/plugin-oas@3.0.0-alpha.21
  - @kubb/plugin-ts@3.0.0-alpha.21
  - @kubb/plugin-zod@3.0.0-alpha.21
  - @kubb/react@3.0.0-alpha.21

## 3.0.0-alpha.20

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.0.0-alpha.20
  - @kubb/fs@3.0.0-alpha.20
  - @kubb/oas@3.0.0-alpha.20
  - @kubb/plugin-oas@3.0.0-alpha.20
  - @kubb/plugin-ts@3.0.0-alpha.20
  - @kubb/plugin-zod@3.0.0-alpha.20
  - @kubb/react@3.0.0-alpha.20
