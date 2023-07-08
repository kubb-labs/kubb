# Changelog

## [1.5.1](https://github.com/kubb-project/kubb/compare/@kubb/swagger-client-v1.5.0...@kubb/swagger-client-v1.5.1) (2023-07-08)


### 📦 Miscellaneous Chores

* **@kubb/swagger-client:** Synchronize undefined versions

## [1.5.0](https://github.com/kubb-project/kubb/compare/@kubb/swagger-client-v1.4.2...@kubb/swagger-client-v1.5.0) (2023-07-05)


### ✨ Features

* ✨ skipBy to exclude `tags`, `names`, `paths`, ... out of the generation ([44be77b](https://github.com/kubb-project/kubb/commit/44be77bb8748ae0188481716ef19dc6a39f1e538))

## [1.4.2](https://github.com/kubb-project/kubb/compare/@kubb/swagger-client-v1.4.1...@kubb/swagger-client-v1.4.2) (2023-06-28)


### 🐞 Bug Fixes

* types fix `exports` based on `https://arethetypeswrong.github.io/` ([f942def](https://github.com/kubb-project/kubb/commit/f942defb40584fdfddc94852bf751a6acf10476a))

## [1.4.1](https://github.com/kubb-project/kubb/compare/@kubb/swagger-client-v1.4.0...@kubb/swagger-client-v1.4.1) (2023-06-27)


### 📦 Miscellaneous Chores

* release 1.4.1 ([9805506](https://github.com/kubb-project/kubb/commit/98055065a6931b96dc1038890eb56ebb0342818f))

## [1.4.0](https://github.com/kubb-project/kubb/compare/@kubb/swagger-client-v1.4.0...@kubb/swagger-client-v1.4.0) (2023-06-27)


### 📚 Documentation

* documentation for client and globals ([8f2b478](https://github.com/kubb-project/kubb/commit/8f2b478f91f307d7b322466bf623f9f8d192b876))


### ✨ Features

* `client.ts` with the use of `process.env` override to set options for `axios` ([89c0d08](https://github.com/kubb-project/kubb/commit/89c0d08986255fd554f1d6df661b0a9a2a83847a))
* `groupBy.exportAs` to make it possible go group all import with `export * as groupBy.exportAs from "./x"` ([214ff25](https://github.com/kubb-project/kubb/commit/214ff250e8ecf23d754a456c1b9289c6475099e0))
* ✨ add `reset.d.ts` to the `@kubb/ts-config` that can be used to override default TypeScrip types ([ae47aa5](https://github.com/kubb-project/kubb/commit/ae47aa5bbffc0f24d878e917eda3047856ca3fc7))
* groupby as object with `type` and `output` which can be customised with a handlebar like syntax ([c687864](https://github.com/kubb-project/kubb/commit/c687864b2ac82643757ef7b2f6158410144a73fe))
* use of `cac` instead of `commander` ([3814acb](https://github.com/kubb-project/kubb/commit/3814acb392f882ded2a75ef987ccdd79227a9238))
* use of `exports` for the fileManager ([e0582ee](https://github.com/kubb-project/kubb/commit/e0582eef921d10d3fc35af8a802ef2d81f790639))


### 🐞 Bug Fixes

* add `ClientBuilder` for our client generator + ReturnType ([21de173](https://github.com/kubb-project/kubb/commit/21de1738d24d6a6dbae516ef60bbcc4b67fec6ea))
* advanced queue ([e8e90b9](https://github.com/kubb-project/kubb/commit/e8e90b9cbeadad793b759a174641874dc39c2c01))
* better operationGeneration + schemas.request could be optional ([cf10b02](https://github.com/kubb-project/kubb/commit/cf10b0242761847133ebf01bae64d0bfed1334ab))
* correct use of `path.resolve` so windows can transform / to \ ([a4052e2](https://github.com/kubb-project/kubb/commit/a4052e24ec57e3920a6285d1b4bee9570f2e4e9f))
* correct use of params ([2352c51](https://github.com/kubb-project/kubb/commit/2352c511fc7fd76adfed1260773c3f6fdee3b23a))
* drop of node 16 in favour of node 18 as minimum version ([f4112ef](https://github.com/kubb-project/kubb/commit/f4112efc4abc3a95e50b58a3fa925c7425d911dd))
* duplicate import names ([7a8e6fa](https://github.com/kubb-project/kubb/commit/7a8e6fa3f00e37c771b15fb0287adc1dd166acb7))
* init cli ([2f79cb0](https://github.com/kubb-project/kubb/commit/2f79cb08141f924b3c3834183fbe97b197acef20))
* no banner for subpackage client ([a0a6627](https://github.com/kubb-project/kubb/commit/a0a6627a0e3215884fdde191a9a153a309516e57))
* no fileManager needed for OperationGenerator + this.addFile change with multiParams ([cde8225](https://github.com/kubb-project/kubb/commit/cde8225a5207360bd17f4ede66ce2a07d5dfd53d))
* pluginManager with `api` config will now be an function so the `core` functionality is accessible when using `this` ([4306318](https://github.com/kubb-project/kubb/commit/43063189a1a18ed2aca23b0505d3163aeddbc2ef))
* remove propdrilling of directory ([99b8016](https://github.com/kubb-project/kubb/commit/99b801658a514a223e590d14f7d7729e85391ffc))
* resolvePath and resolveName sync ([935ca2a](https://github.com/kubb-project/kubb/commit/935ca2a137006d9a59ef276e16f54770391b0a42))
* use methods of path instead of all methods + removal of `getOperation`(no check needed on `operationId`) ([2978ad7](https://github.com/kubb-project/kubb/commit/2978ad7e42b3ccb6c52088bec949afa32192a883))
* use of camelCaseTransformMerge for every camelcase transform ([69f77ec](https://github.com/kubb-project/kubb/commit/69f77ecb45d62c14cb5ec7724cc64c9fe63a2365))
* warning with correct cli message(validate for swagger) ([b091e28](https://github.com/kubb-project/kubb/commit/b091e282f079e7694bf04a35ea6a0ebfd3aa06da))


### 📦 Miscellaneous Chores

* release 1.0.0 ([4009e28](https://github.com/kubb-project/kubb/commit/4009e283a93be87ff21562c6b59299ca3cfa73f8))
* release 1.0.0-beta.10 ([bb4ab12](https://github.com/kubb-project/kubb/commit/bb4ab1290053274ae46b867f1876214506b0669a))
* release 1.0.0-beta.11 ([826bf51](https://github.com/kubb-project/kubb/commit/826bf517f275ac5e75c89bde26d7f6d8abef76c8))
* release 1.0.0-beta.12 ([17585e6](https://github.com/kubb-project/kubb/commit/17585e6793e7c15cb4eb3f9a6bd4f570e6670ff3))
* release 1.0.0-beta.13 ([da1cc86](https://github.com/kubb-project/kubb/commit/da1cc865fd8011dab51e8debea3fbb2035e24bac))
* release 1.0.0-beta.14 ([55ecfa6](https://github.com/kubb-project/kubb/commit/55ecfa62c060f98afd0df14e9d112deba2251cea))
* release 1.0.0-beta.14 ([16d4d76](https://github.com/kubb-project/kubb/commit/16d4d7636f0d13f86a24ffcb791ca308d9b9d6cb))
* release 1.0.0-beta.15 ([c32bc44](https://github.com/kubb-project/kubb/commit/c32bc443975f7f997f67df1392c80a5821b88e47))
* release 1.0.0-beta.16 ([72abba8](https://github.com/kubb-project/kubb/commit/72abba8362f5ed44168f94643f94cdc1af9bc6e9))
* release 1.0.0-beta.17 ([8c23230](https://github.com/kubb-project/kubb/commit/8c23230219d53cb34cffbab78524cabaa326d1fa))
* release 1.0.0-beta.18 ([4f172c8](https://github.com/kubb-project/kubb/commit/4f172c860d60a22086553c6899527532763c4b07))
* release 1.0.0-beta.19 ([d1f5e3c](https://github.com/kubb-project/kubb/commit/d1f5e3cc38d8c3b3af4c9587cbbe44b0cdbac971))
* release 1.0.1 ([8d62c91](https://github.com/kubb-project/kubb/commit/8d62c9117643b5cce9a75978a698adc6d76e1cf8))
* release 1.1.0 ([93ebdf1](https://github.com/kubb-project/kubb/commit/93ebdf116d63f022cacb8276de30d778df225ce5))
* release 1.2.2 ([1213f57](https://github.com/kubb-project/kubb/commit/1213f57a4a56b5cac7709b24060d42f5dfc56d40))
* release 1.2.2 ([9489c97](https://github.com/kubb-project/kubb/commit/9489c97159a0f0e755b4257cd330e11d4d648b88))
* release 1.3.1 ([3821664](https://github.com/kubb-project/kubb/commit/3821664148c130e7e1905ac59ec359204b0c0370))
* release 1.3.1 ([fc869d9](https://github.com/kubb-project/kubb/commit/fc869d9c1429f3b513e3ba5a8854e1bf1d1f2122))
* release 1.4.0 ([fc0de82](https://github.com/kubb-project/kubb/commit/fc0de826f94c2ff933dd2cefe26168ea6fcf8c3b))
* release 1.4.0 ([b1d4561](https://github.com/kubb-project/kubb/commit/b1d456179bc4415168142939b4be64b225a4870f))

### 📦 Miscellaneous Chores

* **@kubb/swagger-client:** Synchronize undefined versions

## [1.3.3](https://github.com/kubb-project/kubb/compare/@kubb/swagger-client-v1.3.2...@kubb/swagger-client-v1.3.3) (2023-06-27)


### 📦 Miscellaneous Chores

* **@kubb/swagger-client:** Synchronize undefined versions

## [1.3.2](https://github.com/kubb-project/kubb/compare/@kubb/swagger-client-v1.3.1...@kubb/swagger-client-v1.3.2) (2023-06-25)


### Bug Fixes

* no banner for subpackage client ([a0a6627](https://github.com/kubb-project/kubb/commit/a0a6627a0e3215884fdde191a9a153a309516e57))

## [1.3.1](https://github.com/kubb-project/kubb/compare/@kubb/swagger-client-v1.3.0...@kubb/swagger-client-v1.3.1) (2023-06-24)


### Miscellaneous Chores

* release 1.3.1 ([fc869d9](https://github.com/kubb-project/kubb/commit/fc869d9c1429f3b513e3ba5a8854e1bf1d1f2122))

## [1.3.0](https://github.com/kubb-project/kubb/compare/@kubb/swagger-client-v1.2.4...@kubb/swagger-client-v1.3.0) (2023-06-23)


### Bug Fixes

* advanced queue ([e8e90b9](https://github.com/kubb-project/kubb/commit/e8e90b9cbeadad793b759a174641874dc39c2c01))

## [1.2.4](https://github.com/kubb-project/kubb/compare/@kubb/swagger-client-v1.2.3...@kubb/swagger-client-v1.2.4) (2023-06-17)


### Miscellaneous Chores

* **@kubb/swagger-client:** Synchronize undefined versions

## [1.2.3](https://github.com/kubb-project/kubb/compare/@kubb/swagger-client-v1.2.2...@kubb/swagger-client-v1.2.3) (2023-06-17)


### Miscellaneous Chores

* **@kubb/swagger-client:** Synchronize undefined versions

## [1.2.2](https://github.com/kubb-project/kubb/compare/@kubb/swagger-client-v1.2.1...@kubb/swagger-client-v1.2.2) (2023-06-16)


### Features

* use of `cac` instead of `commander` ([3814acb](https://github.com/kubb-project/kubb/commit/3814acb392f882ded2a75ef987ccdd79227a9238))


### Miscellaneous Chores

* release 1.2.2 ([9489c97](https://github.com/kubb-project/kubb/commit/9489c97159a0f0e755b4257cd330e11d4d648b88))

## [1.2.1](https://github.com/kubb-project/kubb/compare/@kubb/swagger-client-v1.2.0...@kubb/swagger-client-v1.2.1) (2023-06-15)


### Bug Fixes

* pluginManager with `api` config will now be an function so the `core` functionality is accessible when using `this` ([4306318](https://github.com/kubb-project/kubb/commit/43063189a1a18ed2aca23b0505d3163aeddbc2ef))

## [1.2.0](https://github.com/kubb-project/kubb/compare/@kubb/swagger-client-v1.1.13...@kubb/swagger-client-v1.2.0) (2023-06-14)


### Features

* ✨ add `reset.d.ts` to the `@kubb/ts-config` that can be used to override default TypeScrip types ([ae47aa5](https://github.com/kubb-project/kubb/commit/ae47aa5bbffc0f24d878e917eda3047856ca3fc7))


### Bug Fixes

* warning with correct cli message(validate for swagger) ([b091e28](https://github.com/kubb-project/kubb/commit/b091e282f079e7694bf04a35ea6a0ebfd3aa06da))

## [1.1.13](https://github.com/kubb-project/kubb/compare/@kubb/swagger-client-v1.1.12...@kubb/swagger-client-v1.1.13) (2023-06-13)


### Miscellaneous Chores

* **@kubb/swagger-client:** Synchronize undefined versions

## [1.1.12](https://github.com/kubb-project/kubb/compare/@kubb/swagger-client-v1.1.11...@kubb/swagger-client-v1.1.12) (2023-06-13)


### Miscellaneous Chores

* **@kubb/swagger-client:** Synchronize undefined versions

## [1.1.11](https://github.com/kubb-project/kubb/compare/@kubb/swagger-client-v1.1.10...@kubb/swagger-client-v1.1.11) (2023-06-12)


### Miscellaneous Chores

* **@kubb/swagger-client:** Synchronize undefined versions

## [1.1.10](https://github.com/kubb-project/kubb/compare/@kubb/swagger-client-v1.1.9...@kubb/swagger-client-v1.1.10) (2023-06-12)


### Miscellaneous Chores

* **@kubb/swagger-client:** Synchronize undefined versions

## [1.1.9](https://github.com/kubb-project/kubb/compare/@kubb/swagger-client-v1.1.8...@kubb/swagger-client-v1.1.9) (2023-06-11)


### Miscellaneous Chores

* **@kubb/swagger-client:** Synchronize undefined versions

## [1.1.8](https://github.com/kubb-project/kubb/compare/@kubb/swagger-client-v1.1.7...@kubb/swagger-client-v1.1.8) (2023-06-10)


### Miscellaneous Chores

* **@kubb/swagger-client:** Synchronize undefined versions

## [1.1.7](https://github.com/kubb-project/kubb/compare/@kubb/swagger-client-v1.1.6...@kubb/swagger-client-v1.1.7) (2023-06-08)


### Miscellaneous Chores

* **@kubb/swagger-client:** Synchronize undefined versions

## [1.1.6](https://github.com/kubb-project/kubb/compare/@kubb/swagger-client-v1.1.5...@kubb/swagger-client-v1.1.6) (2023-06-08)


### Bug Fixes

* drop of node 16 in favour of node 18 as minimum version ([f4112ef](https://github.com/kubb-project/kubb/commit/f4112efc4abc3a95e50b58a3fa925c7425d911dd))

## [1.1.5](https://github.com/kubb-project/kubb/compare/@kubb/swagger-client-v1.1.4...@kubb/swagger-client-v1.1.5) (2023-06-07)


### Miscellaneous Chores

* **@kubb/swagger-client:** Synchronize undefined versions

## [1.1.4](https://github.com/kubb-project/kubb/compare/@kubb/swagger-client-v1.1.3...@kubb/swagger-client-v1.1.4) (2023-06-07)


### Bug Fixes

* init cli ([2f79cb0](https://github.com/kubb-project/kubb/commit/2f79cb08141f924b3c3834183fbe97b197acef20))

## [1.1.3](https://github.com/kubb-project/kubb/compare/@kubb/swagger-client-v1.1.2...@kubb/swagger-client-v1.1.3) (2023-06-06)


### Miscellaneous Chores

* **@kubb/swagger-client:** Synchronize undefined versions

## [1.1.2](https://github.com/kubb-project/kubb/compare/@kubb/swagger-client-v1.1.1...@kubb/swagger-client-v1.1.2) (2023-06-06)


### Miscellaneous Chores

* **@kubb/swagger-client:** Synchronize undefined versions

## [1.1.1](https://github.com/kubb-project/kubb/compare/@kubb/swagger-client-v1.1.0...@kubb/swagger-client-v1.1.1) (2023-06-06)


### Miscellaneous Chores

* **@kubb/swagger-client:** Synchronize undefined versions

## [1.1.0](https://github.com/kubb-project/kubb/compare/@kubb/swagger-client-v1.0.3...@kubb/swagger-client-v1.1.0) (2023-06-05)


### Miscellaneous Chores

* release 1.1.0 ([93ebdf1](https://github.com/kubb-project/kubb/commit/93ebdf116d63f022cacb8276de30d778df225ce5))

## [1.0.3](https://github.com/kubb-project/kubb/compare/@kubb/swagger-client-v1.0.2...@kubb/swagger-client-v1.0.3) (2023-06-05)


### Miscellaneous Chores

* **@kubb/swagger-client:** Synchronize undefined versions

## [1.0.2](https://github.com/kubb-project/kubb/compare/@kubb/swagger-client-v1.0.1...@kubb/swagger-client-v1.0.2) (2023-06-05)


### Miscellaneous Chores

* **@kubb/swagger-client:** Synchronize undefined versions

## [1.0.1](https://github.com/kubb-project/kubb/compare/@kubb/swagger-client-v1.0.0...@kubb/swagger-client-v1.0.1) (2023-06-05)


### Miscellaneous Chores

* release 1.0.1 ([8d62c91](https://github.com/kubb-project/kubb/commit/8d62c9117643b5cce9a75978a698adc6d76e1cf8))

## [1.0.0](https://github.com/kubb-project/kubb/compare/@kubb/swagger-client-v1.0.0-beta.19...@kubb/swagger-client-v1.0.0) (2023-06-02)


### Miscellaneous Chores

* release 1.0.0 ([4009e28](https://github.com/kubb-project/kubb/commit/4009e283a93be87ff21562c6b59299ca3cfa73f8))
