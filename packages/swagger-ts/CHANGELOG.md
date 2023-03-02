# Changelog

## [0.56.4](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.56.3...@kubb/swagger-ts-v0.56.4) (2023-03-02)


### Miscellaneous Chores

* **@kubb/swagger-ts:** Synchronize undefined versions

## [0.56.3](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.56.2...@kubb/swagger-ts-v0.56.3) (2023-03-02)


### Miscellaneous Chores

* **@kubb/swagger-ts:** Synchronize undefined versions

## [0.56.2](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.56.1...@kubb/swagger-ts-v0.56.2) (2023-03-02)


### Miscellaneous Chores

* **@kubb/swagger-ts:** Synchronize undefined versions

## [0.56.1](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.56.0...@kubb/swagger-ts-v0.56.1) (2023-03-01)


### Bug Fixes

* support for ESM modules ([cec3b57](https://github.com/stijnvanhulle/kubb/commit/cec3b57ba9b97a030bb276a3957c826ace72b7d3))

## [0.56.0](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.55.0...@kubb/swagger-ts-v0.56.0) (2023-02-28)


### Bug Fixes

* anyof and allof can also have non ref object(string, number, object, ...) ([8a54be3](https://github.com/stijnvanhulle/kubb/commit/8a54be3a50c74717637255598ed4c758c7e9a53b))

## [0.55.0](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.54.0...@kubb/swagger-ts-v0.55.0) (2023-02-27)


### Miscellaneous Chores

* **@kubb/swagger-ts:** Synchronize undefined versions

## [0.54.0](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.53.0...@kubb/swagger-ts-v0.54.0) (2023-02-26)


### Miscellaneous Chores

* **@kubb/swagger-ts:** Synchronize undefined versions

## [0.53.0](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.52.1...@kubb/swagger-ts-v0.53.0) (2023-02-26)


### Miscellaneous Chores

* **@kubb/swagger-ts:** Synchronize undefined versions

## [0.52.1](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.52.0...@kubb/swagger-ts-v0.52.1) (2023-02-26)


### Bug Fixes

* uniq enums for zod and ts ([cc05916](https://github.com/stijnvanhulle/kubb/commit/cc059162d2698844a72a2d8d07a92c62529bbbd9))

## [0.52.0](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.51.0...@kubb/swagger-ts-v0.52.0) (2023-02-26)


### Features

* intersection for allOf ([7418a7c](https://github.com/stijnvanhulle/kubb/commit/7418a7cd344885c3f5c93ebcf96c86b4f23eae67))
* oneof for zod and typescript + added description for zod ([ebef9d2](https://github.com/stijnvanhulle/kubb/commit/ebef9d2597f38989c6d43a87053d5eba23948bca))

## [0.51.0](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.50.1...@kubb/swagger-ts-v0.51.0) (2023-02-25)


### Features

* typeBuilder with extraNodes for enum nodes ([951df6b](https://github.com/stijnvanhulle/kubb/commit/951df6b459e9236b34ac82f0e61ba5676d107604))


### Bug Fixes

* correct use of camel and pascalcase ([f4f7a63](https://github.com/stijnvanhulle/kubb/commit/f4f7a63731e0edc8bb059f16095f484405e547b6))

## [0.50.1](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.50.0...@kubb/swagger-ts-v0.50.1) (2023-02-23)


### Bug Fixes

* factory issue with commonjs(nextjs) ([6a6f987](https://github.com/stijnvanhulle/kubb/commit/6a6f987363e3f3567400032bb4bbb4cf6daf9f1d))

## [0.50.0](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.49.1...@kubb/swagger-ts-v0.50.0) (2023-02-23)


### Features

* use of swagger-ts name instead of swagger-typescript ([e9c27a4](https://github.com/stijnvanhulle/kubb/commit/e9c27a4d1485b4d38e58fb0d67380796f1eb1aad))

## [0.49.1](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.49.0...@kubb/swagger-ts-v0.49.1) (2023-02-23)


### Bug Fixes

* refactor zodBuilder and typeBuilder ([6e0ada6](https://github.com/stijnvanhulle/kubb/commit/6e0ada6af9fa71658c0812cc72db507aa15cea66))

## [0.49.0](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.48.0...@kubb/swagger-ts-v0.49.0) (2023-02-23)


### Features

* sort for types and zodSchemas based on refs(first ones based on a ref and then the ones using the ref) ([0f9c424](https://github.com/stijnvanhulle/kubb/commit/0f9c4249f912867aea49d025e3983db72f09a5e5))

## [0.48.0](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.47.1...@kubb/swagger-ts-v0.48.0) (2023-02-23)


### Features

* oasBuilder ([2001bb9](https://github.com/stijnvanhulle/kubb/commit/2001bb9f6b4b65a4d67e1e3b4f75517c109c2a44))

## [0.47.1](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.47.0...@kubb/swagger-ts-v0.47.1) (2023-02-22)


### Bug Fixes

* refactor of operationgenerator + baseOperationGenerator for swagger package ([2f4739b](https://github.com/stijnvanhulle/kubb/commit/2f4739b25e3a456f44647ee46272cd341975152b))

## [0.47.0](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.46.0...@kubb/swagger-ts-v0.47.0) (2023-02-22)


### Features

* format with js-beautify instead of Prettier(works also in the browser) ([ecc0952](https://github.com/stijnvanhulle/kubb/commit/ecc0952c929aa71bac8a3bb0cf400289c7dee142))

## [0.46.0](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.45.1...@kubb/swagger-ts-v0.46.0) (2023-02-22)


### Miscellaneous Chores

* **@kubb/swagger-ts:** Synchronize undefined versions

## [0.45.1](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.45.0...@kubb/swagger-ts-v0.45.1) (2023-02-22)


### Miscellaneous Chores

* **@kubb/swagger-ts:** Synchronize undefined versions

## [0.45.0](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.44.2...@kubb/swagger-ts-v0.45.0) (2023-02-22)


### Features

* use of PathParams and QueryParams ([f60dd4f](https://github.com/stijnvanhulle/kubb/commit/f60dd4f6a389bfb4712671ed9c17ef838637c8a5))
* use of pathParams to create function arguments for ReactQuery GET hooks ([e6994fc](https://github.com/stijnvanhulle/kubb/commit/e6994fc9576122d1aaf2edabab65d871f43a6e8a))

## [0.44.2](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.44.1...@kubb/swagger-ts-v0.44.2) (2023-02-22)


### Miscellaneous Chores

* **@kubb/swagger-ts:** Synchronize undefined versions

## [0.44.1](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.44.0...@kubb/swagger-ts-v0.44.1) (2023-02-22)


### Miscellaneous Chores

* **@kubb/swagger-ts:** Synchronize undefined versions

## [0.44.0](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.43.3...@kubb/swagger-ts-v0.44.0) (2023-02-22)


### Miscellaneous Chores

* **@kubb/swagger-ts:** Synchronize undefined versions

## [0.43.3](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.43.2...@kubb/swagger-ts-v0.43.3) (2023-02-21)


### Miscellaneous Chores

* **@kubb/swagger-ts:** Synchronize undefined versions

## [0.43.2](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.43.1...@kubb/swagger-ts-v0.43.2) (2023-02-21)


### Miscellaneous Chores

* **@kubb/swagger-ts:** Synchronize undefined versions

## [0.43.1](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.43.0...@kubb/swagger-ts-v0.43.1) (2023-02-21)


### Miscellaneous Chores

* **@kubb/swagger-ts:** Synchronize undefined versions

## [0.43.0](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.42.1...@kubb/swagger-ts-v0.43.0) (2023-02-21)


### Features

* add put and delete operations + params for URL type ([21ab4cf](https://github.com/stijnvanhulle/kubb/commit/21ab4cff7ceab496718119e6abc145e96125b364))
* zod package with zod.any and zod.object({}) ([d19b6a3](https://github.com/stijnvanhulle/kubb/commit/d19b6a3f81d3c21ddd68d67cb5d4b7839f26fd77))
* zod.object with parameters, zod.array and zod ref with correc import ([e0d111c](https://github.com/stijnvanhulle/kubb/commit/e0d111c53a98e55ec58498c2a9d048724289c64e))


### Bug Fixes

* use of camelCase for zod schemas ([3406eeb](https://github.com/stijnvanhulle/kubb/commit/3406eeb9bd380000a35eaabb942c19a137e3b2a8))
* use of isTypeOnly instead of type for FileManager ([d921543](https://github.com/stijnvanhulle/kubb/commit/d921543daff94838da38629e6341d2dd1dba77ec))
* when post/get does not exist, do not generate type/hook/schema ([16b5648](https://github.com/stijnvanhulle/kubb/commit/16b5648b613a66811d1b24be0d6065bb84b3143a))

## [0.42.1](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.42.0...@kubb/swagger-ts-v0.42.1) (2023-02-20)


### Miscellaneous Chores

* **@kubb/swagger-ts:** Synchronize undefined versions

## [0.42.0](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.41.1...@kubb/swagger-ts-v0.42.0) (2023-02-20)


### Features

* move typescript logic to swagger-ts package ([d4b6d2b](https://github.com/stijnvanhulle/kubb/commit/d4b6d2b8035de648bb583662d5c022a37dff8f74))


### Bug Fixes

* better use of fileManager and single file(mode file) ([af010b9](https://github.com/stijnvanhulle/kubb/commit/af010b9ae07b48cedc9d7328d121fb562aba1af0))

## [0.41.1](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.41.0...@kubb/swagger-ts-v0.41.1) (2023-02-16)


### Miscellaneous Chores

* **@kubb/swagger-ts:** Synchronize undefined versions

## [0.41.0](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.40.0...@kubb/swagger-ts-v0.41.0) (2023-02-16)


### Bug Fixes

* add options to every plugin + removal of EmittedFile type ([a31b427](https://github.com/stijnvanhulle/kubb/commit/a31b4275ca0904deb97fbc1b4c4827f6fbfd020d))

## [0.40.0](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.39.1...@kubb/swagger-ts-v0.40.0) (2023-02-16)


### Miscellaneous Chores

* **@kubb/swagger-ts:** Synchronize undefined versions

## [0.39.1](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.39.0...@kubb/swagger-ts-v0.39.1) (2023-02-16)


### Bug Fixes

* upgrade packages + cleanup ([66ca9cf](https://github.com/stijnvanhulle/kubb/commit/66ca9cf7835f0da347f263e9ac1c14eecfa7d036))

## [0.39.0](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.38.0...@kubb/swagger-ts-v0.39.0) (2023-02-11)


### Features

* imports for fileManager ([1e021e7](https://github.com/stijnvanhulle/kubb/commit/1e021e7210ad6b76d94ecf6c038bccc568188979))

## [0.38.0](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.37.30...@kubb/swagger-ts-v0.38.0) (2023-02-11)


### Features

* swagger-ts api ([559d8a4](https://github.com/stijnvanhulle/kubb/commit/559d8a4b386d58da530b0f4b36fd8752056b23aa))

## [0.37.30](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.37.29...@kubb/swagger-ts-v0.37.30) (2023-02-04)


### Miscellaneous Chores

* **@kubb/swagger-ts:** Synchronize undefined versions

## [0.37.29](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.37.28...@kubb/swagger-ts-v0.37.29) (2023-02-04)


### Miscellaneous Chores

* **@kubb/swagger-ts:** Synchronize undefined versions

## [0.37.28](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.37.27...@kubb/swagger-ts-v0.37.28) (2023-02-03)


### Bug Fixes

* upgrade packages ([dcc2f7e](https://github.com/stijnvanhulle/kubb/commit/dcc2f7e1f97ca494785abbb581025d46ae6ceacd))

## [0.37.27](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.37.26...@kubb/swagger-ts-v0.37.27) (2023-01-13)


### Bug Fixes

* tsup node ([50bbf4f](https://github.com/stijnvanhulle/kubb/commit/50bbf4fc401bfb148c8ba0c080fab40169df96eb))

## [0.37.26](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.37.25...@kubb/swagger-ts-v0.37.26) (2023-01-10)


### Miscellaneous Chores

* **@kubb/swagger-ts:** Synchronize undefined versions

## [0.37.25](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.37.24...@kubb/swagger-ts-v0.37.25) (2023-01-10)


### Miscellaneous Chores

* **@kubb/swagger-ts:** Synchronize undefined versions

## [0.37.24](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.37.23...@kubb/swagger-ts-v0.37.24) (2023-01-09)


### Bug Fixes

* revert umd creation for packages that uses ts compiler ([26e4130](https://github.com/stijnvanhulle/kubb/commit/26e4130374f440864d937a6890d99f1c545cb639))

## [0.37.23](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.37.22...@kubb/swagger-ts-v0.37.23) (2023-01-09)


### Bug Fixes

* filename ([14cca73](https://github.com/stijnvanhulle/kubb/commit/14cca735e344e6ac2e055779ccf5101ae6004bfa))

## [0.37.22](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.37.21...@kubb/swagger-ts-v0.37.22) (2023-01-09)


### Bug Fixes

* add fake  __filename ([8d102de](https://github.com/stijnvanhulle/kubb/commit/8d102de60c979d3fffa21207489da3294bbdc89b))

## [0.37.21](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.37.20...@kubb/swagger-ts-v0.37.21) (2023-01-09)


### Bug Fixes

* swagger-ts os alias ([3be1962](https://github.com/stijnvanhulle/kubb/commit/3be19620abdf114b34d2c731f7942d08a5d3ab90))

## [0.37.20](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.37.19...@kubb/swagger-ts-v0.37.20) (2023-01-09)


### Bug Fixes

* cleanup devdeps ([92c5a00](https://github.com/stijnvanhulle/kubb/commit/92c5a0003739047326baade146938f5ca013654d))
* umd module for all packages ([2b99a4b](https://github.com/stijnvanhulle/kubb/commit/2b99a4b61cec48f65f3be97713455c54cfb12e1f))

## [0.37.19](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.37.18...@kubb/swagger-ts-v0.37.19) (2023-01-09)


### Miscellaneous Chores

* **@kubb/swagger-ts:** Synchronize undefined versions

## [0.37.18](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.37.17...@kubb/swagger-ts-v0.37.18) (2023-01-08)


### Miscellaneous Chores

* **@kubb/swagger-ts:** Synchronize undefined versions

## [0.37.17](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.37.16...@kubb/swagger-ts-v0.37.17) (2023-01-08)


### Miscellaneous Chores

* **@kubb/swagger-ts:** Synchronize undefined versions

## [0.37.16](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.37.15...@kubb/swagger-ts-v0.37.16) (2023-01-08)


### Miscellaneous Chores

* **@kubb/swagger-ts:** Synchronize undefined versions

## [0.37.15](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.37.14...@kubb/swagger-ts-v0.37.15) (2023-01-08)


### Miscellaneous Chores

* **@kubb/swagger-ts:** Synchronize undefined versions

## [0.37.14](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.37.13...@kubb/swagger-ts-v0.37.14) (2023-01-08)


### Miscellaneous Chores

* **@kubb/swagger-ts:** Synchronize undefined versions

## [0.37.13](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.37.12...@kubb/swagger-ts-v0.37.13) (2023-01-08)


### Miscellaneous Chores

* **@kubb/swagger-ts:** Synchronize undefined versions

## [0.37.12](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.37.11...@kubb/swagger-ts-v0.37.12) (2023-01-08)


### Miscellaneous Chores

* **@kubb/swagger-ts:** Synchronize undefined versions

## [0.37.11](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.37.10...@kubb/swagger-ts-v0.37.11) (2023-01-08)


### Bug Fixes

* use core without fs-extra, see safeWriteFileToPath + removal of prettier format ([822d733](https://github.com/stijnvanhulle/kubb/commit/822d73312c84f989f6f55523f4bec23b6c8fdb78))

## [0.37.10](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.37.9...@kubb/swagger-ts-v0.37.10) (2023-01-08)


### Miscellaneous Chores

* **@kubb/swagger-ts:** Synchronize undefined versions

## [0.37.9](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.37.8...@kubb/swagger-ts-v0.37.9) (2023-01-08)


### Bug Fixes

* remove browser exports ([35e21ea](https://github.com/stijnvanhulle/kubb/commit/35e21ea5575d65414111820fa4a44c17fd68740d))

## [0.37.8](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.37.7...@kubb/swagger-ts-v0.37.8) (2023-01-08)


### Miscellaneous Chores

* **@kubb/swagger-ts:** Synchronize undefined versions

## [0.37.7](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.37.6...@kubb/swagger-ts-v0.37.7) (2023-01-08)


### Bug Fixes

* browser subpackage ([b8b3c19](https://github.com/stijnvanhulle/kubb/commit/b8b3c191d10465b0ddeabf3ecdf77d564b597f35))

## [0.37.6](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.37.5...@kubb/swagger-ts-v0.37.6) (2023-01-08)


### Bug Fixes

* correct browser tag ([3d8477a](https://github.com/stijnvanhulle/kubb/commit/3d8477a4ec148ecbfc9ca796f173d4d3c06790cb))

## [0.37.5](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.37.4...@kubb/swagger-ts-v0.37.5) (2023-01-08)


### Miscellaneous Chores

* **@kubb/swagger-ts:** Synchronize undefined versions

## [0.37.4](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.37.3...@kubb/swagger-ts-v0.37.4) (2023-01-08)


### Miscellaneous Chores

* **@kubb/swagger-ts:** Synchronize undefined versions

## [0.37.3](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.37.2...@kubb/swagger-ts-v0.37.3) (2023-01-08)


### Miscellaneous Chores

* **@kubb/swagger-ts:** Synchronize undefined versions

## [0.37.2](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.37.1...@kubb/swagger-ts-v0.37.2) (2023-01-08)


### Bug Fixes

* bring back changelog ([30573e4](https://github.com/stijnvanhulle/kubb/commit/30573e41027f01d79182b17f1f78152447d9401a))

## [0.37.1](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.37.0...@kubb/swagger-ts-v0.37.1) (2023-01-08)


### Miscellaneous Chores

* **@kubb/swagger-ts:** Synchronize undefined versions

## [0.37.0](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.36.1...@kubb/swagger-ts-v0.37.0) (2023-01-08)


### Miscellaneous Chores

* **@kubb/swagger-ts:** Synchronize undefined versions

## [0.36.1](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.36.0...@kubb/swagger-ts-v0.36.1) (2023-01-08)


### Bug Fixes

* createRequire for imports that are still using require, node14 with ESM mode does not support require out of the box(we had a crash on Nextjs) ([0fdec3f](https://github.com/stijnvanhulle/kubb/commit/0fdec3f3f4fdd8fbec11559b55c716bdb70100bc))

## [0.36.0](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.35.0...@kubb/swagger-ts-v0.36.0) (2023-01-08)


### Features

* use nextJs to convert JSON to types with swagger-ts ([3483562](https://github.com/stijnvanhulle/kubb/commit/34835621c2ea916f0366949e41ec7e242ec0bf34))

## [0.35.0](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.34.0...@kubb/swagger-ts-v0.35.0) (2023-01-07)


### Miscellaneous Chores

* **@kubb/swagger-ts:** Synchronize undefined versions

## [0.34.0](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.33.0...@kubb/swagger-ts-v0.34.0) (2023-01-07)


### Features

* use of operationGenerator for swagger-react-query + sort for the typebuilder ([fb4622c](https://github.com/stijnvanhulle/kubb/commit/fb4622c0837f3990172354dfc2cbf5fabefd033d))

## [0.33.0](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.32.0...@kubb/swagger-ts-v0.33.0) (2023-01-07)


### Features

* SchemaGenerator as base for other plugins that wants to generate schema's(typescript, zod,...) ([9a2f810](https://github.com/stijnvanhulle/kubb/commit/9a2f8105c1c33016184b817d95205ec8a7cd0cd7))

## [0.32.0](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.31.4...@kubb/swagger-ts-v0.32.0) (2023-01-06)


### Features

* use of TypeBuilder instead of generate ([bf68d9f](https://github.com/stijnvanhulle/kubb/commit/bf68d9f6cc2333bea074faaf39b18a4587f6ce89))

## [0.31.4](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.31.3...@kubb/swagger-ts-v0.31.4) (2023-01-06)


### Bug Fixes

* upgrade swc + cleanup imports ([28d26cd](https://github.com/stijnvanhulle/kubb/commit/28d26cd3123f5084b4519c12396b3a33602dad6f))

## [0.31.3](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.31.2...@kubb/swagger-ts-v0.31.3) (2023-01-05)


### Bug Fixes

* refactor with the use of generators and parsers ([ba604f3](https://github.com/stijnvanhulle/kubb/commit/ba604f3561b3515035978a2e36af5bd68339ffcd))

## [0.31.2](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.31.1...@kubb/swagger-ts-v0.31.2) (2023-01-05)


### Bug Fixes

* refactor validation plugins ([2e0c9b9](https://github.com/stijnvanhulle/kubb/commit/2e0c9b9a68f7cbf6d629a02166b8afe9de552606))

## [0.31.1](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.31.0...@kubb/swagger-ts-v0.31.1) (2023-01-05)


### Miscellaneous Chores

* **@kubb/swagger-ts:** Synchronize undefined versions

## [0.31.0](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.30.1...@kubb/swagger-ts-v0.31.0) (2023-01-04)


### Miscellaneous Chores

* **@kubb/swagger-ts:** Synchronize undefined versions

## [0.30.1](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.30.0...@kubb/swagger-ts-v0.30.1) (2023-01-04)


### Bug Fixes

* move writeIndexes to swagger-ts ([3d171a7](https://github.com/stijnvanhulle/kubb/commit/3d171a7a3c8e536398b9e99918607da9b18af8cc))

## [0.30.0](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.29.0...@kubb/swagger-ts-v0.30.0) (2023-01-04)


### Miscellaneous Chores

* **@kubb/swagger-ts:** Synchronize undefined versions

## [0.29.0](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.28.1...@kubb/swagger-ts-v0.29.0) (2023-01-04)


### Features

* mode directory so we can save models inside a models.ts file + addOrAppend for the fileManager ([e85477b](https://github.com/stijnvanhulle/kubb/commit/e85477ba4dff2b32df6a9c1103a69c18e2059b72))

## [0.28.1](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.28.0...@kubb/swagger-ts-v0.28.1) (2023-01-04)


### Bug Fixes

* replace importee by fileName and importer by directory ([b1a7d0f](https://github.com/stijnvanhulle/kubb/commit/b1a7d0fbfb512a7d0eb45e255f5f878a8645fd4d))

## [0.28.0](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.27.1...@kubb/swagger-ts-v0.28.0) (2023-01-04)


### Features

* use of directory-tree to create TreeNode structure to create index files(onBuildEnd) ([ed5abc5](https://github.com/stijnvanhulle/kubb/commit/ed5abc5aa3e31e32bfe193beb0a955486c0259d6))

## [0.27.1](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.27.0...@kubb/swagger-ts-v0.27.1) (2023-01-03)


### Bug Fixes

* rename emitFile by addFile ([fb947f1](https://github.com/stijnvanhulle/kubb/commit/fb947f1395c9adc0752d4bfbf8ffd5657546db2e))
* use of nodejs modules for lodash instead of import of full package ([d962c39](https://github.com/stijnvanhulle/kubb/commit/d962c396cabe42ff08dfdbcaa2c5f75b99fea288))

## [0.27.0](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.26.0...@kubb/swagger-ts-v0.27.0) (2023-01-03)


### Features

* fileManager root option + create graph ([205ee53](https://github.com/stijnvanhulle/kubb/commit/205ee537ea60b89e1ef2d0b25eb4037f2d01a4a2))


### Bug Fixes

* generate test fix + option withJSDocs for generate and Generator class ([660b47c](https://github.com/stijnvanhulle/kubb/commit/660b47ce961bc98b634420cab2e4b44db7ebe4e6))

## [0.26.0](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.25.1...@kubb/swagger-ts-v0.26.0) (2023-01-02)


### Features

* **swagger-react-query:** add jsdoc documentation for types and react-query hooks ([d5faa04](https://github.com/stijnvanhulle/kubb/commit/d5faa04d2dc511c7e50ef6af262f1396d5991264))

## [0.25.1](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.25.0...@kubb/swagger-ts-v0.25.1) (2023-01-02)


### Bug Fixes

* schema type jsdoc with undefined comment ([1491933](https://github.com/stijnvanhulle/kubb/commit/1491933e9805157a60c097c53e373419e3d6f6ee))

## [0.25.0](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.24.0...@kubb/swagger-ts-v0.25.0) (2023-01-02)


### Features

* **swagger-ts:** jsdocs codegen for typescript types with appendJSDocToNode and createJSDoc ([827850c](https://github.com/stijnvanhulle/kubb/commit/827850c4d0de657acc1eaf5d81d835d575452b68))


### Bug Fixes

* correct docsRepositoryBase ([3f9a471](https://github.com/stijnvanhulle/kubb/commit/3f9a47171ace52e41c5638f0adf8d7f53dc4283d))

## [0.24.0](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.23.2...@kubb/swagger-ts-v0.24.0) (2023-01-01)


### Miscellaneous Chores

* **@kubb/swagger-ts:** Synchronize undefined versions

## [0.23.2](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.23.1...@kubb/swagger-ts-v0.23.2) (2023-01-01)


### Bug Fixes

* use of new emitFile(File instead of EmitedFile) ([5c98f2d](https://github.com/stijnvanhulle/kubb/commit/5c98f2dc2f01e3c21a186b40990f9ebb7d3eeacc))

## [0.23.1](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.23.0...@kubb/swagger-ts-v0.23.1) (2023-01-01)


### Bug Fixes

* use of resolveId instead of custom swagger api fileResolver ([521d7f2](https://github.com/stijnvanhulle/kubb/commit/521d7f281377d24d8f4df46b6a4ab06904882060))

## [0.23.0](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.22.0...@kubb/swagger-ts-v0.23.0) (2023-01-01)


### Features

* emitFile can use EmittedFile or File + rewrite swagger plugin to use emitFile resolveId of selected plugin ([c43bc26](https://github.com/stijnvanhulle/kubb/commit/c43bc2621eddaacd27eed39f6d70586434326747))

## [0.22.0](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.21.1...@kubb/swagger-ts-v0.22.0) (2023-01-01)


### Miscellaneous Chores

* **@kubb/swagger-ts:** Synchronize undefined versions

## [0.21.1](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.21.0...@kubb/swagger-ts-v0.21.1) (2023-01-01)


### Bug Fixes

* use of this.resolveId with objectParams with possibility to call resolveIdForPlugin when passing pluginName ([c31ac69](https://github.com/stijnvanhulle/kubb/commit/c31ac6928906dcb758171966dc3a9e580546f345))

## [0.21.0](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.20.0...@kubb/swagger-ts-v0.21.0) (2023-01-01)


### Features

* FileManager with event emits(node) ([b419f35](https://github.com/stijnvanhulle/kubb/commit/b419f357ce7f62fecca8fe5ab413e111e3b8df20))
* resolveId for a specific plugin only(resolveIdForPlugin) ([5ebb878](https://github.com/stijnvanhulle/kubb/commit/5ebb8784ab48349412fe9627d361d502bafcc2cc))

## [0.20.0](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.19.1...@kubb/swagger-ts-v0.20.0) (2022-12-31)


### Miscellaneous Chores

* **@kubb/swagger-ts:** Synchronize undefined versions

## [0.19.1](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.19.0...@kubb/swagger-ts-v0.19.1) (2022-12-31)


### Bug Fixes

* correct escape for enter ([5ff9588](https://github.com/stijnvanhulle/kubb/commit/5ff9588ec22db706c3a915ca9f1d10d80bfd5522))

## [0.19.0](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.18.1...@kubb/swagger-ts-v0.19.0) (2022-12-31)


### Features

* generateImport + small refactor generate functionality ([d00d700](https://github.com/stijnvanhulle/kubb/commit/d00d700b9acb1dfd372fcc8735d64a8048ec0604))


### Bug Fixes

* codeGen export const ([6cab3df](https://github.com/stijnvanhulle/kubb/commit/6cab3dfb2b993f870d56689815be9df5c566c565))

## [0.18.1](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.18.0...@kubb/swagger-ts-v0.18.1) (2022-12-30)


### Bug Fixes

* withImport option for generateType and generateTypes ([4875c31](https://github.com/stijnvanhulle/kubb/commit/4875c311fe447f09bb86bd7b0a27054d47af27a1))

## [0.18.0](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.17.0...@kubb/swagger-ts-v0.18.0) (2022-12-30)


### Features

* generate rename to generateType and generateTypes for multiple schema's resolving ([a9410b3](https://github.com/stijnvanhulle/kubb/commit/a9410b30b88b3a1669965a362c5679f8a9cc159d))

## [0.17.0](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.16.0...@kubb/swagger-ts-v0.17.0) (2022-12-30)


### Bug Fixes

* refactor types and names ([f7ffc69](https://github.com/stijnvanhulle/kubb/commit/f7ffc69c00ab1648ff36ed93ec27a9c7996c0f21))
* rename addToIndex by addToRoot ([074003a](https://github.com/stijnvanhulle/kubb/commit/074003a43fa209750a9d122764daa34583b9da70))

## [0.16.0](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.15.0...@kubb/swagger-ts-v0.16.0) (2022-12-29)


### Features

* react-query generate function with extra options ([638bbe0](https://github.com/stijnvanhulle/kubb/commit/638bbe0bb2027bb5c9e2cebe5ff5b4f29bd5acf5))

## [0.15.0](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.14.2...@kubb/swagger-ts-v0.15.0) (2022-12-29)


### Miscellaneous Chores

* **@kubb/swagger-ts:** Synchronize undefined versions

## [0.14.2](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.14.1...@kubb/swagger-ts-v0.14.2) (2022-12-29)


### Bug Fixes

* remove duplicate getTypeFromSchema, only resolve import type of used type ([9abe034](https://github.com/stijnvanhulle/kubb/commit/9abe0348c6c322fd1f9f832701696b567ad25e54))

## [0.14.1](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.14.0...@kubb/swagger-ts-v0.14.1) (2022-12-28)


### Miscellaneous Chores

* **@kubb/swagger-ts:** Synchronize undefined versions

## [0.14.0](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.13.0...@kubb/swagger-ts-v0.14.0) (2022-12-28)


### Features

* array type for generator(kubb-swagger-typesctip) ([a8c13a0](https://github.com/stijnvanhulle/kubb/commit/a8c13a0e79603b52382877d905748108e6f1badf))
* better use of resolveId(importee and importer) ([f650c70](https://github.com/stijnvanhulle/kubb/commit/f650c7064c89006053e22d898ca2762d6cc99103))
* clear functionality ([a4347c5](https://github.com/stijnvanhulle/kubb/commit/a4347c58c62d77e7f8385902d6cf4c9cbf8f255f))
* simpler index generation for types and reactQuery + combine subfolders ([832827b](https://github.com/stijnvanhulle/kubb/commit/832827b79b7a4f945cb21900d57f360a4673c03e))
* use of #ref for types ([4414054](https://github.com/stijnvanhulle/kubb/commit/4414054efe2a5790a6b5a1e7ff04eddacf2aaf2b))


### Bug Fixes

* correct use of importer for typescript-react-query ([a2cfb52](https://github.com/stijnvanhulle/kubb/commit/a2cfb523ddff9c2273698cb62540889d0056fe8c))
* endless loop fileEmitter delete ([916918f](https://github.com/stijnvanhulle/kubb/commit/916918fb007ac09833d61f8fd4e4773689a57e71))

## [0.13.0](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.12.0...@kubb/swagger-ts-v0.13.0) (2022-12-26)


### Features

* output option for swagger-ts ([ab7694f](https://github.com/stijnvanhulle/kubb/commit/ab7694f1b2334799ad18f290042e96375751bc46))

## [0.12.0](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.11.2...@kubb/swagger-ts-v0.12.0) (2022-12-26)


### Bug Fixes

* generic use of cache inside of core plugin ([b9e1525](https://github.com/stijnvanhulle/kubb/commit/b9e1525511e94872c0e05eaf2182c6a4b2f6b546))

## [0.11.2](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.11.1...@kubb/swagger-ts-v0.11.2) (2022-12-26)


### Bug Fixes

* use of input.path instead of input.schema ([4d70ac8](https://github.com/stijnvanhulle/kubb/commit/4d70ac8c1ab211ac05a391af4ccbd06f514437a7))

## [0.11.1](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.11.0...@kubb/swagger-ts-v0.11.1) (2022-12-12)


### Bug Fixes

* definePlugin and export names of plugin and cleanup ([a17eb80](https://github.com/stijnvanhulle/kubb/commit/a17eb80a90debb7f9cbf646dd9e9905489d42031))
* use of buildstart instead of load for swagger-ts ([a289af5](https://github.com/stijnvanhulle/kubb/commit/a289af5a02be650167dc73eb325fca8100b74c85))

## [0.11.0](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.10.0...@kubb/swagger-ts-v0.11.0) (2022-12-12)


### Features

* ✨ swagger-react-query ([d2e5866](https://github.com/stijnvanhulle/kubb/commit/d2e58668dd85b24ae99944754e64a153155b03b4))

## [0.10.0](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.9.1...@kubb/swagger-ts-v0.10.0) (2022-12-11)


### Features

* add simple example + cleanup packages ([1069dcf](https://github.com/stijnvanhulle/kubb/commit/1069dcff473f151696dbf533ec07624ec4fd5d20))

## [0.9.1](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.9.0...@kubb/swagger-ts-v0.9.1) (2022-11-29)


### Miscellaneous Chores

* **@kubb/swagger-ts:** Synchronize undefined versions

## [0.9.0](https://github.com/stijnvanhulle/kubb/compare/@kubb/swagger-ts-v0.8.0...@kubb/swagger-ts-v0.9.0) (2022-11-24)


### Features

* add general QueueMeta type ([46fc7b9](https://github.com/stijnvanhulle/kubb/commit/46fc7b9ee413e35e7de6cb1f70a9d0627a06848a))
* base type creation with new generator(using typescript compiler) ([3350167](https://github.com/stijnvanhulle/kubb/commit/3350167d6e6ec1a6acf0254534397d3e69a1b75a))
* create index files for all generated files ([4c26cf1](https://github.com/stijnvanhulle/kubb/commit/4c26cf13d9985ca546bdabc5a9e699bd3c9bed3f))
* queue system ([7d56acd](https://github.com/stijnvanhulle/kubb/commit/7d56acdfaca448d32df88613f8665f31c317ddd1))
* swagger-ts ([54fb329](https://github.com/stijnvanhulle/kubb/commit/54fb32936f4d06beb03eedc576820452497db25b))
* **swagger-ts:** ✨ useQuery with react-query(tryout) ([84eb7e2](https://github.com/stijnvanhulle/kubb/commit/84eb7e2a7b7158b8eb7a950ef99b9c356cc8fd8a))
* use of api object(same like Rollup does it) ([b78a189](https://github.com/stijnvanhulle/kubb/commit/b78a189a9d92aa206873884fbee4a11691d56884))
* use of custom transform(hookReduceArg0) to reduce the result for transform ([4fb3889](https://github.com/stijnvanhulle/kubb/commit/4fb388959326f4caa93dd70ff11ea3afd39d24c9))
* use of on for the event Emitter ([fb13274](https://github.com/stijnvanhulle/kubb/commit/fb13274889b5ddfad3919747f526c23d7ab14745))
* useQuery with response object type ([4f03bd6](https://github.com/stijnvanhulle/kubb/commit/4f03bd69a1f683610bd1df247dbc420c43debd09))


### Bug Fixes

* correct output path(root + output.path) ([726aa60](https://github.com/stijnvanhulle/kubb/commit/726aa608bd089e112e6dcd594405c83f65ba88dc))
* correct transform(delete out of queue when transform returns null) ([186f7f3](https://github.com/stijnvanhulle/kubb/commit/186f7f32adb9c580959d18dc7e200a8e43688c2f))
* typing related to overloading with declare module ([4f99899](https://github.com/stijnvanhulle/kubb/commit/4f99899cd9eb8e8b2ac8bf83ff15faf356701e5d))
* use same parameter order for write as other logic + only show logger when logLevel is defined ([b71eedf](https://github.com/stijnvanhulle/kubb/commit/b71eedf43a8e94b528fd1e1975869e4a4474a3f8))
