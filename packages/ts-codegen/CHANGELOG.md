# Changelog

## [1.4.2](https://github.com/kubb-project/kubb/compare/@kubb/ts-codegen-v1.4.1...@kubb/ts-codegen-v1.4.2) (2023-06-28)


### 🐞 Bug Fixes

* types fix `exports` based on `https://arethetypeswrong.github.io/` ([f942def](https://github.com/kubb-project/kubb/commit/f942defb40584fdfddc94852bf751a6acf10476a))

## [1.4.1](https://github.com/kubb-project/kubb/compare/@kubb/ts-codegen-v1.4.0...@kubb/ts-codegen-v1.4.1) (2023-06-27)


### 📦 Miscellaneous Chores

* release 1.4.1 ([9805506](https://github.com/kubb-project/kubb/commit/98055065a6931b96dc1038890eb56ebb0342818f))

## [1.4.0](https://github.com/kubb-project/kubb/compare/@kubb/ts-codegen-v1.4.0...@kubb/ts-codegen-v1.4.0) (2023-06-27)


### ✨ Features

* `groupBy.exportAs` to make it possible go group all import with `export * as groupBy.exportAs from "./x"` ([214ff25](https://github.com/kubb-project/kubb/commit/214ff250e8ecf23d754a456c1b9289c6475099e0))
* ✨ add `reset.d.ts` to the `@kubb/ts-config` that can be used to override default TypeScrip types ([ae47aa5](https://github.com/kubb-project/kubb/commit/ae47aa5bbffc0f24d878e917eda3047856ca3fc7))
* **swagger-ts:** enumType `asPascalConst`to also include PascalCase naming. `asConst` will use camelcase ([f63a1b5](https://github.com/kubb-project/kubb/commit/f63a1b5765f4ad27986f5e5bc18de6e929a1a017))
* **swagger-ts:** use of prefixItems to create a TypeScript union ([e5ec395](https://github.com/kubb-project/kubb/commit/e5ec39503c14f14baec1c666fd115b8c0b55fe1e))
* use of `cac` instead of `commander` ([3814acb](https://github.com/kubb-project/kubb/commit/3814acb392f882ded2a75ef987ccdd79227a9238))
* use of `exports` for the fileManager ([e0582ee](https://github.com/kubb-project/kubb/commit/e0582eef921d10d3fc35af8a802ef2d81f790639))


### 🐞 Bug Fixes

* `EMFILE: too many open files` for Windows ([8c9dbce](https://github.com/kubb-project/kubb/commit/8c9dbce410430df669156b211ecae32fe17c88de))
* add types to mocks based on `@kubb/swagger-ts` ([5b51fe0](https://github.com/kubb-project/kubb/commit/5b51fe01b237f99b801bb76d9bb71578dba70113))
* asType should have a default of false instead of true ([2b5d842](https://github.com/kubb-project/kubb/commit/2b5d8427d24e0443678250ba73119c449dacd194))
* drop of node 16 in favour of node 18 as minimum version ([f4112ef](https://github.com/kubb-project/kubb/commit/f4112efc4abc3a95e50b58a3fa925c7425d911dd))
* duplicate import names ([7a8e6fa](https://github.com/kubb-project/kubb/commit/7a8e6fa3f00e37c771b15fb0287adc1dd166acb7))
* init cli ([2f79cb0](https://github.com/kubb-project/kubb/commit/2f79cb08141f924b3c3834183fbe97b197acef20))
* use of codegen for imports and exports ([aeccdbd](https://github.com/kubb-project/kubb/commit/aeccdbdc0068ef6e99902243958f4982e8b27223))
* when alias starts with a number, exclude and replace by _ ([10962ff](https://github.com/kubb-project/kubb/commit/10962ff755f61208d88f36d0c8bd87823d5e8410))


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

## [1.3.3](https://github.com/kubb-project/kubb/compare/@kubb/ts-codegen-v1.3.2...@kubb/ts-codegen-v1.3.3) (2023-06-27)


### 📦 Miscellaneous Chores

* **@kubb/ts-codegen:** Synchronize undefined versions

## [1.3.2](https://github.com/kubb-project/kubb/compare/@kubb/ts-codegen-v1.3.1...@kubb/ts-codegen-v1.3.2) (2023-06-25)


### Miscellaneous Chores

* **@kubb/ts-codegen:** Synchronize undefined versions

## [1.3.1](https://github.com/kubb-project/kubb/compare/@kubb/ts-codegen-v1.3.0...@kubb/ts-codegen-v1.3.1) (2023-06-24)


### Miscellaneous Chores

* release 1.3.1 ([fc869d9](https://github.com/kubb-project/kubb/commit/fc869d9c1429f3b513e3ba5a8854e1bf1d1f2122))

## [1.3.0](https://github.com/kubb-project/kubb/compare/@kubb/ts-codegen-v1.2.4...@kubb/ts-codegen-v1.3.0) (2023-06-23)


### Miscellaneous Chores

* **@kubb/ts-codegen:** Synchronize undefined versions

## [1.2.4](https://github.com/kubb-project/kubb/compare/@kubb/ts-codegen-v1.2.3...@kubb/ts-codegen-v1.2.4) (2023-06-17)


### Miscellaneous Chores

* **@kubb/ts-codegen:** Synchronize undefined versions

## [1.2.3](https://github.com/kubb-project/kubb/compare/@kubb/ts-codegen-v1.2.2...@kubb/ts-codegen-v1.2.3) (2023-06-17)


### Bug Fixes

* when alias starts with a number, exclude and replace by _ ([10962ff](https://github.com/kubb-project/kubb/commit/10962ff755f61208d88f36d0c8bd87823d5e8410))

## [1.2.2](https://github.com/kubb-project/kubb/compare/@kubb/ts-codegen-v1.2.1...@kubb/ts-codegen-v1.2.2) (2023-06-16)


### Features

* use of `cac` instead of `commander` ([3814acb](https://github.com/kubb-project/kubb/commit/3814acb392f882ded2a75ef987ccdd79227a9238))


### Miscellaneous Chores

* release 1.2.2 ([9489c97](https://github.com/kubb-project/kubb/commit/9489c97159a0f0e755b4257cd330e11d4d648b88))

## [1.2.1](https://github.com/kubb-project/kubb/compare/@kubb/ts-codegen-v1.2.0...@kubb/ts-codegen-v1.2.1) (2023-06-15)


### Miscellaneous Chores

* **@kubb/ts-codegen:** Synchronize undefined versions

## [1.2.0](https://github.com/kubb-project/kubb/compare/@kubb/ts-codegen-v1.1.13...@kubb/ts-codegen-v1.2.0) (2023-06-14)


### Features

* ✨ add `reset.d.ts` to the `@kubb/ts-config` that can be used to override default TypeScrip types ([ae47aa5](https://github.com/kubb-project/kubb/commit/ae47aa5bbffc0f24d878e917eda3047856ca3fc7))

## [1.1.13](https://github.com/kubb-project/kubb/compare/@kubb/ts-codegen-v1.1.12...@kubb/ts-codegen-v1.1.13) (2023-06-13)


### Miscellaneous Chores

* **@kubb/ts-codegen:** Synchronize undefined versions

## [1.1.12](https://github.com/kubb-project/kubb/compare/@kubb/ts-codegen-v1.1.11...@kubb/ts-codegen-v1.1.12) (2023-06-13)


### Miscellaneous Chores

* **@kubb/ts-codegen:** Synchronize undefined versions

## [1.1.11](https://github.com/kubb-project/kubb/compare/@kubb/ts-codegen-v1.1.10...@kubb/ts-codegen-v1.1.11) (2023-06-12)


### Miscellaneous Chores

* **@kubb/ts-codegen:** Synchronize undefined versions

## [1.1.10](https://github.com/kubb-project/kubb/compare/@kubb/ts-codegen-v1.1.9...@kubb/ts-codegen-v1.1.10) (2023-06-12)


### Miscellaneous Chores

* **@kubb/ts-codegen:** Synchronize undefined versions

## [1.1.9](https://github.com/kubb-project/kubb/compare/@kubb/ts-codegen-v1.1.8...@kubb/ts-codegen-v1.1.9) (2023-06-11)


### Bug Fixes

* `EMFILE: too many open files` for Windows ([8c9dbce](https://github.com/kubb-project/kubb/commit/8c9dbce410430df669156b211ecae32fe17c88de))

## [1.1.8](https://github.com/kubb-project/kubb/compare/@kubb/ts-codegen-v1.1.7...@kubb/ts-codegen-v1.1.8) (2023-06-10)


### Miscellaneous Chores

* **@kubb/ts-codegen:** Synchronize undefined versions

## [1.1.7](https://github.com/kubb-project/kubb/compare/@kubb/ts-codegen-v1.1.6...@kubb/ts-codegen-v1.1.7) (2023-06-08)


### Miscellaneous Chores

* **@kubb/ts-codegen:** Synchronize undefined versions

## [1.1.6](https://github.com/kubb-project/kubb/compare/@kubb/ts-codegen-v1.1.5...@kubb/ts-codegen-v1.1.6) (2023-06-08)


### Bug Fixes

* drop of node 16 in favour of node 18 as minimum version ([f4112ef](https://github.com/kubb-project/kubb/commit/f4112efc4abc3a95e50b58a3fa925c7425d911dd))

## [1.1.5](https://github.com/kubb-project/kubb/compare/@kubb/ts-codegen-v1.1.4...@kubb/ts-codegen-v1.1.5) (2023-06-07)


### Miscellaneous Chores

* **@kubb/ts-codegen:** Synchronize undefined versions

## [1.1.4](https://github.com/kubb-project/kubb/compare/@kubb/ts-codegen-v1.1.3...@kubb/ts-codegen-v1.1.4) (2023-06-07)


### Bug Fixes

* init cli ([2f79cb0](https://github.com/kubb-project/kubb/commit/2f79cb08141f924b3c3834183fbe97b197acef20))

## [1.1.3](https://github.com/kubb-project/kubb/compare/@kubb/ts-codegen-v1.1.2...@kubb/ts-codegen-v1.1.3) (2023-06-06)


### Miscellaneous Chores

* **@kubb/ts-codegen:** Synchronize undefined versions

## [1.1.2](https://github.com/kubb-project/kubb/compare/@kubb/ts-codegen-v1.1.1...@kubb/ts-codegen-v1.1.2) (2023-06-06)


### Bug Fixes

* add types to mocks based on `@kubb/swagger-ts` ([5b51fe0](https://github.com/kubb-project/kubb/commit/5b51fe01b237f99b801bb76d9bb71578dba70113))

## [1.1.1](https://github.com/kubb-project/kubb/compare/@kubb/ts-codegen-v1.1.0...@kubb/ts-codegen-v1.1.1) (2023-06-06)


### Miscellaneous Chores

* **@kubb/ts-codegen:** Synchronize undefined versions

## [1.1.0](https://github.com/kubb-project/kubb/compare/@kubb/ts-codegen-v1.0.3...@kubb/ts-codegen-v1.1.0) (2023-06-05)


### Miscellaneous Chores

* release 1.1.0 ([93ebdf1](https://github.com/kubb-project/kubb/commit/93ebdf116d63f022cacb8276de30d778df225ce5))

## [1.0.3](https://github.com/kubb-project/kubb/compare/@kubb/ts-codegen-v1.0.2...@kubb/ts-codegen-v1.0.3) (2023-06-05)


### Miscellaneous Chores

* **@kubb/ts-codegen:** Synchronize undefined versions

## [1.0.2](https://github.com/kubb-project/kubb/compare/@kubb/ts-codegen-v1.0.1...@kubb/ts-codegen-v1.0.2) (2023-06-05)


### Miscellaneous Chores

* **@kubb/ts-codegen:** Synchronize undefined versions

## [1.0.1](https://github.com/kubb-project/kubb/compare/@kubb/ts-codegen-v1.0.0...@kubb/ts-codegen-v1.0.1) (2023-06-05)


### Miscellaneous Chores

* release 1.0.1 ([8d62c91](https://github.com/kubb-project/kubb/commit/8d62c9117643b5cce9a75978a698adc6d76e1cf8))

## [1.0.0](https://github.com/kubb-project/kubb/compare/@kubb/ts-codegen-v1.0.0-beta.19...@kubb/ts-codegen-v1.0.0) (2023-06-02)


### Features

* **swagger-ts:** use of prefixItems to create a TypeScript union ([e5ec395](https://github.com/kubb-project/kubb/commit/e5ec39503c14f14baec1c666fd115b8c0b55fe1e))


### Miscellaneous Chores

* release 1.0.0 ([4009e28](https://github.com/kubb-project/kubb/commit/4009e283a93be87ff21562c6b59299ca3cfa73f8))
