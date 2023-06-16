# Changelog

## [1.3.0](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.2.1...@kubb/swagger-zodios-v1.3.0) (2023-06-16)


### Features

* use of `cac` instead of `commander` ([3814acb](https://github.com/kubb-project/kubb/commit/3814acb392f882ded2a75ef987ccdd79227a9238))

## [1.2.1](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.2.0...@kubb/swagger-zodios-v1.2.1) (2023-06-15)


### Bug Fixes

* pluginManager with `api` config will now be an function so the `core` functionality is accessible when using `this` ([4306318](https://github.com/kubb-project/kubb/commit/43063189a1a18ed2aca23b0505d3163aeddbc2ef))

## [1.2.0](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.1.13...@kubb/swagger-zodios-v1.2.0) (2023-06-14)


### Features

* ✨ add `reset.d.ts` to the `@kubb/ts-config` that can be used to override default TypeScrip types ([ae47aa5](https://github.com/kubb-project/kubb/commit/ae47aa5bbffc0f24d878e917eda3047856ca3fc7))

## [1.1.13](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.1.12...@kubb/swagger-zodios-v1.1.13) (2023-06-13)


### Miscellaneous Chores

* **@kubb/swagger-zodios:** Synchronize undefined versions

## [1.1.12](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.1.11...@kubb/swagger-zodios-v1.1.12) (2023-06-13)


### Miscellaneous Chores

* **@kubb/swagger-zodios:** Synchronize undefined versions

## [1.1.11](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.1.10...@kubb/swagger-zodios-v1.1.11) (2023-06-12)


### Miscellaneous Chores

* **@kubb/swagger-zodios:** Synchronize undefined versions

## [1.1.10](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.1.9...@kubb/swagger-zodios-v1.1.10) (2023-06-12)


### Miscellaneous Chores

* **@kubb/swagger-zodios:** Synchronize undefined versions

## [1.1.9](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.1.8...@kubb/swagger-zodios-v1.1.9) (2023-06-11)


### Miscellaneous Chores

* **@kubb/swagger-zodios:** Synchronize undefined versions

## [1.1.8](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.1.7...@kubb/swagger-zodios-v1.1.8) (2023-06-10)


### Miscellaneous Chores

* **@kubb/swagger-zodios:** Synchronize undefined versions

## [1.1.7](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.1.6...@kubb/swagger-zodios-v1.1.7) (2023-06-08)


### Miscellaneous Chores

* **@kubb/swagger-zodios:** Synchronize undefined versions

## [1.1.6](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.1.5...@kubb/swagger-zodios-v1.1.6) (2023-06-08)


### Bug Fixes

* drop of node 16 in favour of node 18 as minimum version ([f4112ef](https://github.com/kubb-project/kubb/commit/f4112efc4abc3a95e50b58a3fa925c7425d911dd))

## [1.1.5](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.1.4...@kubb/swagger-zodios-v1.1.5) (2023-06-07)


### Miscellaneous Chores

* **@kubb/swagger-zodios:** Synchronize undefined versions

## [1.1.4](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.1.3...@kubb/swagger-zodios-v1.1.4) (2023-06-07)


### Bug Fixes

* init cli ([2f79cb0](https://github.com/kubb-project/kubb/commit/2f79cb08141f924b3c3834183fbe97b197acef20))

## [1.1.3](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.1.2...@kubb/swagger-zodios-v1.1.3) (2023-06-06)


### Features

* error type for swr and tanstack-query ([7c71f72](https://github.com/kubb-project/kubb/commit/7c71f7216ef22f3a87fbac7fc10920aac69704ed))
* use of `exports` for the fileManager ([e0582ee](https://github.com/kubb-project/kubb/commit/e0582eef921d10d3fc35af8a802ef2d81f790639))
* zodios for get ([5a0a735](https://github.com/kubb-project/kubb/commit/5a0a735433c31ea17e9335b1b9679a74d2126f2f))
* zodios plugin template ([bdd01cd](https://github.com/kubb-project/kubb/commit/bdd01cdc556268bd39e0f25b4dbd2a01b846c698))
* zodios with errors ([3470b6d](https://github.com/kubb-project/kubb/commit/3470b6d6828a35cbac4785c24e7e06344c9df8ac))


### Bug Fixes

* duplocated queryParams(coming from the pathParams) ([714281f](https://github.com/kubb-project/kubb/commit/714281f5d511c02c130a66b75e774f231ee06e9b))
* no fileManager needed for OperationGenerator + this.addFile change with multiParams ([cde8225](https://github.com/kubb-project/kubb/commit/cde8225a5207360bd17f4ede66ce2a07d5dfd53d))
* remove propdrilling of directory ([99b8016](https://github.com/kubb-project/kubb/commit/99b801658a514a223e590d14f7d7729e85391ffc))
* resolvePath and resolveName sync ([935ca2a](https://github.com/kubb-project/kubb/commit/935ca2a137006d9a59ef276e16f54770391b0a42))
* use of camelCaseTransformMerge for every camelcase transform ([69f77ec](https://github.com/kubb-project/kubb/commit/69f77ecb45d62c14cb5ec7724cc64c9fe63a2365))
* use of transformReservedWord and better naming for req, res and params ([5574dd1](https://github.com/kubb-project/kubb/commit/5574dd1fa597c84d03d65547cab0b819049380a3))


### Miscellaneous Chores

* release 1.0.0 ([4009e28](https://github.com/kubb-project/kubb/commit/4009e283a93be87ff21562c6b59299ca3cfa73f8))
* release 1.0.0-alpha.1 ([608fd59](https://github.com/kubb-project/kubb/commit/608fd5926079f9dd77046d6788a5550fb964c0b2))
* release 1.0.0-alpha.2 ([3d645ac](https://github.com/kubb-project/kubb/commit/3d645accedb121856e61bab166fafe74db6ca3f3))
* release 1.0.0-alpha.3 ([4fb3d6a](https://github.com/kubb-project/kubb/commit/4fb3d6a6ff5b6b0950d94a12f04c4fd3db89c595))
* release 1.0.0-alpha.4 ([8d808c3](https://github.com/kubb-project/kubb/commit/8d808c3d0b255b76dc79ad92324f0f2ee8afd619))
* release 1.0.0-alpha.5 ([8bb9ed2](https://github.com/kubb-project/kubb/commit/8bb9ed2d0ce9ee47db2d24daba993b81cd56d2c0))
* release 1.0.0-alpha.6 ([550035a](https://github.com/kubb-project/kubb/commit/550035a122a2e5a5294a49a0d2c927fc238315e6))
* release 1.0.0-alpha.7 ([29bd33a](https://github.com/kubb-project/kubb/commit/29bd33aefb990c298d6615f10add0ca7fce69861))
* release 1.0.0-alpha.8 ([c5a3d68](https://github.com/kubb-project/kubb/commit/c5a3d6879abdb09c5ed9776e2e715800a2bf51d9))
* release 1.0.0-beta.1 ([151d4c3](https://github.com/kubb-project/kubb/commit/151d4c393d4d6d0b2b85267dd2ef00c6f20636aa))
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
* release 1.0.0-beta.2 ([390b3d0](https://github.com/kubb-project/kubb/commit/390b3d0eb3aa7edbf2dd8d7d2765312c76710397))
* release 1.0.0-beta.2 ([826bfef](https://github.com/kubb-project/kubb/commit/826bfef6b81c46ea92531ce36ac6617c52a7bba8))
* release 1.0.0-beta.3 ([c134fb6](https://github.com/kubb-project/kubb/commit/c134fb61d0634abfea0740467087ff1b2d7ba3fa))
* release 1.0.0-beta.4 ([4127252](https://github.com/kubb-project/kubb/commit/4127252b59422a5692e17e3673a26ae346d9cdba))
* release 1.0.0-beta.5 ([87515db](https://github.com/kubb-project/kubb/commit/87515db8910aacd58dabe7be5efa43191d33992e))
* release 1.0.0-beta.6 ([b11e6fe](https://github.com/kubb-project/kubb/commit/b11e6fe2b65c4784c151bb2e08729cd166f09151))
* release 1.0.0-beta.6 ([6f27206](https://github.com/kubb-project/kubb/commit/6f2720619c386771b9a8ea232c23948ff3781203))
* release 1.0.0-beta.7 ([7973833](https://github.com/kubb-project/kubb/commit/7973833327cc54286c872b609da34786fa71e447))
* release 1.0.0-beta.8 ([f331db4](https://github.com/kubb-project/kubb/commit/f331db4a15fee8de12e95b9583b111dc1cbe8cc4))
* release 1.0.0-beta.9 ([3f57281](https://github.com/kubb-project/kubb/commit/3f5728174b5c004ab7fb0d860960caf409bda040))
* release 1.0.1 ([8d62c91](https://github.com/kubb-project/kubb/commit/8d62c9117643b5cce9a75978a698adc6d76e1cf8))
* release 1.1.0 ([93ebdf1](https://github.com/kubb-project/kubb/commit/93ebdf116d63f022cacb8276de30d778df225ce5))

## [1.1.0](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.0.1...@kubb/swagger-zodios-v1.1.0) (2023-06-05)


### Miscellaneous Chores

* release 1.1.0 ([93ebdf1](https://github.com/kubb-project/kubb/commit/93ebdf116d63f022cacb8276de30d778df225ce5))

## [1.0.1](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.0.0...@kubb/swagger-zodios-v1.0.1) (2023-06-05)


### Miscellaneous Chores

* release 1.0.1 ([8d62c91](https://github.com/kubb-project/kubb/commit/8d62c9117643b5cce9a75978a698adc6d76e1cf8))

## [1.0.0](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.0.0-beta.19...@kubb/swagger-zodios-v1.0.0) (2023-06-02)


### Miscellaneous Chores

* release 1.0.0 ([4009e28](https://github.com/kubb-project/kubb/commit/4009e283a93be87ff21562c6b59299ca3cfa73f8))

## [1.0.0-beta.19](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.0.0-beta.18...@kubb/swagger-zodios-v1.0.0-beta.19) (2023-05-26)


### Miscellaneous Chores

* release 1.0.0-beta.19 ([d1f5e3c](https://github.com/kubb-project/kubb/commit/d1f5e3cc38d8c3b3af4c9587cbbe44b0cdbac971))

## [1.0.0-beta.18](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.0.0-beta.17...@kubb/swagger-zodios-v1.0.0-beta.18) (2023-04-22)


### Bug Fixes

* use of transformReservedWord and better naming for req, res and params ([5574dd1](https://github.com/kubb-project/kubb/commit/5574dd1fa597c84d03d65547cab0b819049380a3))


### Miscellaneous Chores

* release 1.0.0-beta.18 ([4f172c8](https://github.com/kubb-project/kubb/commit/4f172c860d60a22086553c6899527532763c4b07))

## [1.0.0-beta.17](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.0.0-beta.16...@kubb/swagger-zodios-v1.0.0-beta.17) (2023-04-16)


### Miscellaneous Chores

* release 1.0.0-beta.17 ([8c23230](https://github.com/kubb-project/kubb/commit/8c23230219d53cb34cffbab78524cabaa326d1fa))

## [1.0.0-beta.16](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.0.0-beta.15...@kubb/swagger-zodios-v1.0.0-beta.16) (2023-04-16)
## [1.0.0-beta.15](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.0.0-beta.14...@kubb/swagger-zodios-v1.0.0-beta.15) (2023-04-15)


### Features

* use of `exports` for the fileManager ([e0582ee](https://github.com/kubb-project/kubb/commit/e0582eef921d10d3fc35af8a802ef2d81f790639))


### Miscellaneous Chores

* release 1.0.0-beta.14 ([55ecfa6](https://github.com/kubb-project/kubb/commit/55ecfa62c060f98afd0df14e9d112deba2251cea))
* release 1.0.0-beta.15 ([c32bc44](https://github.com/kubb-project/kubb/commit/c32bc443975f7f997f67df1392c80a5821b88e47))

## [1.0.0-beta.14](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.0.0-beta.14...@kubb/swagger-zodios-v1.0.0-beta.14) (2023-04-15)


### Features

* use of `exports` for the fileManager ([e0582ee](https://github.com/kubb-project/kubb/commit/e0582eef921d10d3fc35af8a802ef2d81f790639))


### Miscellaneous Chores

* release 1.0.0-beta.14 ([55ecfa6](https://github.com/kubb-project/kubb/commit/55ecfa62c060f98afd0df14e9d112deba2251cea))

## [1.0.0-beta.14](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.0.0-beta.13...@kubb/swagger-zodios-v1.0.0-beta.14) (2023-04-12)


### Miscellaneous Chores

* release 1.0.0-beta.14 ([16d4d76](https://github.com/kubb-project/kubb/commit/16d4d7636f0d13f86a24ffcb791ca308d9b9d6cb))

## [1.0.0-beta.13](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.0.0-beta.12...@kubb/swagger-zodios-v1.0.0-beta.13) (2023-04-11)


### Miscellaneous Chores

* release 1.0.0-beta.13 ([da1cc86](https://github.com/kubb-project/kubb/commit/da1cc865fd8011dab51e8debea3fbb2035e24bac))

## [1.0.0-beta.12](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.0.0-beta.11...@kubb/swagger-zodios-v1.0.0-beta.12) (2023-04-10)


### Bug Fixes

* no fileManager needed for OperationGenerator + this.addFile change with multiParams ([cde8225](https://github.com/kubb-project/kubb/commit/cde8225a5207360bd17f4ede66ce2a07d5dfd53d))
* remove propdrilling of directory ([99b8016](https://github.com/kubb-project/kubb/commit/99b801658a514a223e590d14f7d7729e85391ffc))
* resolvePath and resolveName sync ([935ca2a](https://github.com/kubb-project/kubb/commit/935ca2a137006d9a59ef276e16f54770391b0a42))
* use of camelCaseTransformMerge for every camelcase transform ([69f77ec](https://github.com/kubb-project/kubb/commit/69f77ecb45d62c14cb5ec7724cc64c9fe63a2365))


### Miscellaneous Chores

* release 1.0.0-beta.12 ([17585e6](https://github.com/kubb-project/kubb/commit/17585e6793e7c15cb4eb3f9a6bd4f570e6670ff3))

## [1.0.0-beta.11](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.0.0-beta.10...@kubb/swagger-zodios-v1.0.0-beta.11) (2023-04-09)


### Miscellaneous Chores

* release 1.0.0-beta.11 ([826bf51](https://github.com/kubb-project/kubb/commit/826bf517f275ac5e75c89bde26d7f6d8abef76c8))

## [1.0.0-beta.10](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.0.0-beta.9...@kubb/swagger-zodios-v1.0.0-beta.10) (2023-04-09)


### Features

* error type for swr and tanstack-query ([7c71f72](https://github.com/kubb-project/kubb/commit/7c71f7216ef22f3a87fbac7fc10920aac69704ed))
* zodios with errors ([3470b6d](https://github.com/kubb-project/kubb/commit/3470b6d6828a35cbac4785c24e7e06344c9df8ac))


### Bug Fixes

* duplocated queryParams(coming from the pathParams) ([714281f](https://github.com/kubb-project/kubb/commit/714281f5d511c02c130a66b75e774f231ee06e9b))


### Miscellaneous Chores

* release 1.0.0-beta.10 ([bb4ab12](https://github.com/kubb-project/kubb/commit/bb4ab1290053274ae46b867f1876214506b0669a))

## 1.0.0-beta.9 (2023-04-05)


### Features

* zodios for get ([5a0a735](https://github.com/kubb-project/kubb/commit/5a0a735433c31ea17e9335b1b9679a74d2126f2f))
* zodios plugin template ([bdd01cd](https://github.com/kubb-project/kubb/commit/bdd01cdc556268bd39e0f25b4dbd2a01b846c698))


### Miscellaneous Chores

* release 1.0.0-alpha.1 ([608fd59](https://github.com/kubb-project/kubb/commit/608fd5926079f9dd77046d6788a5550fb964c0b2))
* release 1.0.0-alpha.2 ([3d645ac](https://github.com/kubb-project/kubb/commit/3d645accedb121856e61bab166fafe74db6ca3f3))
* release 1.0.0-alpha.3 ([4fb3d6a](https://github.com/kubb-project/kubb/commit/4fb3d6a6ff5b6b0950d94a12f04c4fd3db89c595))
* release 1.0.0-alpha.4 ([8d808c3](https://github.com/kubb-project/kubb/commit/8d808c3d0b255b76dc79ad92324f0f2ee8afd619))
* release 1.0.0-alpha.5 ([8bb9ed2](https://github.com/kubb-project/kubb/commit/8bb9ed2d0ce9ee47db2d24daba993b81cd56d2c0))
* release 1.0.0-alpha.6 ([550035a](https://github.com/kubb-project/kubb/commit/550035a122a2e5a5294a49a0d2c927fc238315e6))
* release 1.0.0-alpha.7 ([29bd33a](https://github.com/kubb-project/kubb/commit/29bd33aefb990c298d6615f10add0ca7fce69861))
* release 1.0.0-alpha.8 ([c5a3d68](https://github.com/kubb-project/kubb/commit/c5a3d6879abdb09c5ed9776e2e715800a2bf51d9))
* release 1.0.0-beta.1 ([151d4c3](https://github.com/kubb-project/kubb/commit/151d4c393d4d6d0b2b85267dd2ef00c6f20636aa))
* release 1.0.0-beta.2 ([390b3d0](https://github.com/kubb-project/kubb/commit/390b3d0eb3aa7edbf2dd8d7d2765312c76710397))
* release 1.0.0-beta.2 ([826bfef](https://github.com/kubb-project/kubb/commit/826bfef6b81c46ea92531ce36ac6617c52a7bba8))
* release 1.0.0-beta.3 ([c134fb6](https://github.com/kubb-project/kubb/commit/c134fb61d0634abfea0740467087ff1b2d7ba3fa))
* release 1.0.0-beta.4 ([4127252](https://github.com/kubb-project/kubb/commit/4127252b59422a5692e17e3673a26ae346d9cdba))
* release 1.0.0-beta.5 ([87515db](https://github.com/kubb-project/kubb/commit/87515db8910aacd58dabe7be5efa43191d33992e))
* release 1.0.0-beta.6 ([b11e6fe](https://github.com/kubb-project/kubb/commit/b11e6fe2b65c4784c151bb2e08729cd166f09151))
* release 1.0.0-beta.6 ([6f27206](https://github.com/kubb-project/kubb/commit/6f2720619c386771b9a8ea232c23948ff3781203))
* release 1.0.0-beta.7 ([7973833](https://github.com/kubb-project/kubb/commit/7973833327cc54286c872b609da34786fa71e447))
* release 1.0.0-beta.8 ([f331db4](https://github.com/kubb-project/kubb/commit/f331db4a15fee8de12e95b9583b111dc1cbe8cc4))
* release 1.0.0-beta.9 ([3f57281](https://github.com/kubb-project/kubb/commit/3f5728174b5c004ab7fb0d860960caf409bda040))
