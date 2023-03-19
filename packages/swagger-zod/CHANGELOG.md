# Changelog

## [1.0.1-alpha.7](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zod-v1.0.0-alpha.7...@kubb/swagger-zod-v1.0.1-alpha.7) (2023-03-19)


### Miscellaneous Chores

* **@kubb/swagger-zod:** Synchronize undefined versions

## [1.0.0-alpha.7](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zod-v1.0.0-alpha.6...@kubb/swagger-zod-v1.0.0-alpha.7) (2023-03-18)


### Features

* add put and delete operations + params for URL type ([21ab4cf](https://github.com/kubb-project/kubb/commit/21ab4cff7ceab496718119e6abc145e96125b364))
* extraTexts for zodBuilder and enum for zod ([9f61235](https://github.com/kubb-project/kubb/commit/9f61235a71a3b0633387b3ea47a913943da3f623))
* format with js-beautify instead of Prettier(works also in the browser) ([ecc0952](https://github.com/kubb-project/kubb/commit/ecc0952c929aa71bac8a3bb0cf400289c7dee142))
* getUniqueName used for aliases + also for enums ([60580c4](https://github.com/kubb-project/kubb/commit/60580c4e79b4e1154855bafffeb63c2f4e9fc202))
* intersection for allOf ([7418a7c](https://github.com/kubb-project/kubb/commit/7418a7cd344885c3f5c93ebcf96c86b4f23eae67))
* oasBuilder ([2001bb9](https://github.com/kubb-project/kubb/commit/2001bb9f6b4b65a4d67e1e3b4f75517c109c2a44))
* oneof for zod and typescript + added description for zod ([ebef9d2](https://github.com/kubb-project/kubb/commit/ebef9d2597f38989c6d43a87053d5eba23948bca))
* sort for types and zodSchemas based on refs(first ones based on a ref and then the ones using the ref) ([0f9c424](https://github.com/kubb-project/kubb/commit/0f9c4249f912867aea49d025e3983db72f09a5e5))
* ts-codegen package ([b25db7e](https://github.com/kubb-project/kubb/commit/b25db7e9b874dd953f25b1814c4c7db3fbc9ff0b))
* use of PathParams and QueryParams ([f60dd4f](https://github.com/kubb-project/kubb/commit/f60dd4f6a389bfb4712671ed9c17ef838637c8a5))
* use of pathParams to create function arguments for ReactQuery GET hooks ([e6994fc](https://github.com/kubb-project/kubb/commit/e6994fc9576122d1aaf2edabab65d871f43a6e8a))
* zod enum ([ee17710](https://github.com/kubb-project/kubb/commit/ee1771074848a425e50ea9dbb0a9f898c7d617ae))
* zod package with zod.any and zod.object({}) ([d19b6a3](https://github.com/kubb-project/kubb/commit/d19b6a3f81d3c21ddd68d67cb5d4b7839f26fd77))
* zod.object with parameters, zod.array and zod ref with correc import ([e0d111c](https://github.com/kubb-project/kubb/commit/e0d111c53a98e55ec58498c2a9d048724289c64e))


### Bug Fixes

* anyof and allof can also have non ref object(string, number, object, ...) ([8a54be3](https://github.com/kubb-project/kubb/commit/8a54be3a50c74717637255598ed4c758c7e9a53b))
* cleanup imports and move duplicate stuff to swagger package ([73e7c66](https://github.com/kubb-project/kubb/commit/73e7c660dc3856afad64cf53f294f5003fa63f27))
* do not write indexes when output.write is false ([0c96139](https://github.com/kubb-project/kubb/commit/0c961392dcb56fa6b7d0334317fc36181e45e561))
* filter out if schema.map is not a function ([57250ed](https://github.com/kubb-project/kubb/commit/57250edded807b9641a61ffeefee2f96a1349f80))
* openAPI v3.1.0 support for schema.type array ([ced713d](https://github.com/kubb-project/kubb/commit/ced713d69a3989c7a4d47bb16577f78a13dfc82f))
* refactor of operationgenerator + baseOperationGenerator for swagger package ([2f4739b](https://github.com/kubb-project/kubb/commit/2f4739b25e3a456f44647ee46272cd341975152b))
* refactor zodBuilder and typeBuilder ([6e0ada6](https://github.com/kubb-project/kubb/commit/6e0ada6af9fa71658c0812cc72db507aa15cea66))
* support for ESM modules ([cec3b57](https://github.com/kubb-project/kubb/commit/cec3b57ba9b97a030bb276a3957c826ace72b7d3))
* uniq enums for zod and ts ([cc05916](https://github.com/kubb-project/kubb/commit/cc059162d2698844a72a2d8d07a92c62529bbbd9))
* upgrade typescript ([5f01312](https://github.com/kubb-project/kubb/commit/5f01312d290f666299eeffb6b685e5a4980e1e47))
* use of camelCase for zod schemas ([3406eeb](https://github.com/kubb-project/kubb/commit/3406eeb9bd380000a35eaabb942c19a137e3b2a8))
* use of export function instead of export const ([a054099](https://github.com/kubb-project/kubb/commit/a0540996de5f4340101e5065ab94df31d4cc3fae))
* use of isTypeOnly instead of type for FileManager ([d921543](https://github.com/kubb-project/kubb/commit/d921543daff94838da38629e6341d2dd1dba77ec))
* use of z.lazy for zod imorted schemas + importsGenerator based on key(and lowecased) ([250ec5a](https://github.com/kubb-project/kubb/commit/250ec5a03e13a8e4df653788ddf075f7d6f0fd82))
* when post/get does not exist, do not generate type/hook/schema ([16b5648](https://github.com/kubb-project/kubb/commit/16b5648b613a66811d1b24be0d6065bb84b3143a))


### Miscellaneous Chores

* release 1.0.0-alpha.1 ([608fd59](https://github.com/kubb-project/kubb/commit/608fd5926079f9dd77046d6788a5550fb964c0b2))
* release 1.0.0-alpha.2 ([3d645ac](https://github.com/kubb-project/kubb/commit/3d645accedb121856e61bab166fafe74db6ca3f3))
* release 1.0.0-alpha.3 ([4fb3d6a](https://github.com/kubb-project/kubb/commit/4fb3d6a6ff5b6b0950d94a12f04c4fd3db89c595))
* release 1.0.0-alpha.4 ([8d808c3](https://github.com/kubb-project/kubb/commit/8d808c3d0b255b76dc79ad92324f0f2ee8afd619))
* release 1.0.0-alpha.5 ([8bb9ed2](https://github.com/kubb-project/kubb/commit/8bb9ed2d0ce9ee47db2d24daba993b81cd56d2c0))
* release 1.0.0-alpha.6 ([550035a](https://github.com/kubb-project/kubb/commit/550035a122a2e5a5294a49a0d2c927fc238315e6))
* release 1.0.0-alpha.7 ([29bd33a](https://github.com/kubb-project/kubb/commit/29bd33aefb990c298d6615f10add0ca7fce69861))

## [1.0.0-alpha.6](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zod-v1.0.0-alpha.5...@kubb/swagger-zod-v1.0.0-alpha.6) (2023-03-11)


### Bug Fixes

* use of z.lazy for zod imorted schemas + importsGenerator based on key(and lowecased) ([250ec5a](https://github.com/kubb-project/kubb/commit/250ec5a03e13a8e4df653788ddf075f7d6f0fd82))


### Miscellaneous Chores

* release 1.0.0-alpha.6 ([550035a](https://github.com/kubb-project/kubb/commit/550035a122a2e5a5294a49a0d2c927fc238315e6))

## [1.0.0-alpha.5](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zod-v1.0.0-alpha.4...@kubb/swagger-zod-v1.0.0-alpha.5) (2023-03-11)


### Miscellaneous Chores

* release 1.0.0-alpha.5 ([8bb9ed2](https://github.com/kubb-project/kubb/commit/8bb9ed2d0ce9ee47db2d24daba993b81cd56d2c0))

## [1.0.0-alpha.4](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zod-v1.0.0-alpha.3...@kubb/swagger-zod-v1.0.0-alpha.4) (2023-03-10)


### Miscellaneous Chores

* release 1.0.0-alpha.4 ([8d808c3](https://github.com/kubb-project/kubb/commit/8d808c3d0b255b76dc79ad92324f0f2ee8afd619))

## [1.0.0-alpha.3](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zod-v1.0.0-alpha.2...@kubb/swagger-zod-v1.0.0-alpha.3) (2023-03-10)


### Features

* getUniqueName used for aliases + also for enums ([60580c4](https://github.com/kubb-project/kubb/commit/60580c4e79b4e1154855bafffeb63c2f4e9fc202))


### Bug Fixes

* use of export function instead of export const ([a054099](https://github.com/kubb-project/kubb/commit/a0540996de5f4340101e5065ab94df31d4cc3fae))


### Miscellaneous Chores

* release 1.0.0-alpha.3 ([4fb3d6a](https://github.com/kubb-project/kubb/commit/4fb3d6a6ff5b6b0950d94a12f04c4fd3db89c595))

## [1.0.0-alpha.2](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zod-v1.0.0-alpha.1...@kubb/swagger-zod-v1.0.0-alpha.2) (2023-03-09)


### Bug Fixes

* openAPI v3.1.0 support for schema.type array ([ced713d](https://github.com/kubb-project/kubb/commit/ced713d69a3989c7a4d47bb16577f78a13dfc82f))


### Miscellaneous Chores

* release 1.0.0-alpha.2 ([3d645ac](https://github.com/kubb-project/kubb/commit/3d645accedb121856e61bab166fafe74db6ca3f3))

## [1.0.0-alpha.1](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zod-v0.56.4...@kubb/swagger-zod-v1.0.0-alpha.1) (2023-03-05)


### Miscellaneous Chores

* release 1.0.0-alpha.1 ([608fd59](https://github.com/kubb-project/kubb/commit/608fd5926079f9dd77046d6788a5550fb964c0b2))

## [0.56.4](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zod-v0.56.3...@kubb/swagger-zod-v0.56.4) (2023-03-02)


### Miscellaneous Chores

* **@kubb/swagger-zod:** Synchronize undefined versions

## [0.56.3](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zod-v0.56.2...@kubb/swagger-zod-v0.56.3) (2023-03-02)


### Miscellaneous Chores

* **@kubb/swagger-zod:** Synchronize undefined versions

## [0.56.2](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zod-v0.56.1...@kubb/swagger-zod-v0.56.2) (2023-03-02)


### Miscellaneous Chores

* **@kubb/swagger-zod:** Synchronize undefined versions

## [0.56.1](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zod-v0.56.0...@kubb/swagger-zod-v0.56.1) (2023-03-01)


### Bug Fixes

* support for ESM modules ([cec3b57](https://github.com/kubb-project/kubb/commit/cec3b57ba9b97a030bb276a3957c826ace72b7d3))

## [0.56.0](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zod-v0.55.0...@kubb/swagger-zod-v0.56.0) (2023-02-28)


### Bug Fixes

* anyof and allof can also have non ref object(string, number, object, ...) ([8a54be3](https://github.com/kubb-project/kubb/commit/8a54be3a50c74717637255598ed4c758c7e9a53b))

## [0.55.0](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zod-v0.54.0...@kubb/swagger-zod-v0.55.0) (2023-02-27)


### Miscellaneous Chores

* **@kubb/swagger-zod:** Synchronize undefined versions

## [0.54.0](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zod-v0.53.0...@kubb/swagger-zod-v0.54.0) (2023-02-26)


### Miscellaneous Chores

* **@kubb/swagger-zod:** Synchronize undefined versions

## [0.53.0](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zod-v0.52.1...@kubb/swagger-zod-v0.53.0) (2023-02-26)


### Miscellaneous Chores

* **@kubb/swagger-zod:** Synchronize undefined versions

## [0.52.1](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zod-v0.52.0...@kubb/swagger-zod-v0.52.1) (2023-02-26)


### Bug Fixes

* uniq enums for zod and ts ([cc05916](https://github.com/kubb-project/kubb/commit/cc059162d2698844a72a2d8d07a92c62529bbbd9))

## [0.52.0](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zod-v0.51.0...@kubb/swagger-zod-v0.52.0) (2023-02-26)


### Features

* intersection for allOf ([7418a7c](https://github.com/kubb-project/kubb/commit/7418a7cd344885c3f5c93ebcf96c86b4f23eae67))
* oneof for zod and typescript + added description for zod ([ebef9d2](https://github.com/kubb-project/kubb/commit/ebef9d2597f38989c6d43a87053d5eba23948bca))

## [0.51.0](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zod-v0.50.1...@kubb/swagger-zod-v0.51.0) (2023-02-25)


### Features

* extraTexts for zodBuilder and enum for zod ([9f61235](https://github.com/kubb-project/kubb/commit/9f61235a71a3b0633387b3ea47a913943da3f623))

## [0.50.1](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zod-v0.50.0...@kubb/swagger-zod-v0.50.1) (2023-02-23)


### Miscellaneous Chores

* **@kubb/swagger-zod:** Synchronize undefined versions

## [0.50.0](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zod-v0.49.1...@kubb/swagger-zod-v0.50.0) (2023-02-23)


### Features

* ts-codegen package ([b25db7e](https://github.com/kubb-project/kubb/commit/b25db7e9b874dd953f25b1814c4c7db3fbc9ff0b))


### Bug Fixes

* cleanup imports and move duplicate stuff to swagger package ([73e7c66](https://github.com/kubb-project/kubb/commit/73e7c660dc3856afad64cf53f294f5003fa63f27))

## [0.49.1](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zod-v0.49.0...@kubb/swagger-zod-v0.49.1) (2023-02-23)


### Bug Fixes

* refactor zodBuilder and typeBuilder ([6e0ada6](https://github.com/kubb-project/kubb/commit/6e0ada6af9fa71658c0812cc72db507aa15cea66))

## [0.49.0](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zod-v0.48.0...@kubb/swagger-zod-v0.49.0) (2023-02-23)


### Features

* sort for types and zodSchemas based on refs(first ones based on a ref and then the ones using the ref) ([0f9c424](https://github.com/kubb-project/kubb/commit/0f9c4249f912867aea49d025e3983db72f09a5e5))

## [0.48.0](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zod-v0.47.1...@kubb/swagger-zod-v0.48.0) (2023-02-23)


### Features

* oasBuilder ([2001bb9](https://github.com/kubb-project/kubb/commit/2001bb9f6b4b65a4d67e1e3b4f75517c109c2a44))

## [0.47.1](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zod-v0.47.0...@kubb/swagger-zod-v0.47.1) (2023-02-22)


### Bug Fixes

* refactor of operationgenerator + baseOperationGenerator for swagger package ([2f4739b](https://github.com/kubb-project/kubb/commit/2f4739b25e3a456f44647ee46272cd341975152b))

## [0.47.0](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zod-v0.46.0...@kubb/swagger-zod-v0.47.0) (2023-02-22)


### Features

* format with js-beautify instead of Prettier(works also in the browser) ([ecc0952](https://github.com/kubb-project/kubb/commit/ecc0952c929aa71bac8a3bb0cf400289c7dee142))

## [0.46.0](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zod-v0.45.1...@kubb/swagger-zod-v0.46.0) (2023-02-22)


### Miscellaneous Chores

* **@kubb/swagger-zod:** Synchronize undefined versions

## [0.45.1](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zod-v0.45.0...@kubb/swagger-zod-v0.45.1) (2023-02-22)


### Bug Fixes

* do not write indexes when output.write is false ([0c96139](https://github.com/kubb-project/kubb/commit/0c961392dcb56fa6b7d0334317fc36181e45e561))

## [0.45.0](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zod-v0.44.2...@kubb/swagger-zod-v0.45.0) (2023-02-22)


### Features

* use of PathParams and QueryParams ([f60dd4f](https://github.com/kubb-project/kubb/commit/f60dd4f6a389bfb4712671ed9c17ef838637c8a5))
* use of pathParams to create function arguments for ReactQuery GET hooks ([e6994fc](https://github.com/kubb-project/kubb/commit/e6994fc9576122d1aaf2edabab65d871f43a6e8a))

## [0.44.2](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zod-v0.44.1...@kubb/swagger-zod-v0.44.2) (2023-02-22)


### Miscellaneous Chores

* **@kubb/swagger-zod:** Synchronize undefined versions

## [0.44.1](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zod-v0.44.0...@kubb/swagger-zod-v0.44.1) (2023-02-22)


### Miscellaneous Chores

* **@kubb/swagger-zod:** Synchronize undefined versions

## [0.44.0](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zod-v0.43.3...@kubb/swagger-zod-v0.44.0) (2023-02-22)


### Features

* add put and delete operations + params for URL type ([21ab4cf](https://github.com/kubb-project/kubb/commit/21ab4cff7ceab496718119e6abc145e96125b364))
* zod enum ([ee17710](https://github.com/kubb-project/kubb/commit/ee1771074848a425e50ea9dbb0a9f898c7d617ae))
* zod package with zod.any and zod.object({}) ([d19b6a3](https://github.com/kubb-project/kubb/commit/d19b6a3f81d3c21ddd68d67cb5d4b7839f26fd77))
* zod.object with parameters, zod.array and zod ref with correc import ([e0d111c](https://github.com/kubb-project/kubb/commit/e0d111c53a98e55ec58498c2a9d048724289c64e))


### Bug Fixes

* filter out if schema.map is not a function ([57250ed](https://github.com/kubb-project/kubb/commit/57250edded807b9641a61ffeefee2f96a1349f80))
* use of camelCase for zod schemas ([3406eeb](https://github.com/kubb-project/kubb/commit/3406eeb9bd380000a35eaabb942c19a137e3b2a8))
* use of isTypeOnly instead of type for FileManager ([d921543](https://github.com/kubb-project/kubb/commit/d921543daff94838da38629e6341d2dd1dba77ec))
* when post/get does not exist, do not generate type/hook/schema ([16b5648](https://github.com/kubb-project/kubb/commit/16b5648b613a66811d1b24be0d6065bb84b3143a))

## [0.43.3](https://github.com/kubb-project/kubb/compare/@kubb/cli-v0.43.2...@kubb/cli-v0.43.3) (2023-02-21)


### Miscellaneous Chores

* **@kubb/cli:** Synchronize undefined versions

## [0.43.2](https://github.com/kubb-project/kubb/compare/@kubb/cli-v0.43.1...@kubb/cli-v0.43.2) (2023-02-21)


### Miscellaneous Chores

* **@kubb/cli:** Synchronize undefined versions

## [0.43.1](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zod-v0.43.0...@kubb/swagger-zod-v0.43.1) (2023-02-21)


### Bug Fixes

* filter out if schema.map is not a function ([57250ed](https://github.com/kubb-project/kubb/commit/57250edded807b9641a61ffeefee2f96a1349f80))

## [0.43.0](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zod-v0.42.1...@kubb/swagger-zod-v0.43.0) (2023-02-21)


### Features

* add put and delete operations + params for URL type ([21ab4cf](https://github.com/kubb-project/kubb/commit/21ab4cff7ceab496718119e6abc145e96125b364))
* zod enum ([ee17710](https://github.com/kubb-project/kubb/commit/ee1771074848a425e50ea9dbb0a9f898c7d617ae))
* zod package with zod.any and zod.object({}) ([d19b6a3](https://github.com/kubb-project/kubb/commit/d19b6a3f81d3c21ddd68d67cb5d4b7839f26fd77))
* zod.object with parameters, zod.array and zod ref with correc import ([e0d111c](https://github.com/kubb-project/kubb/commit/e0d111c53a98e55ec58498c2a9d048724289c64e))


### Bug Fixes

* use of camelCase for zod schemas ([3406eeb](https://github.com/kubb-project/kubb/commit/3406eeb9bd380000a35eaabb942c19a137e3b2a8))
* use of isTypeOnly instead of type for FileManager ([d921543](https://github.com/kubb-project/kubb/commit/d921543daff94838da38629e6341d2dd1dba77ec))
* when post/get does not exist, do not generate type/hook/schema ([16b5648](https://github.com/kubb-project/kubb/commit/16b5648b613a66811d1b24be0d6065bb84b3143a))
