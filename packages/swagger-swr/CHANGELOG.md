# Changelog

## [1.1.0-beta.10](https://github.com/kubb-project/kubb/compare/@kubb/swagger-swr-v1.0.0-beta.10...@kubb/swagger-swr-v1.1.0-beta.10) (2023-04-09)


### Features

* `groupBy.exportAs` to make it possible go group all import with `export * as groupBy.exportAs from "./x"` ([214ff25](https://github.com/kubb-project/kubb/commit/214ff250e8ecf23d754a456c1b9289c6475099e0))


### Bug Fixes

* correct use of params ([2352c51](https://github.com/kubb-project/kubb/commit/2352c511fc7fd76adfed1260773c3f6fdee3b23a))

## [1.0.0-beta.10](https://github.com/kubb-project/kubb/compare/@kubb/swagger-swr-v1.0.0-beta.9...@kubb/swagger-swr-v1.0.0-beta.10) (2023-04-09)


### Features

* enumType to use an `Enum` or use `* as const` ([29b396f](https://github.com/kubb-project/kubb/commit/29b396f6980f1119502a0f40e5bb4f7e43346480))
* error type for swr and tanstack-query ([7c71f72](https://github.com/kubb-project/kubb/commit/7c71f7216ef22f3a87fbac7fc10920aac69704ed))
* groupby as object with `type` and `output` which can be customised with a handlebar like syntax ([c687864](https://github.com/kubb-project/kubb/commit/c687864b2ac82643757ef7b2f6158410144a73fe))


### Bug Fixes

* exclude queryParams for method DELETE ([71b2478](https://github.com/kubb-project/kubb/commit/71b2478bd02bf77e6d0d2277e3dce6e9546c32d2))


### Miscellaneous Chores

* release 1.0.0-beta.10 ([bb4ab12](https://github.com/kubb-project/kubb/commit/bb4ab1290053274ae46b867f1876214506b0669a))

## [1.0.0-beta.9](https://github.com/kubb-project/kubb/compare/@kubb/swagger-swr-v1.0.0-beta.8...@kubb/swagger-swr-v1.0.0-beta.9) (2023-04-05)


### Miscellaneous Chores

* release 1.0.0-beta.9 ([3f57281](https://github.com/kubb-project/kubb/commit/3f5728174b5c004ab7fb0d860960caf409bda040))

## [1.0.0-beta.8](https://github.com/kubb-project/kubb/compare/@kubb/swagger-swr-v1.0.0-beta.7...@kubb/swagger-swr-v1.0.0-beta.8) (2023-04-05)


### Bug Fixes

* use of declare module to have autocomplete when using plugins in object format ([b64e728](https://github.com/kubb-project/kubb/commit/b64e728bcf61824c7c9609b363ffcdbea6c1530f))


### Miscellaneous Chores

* release 1.0.0-beta.8 ([f331db4](https://github.com/kubb-project/kubb/commit/f331db4a15fee8de12e95b9583b111dc1cbe8cc4))

## [1.0.0-beta.7](https://github.com/kubb-project/kubb/compare/@kubb/swagger-swr-v1.0.0-beta.6...@kubb/swagger-swr-v1.0.0-beta.7) (2023-04-04)


### Miscellaneous Chores

* release 1.0.0-beta.7 ([7973833](https://github.com/kubb-project/kubb/commit/7973833327cc54286c872b609da34786fa71e447))

## [1.0.0-beta.6](https://github.com/kubb-project/kubb/compare/@kubb/swagger-swr-v1.0.0-beta.5...@kubb/swagger-swr-v1.0.0-beta.6) (2023-04-04)


### Miscellaneous Chores

* release 1.0.0-beta.6 ([b11e6fe](https://github.com/kubb-project/kubb/commit/b11e6fe2b65c4784c151bb2e08729cd166f09151))
* release 1.0.0-beta.6 ([6f27206](https://github.com/kubb-project/kubb/commit/6f2720619c386771b9a8ea232c23948ff3781203))

## [1.0.0-beta.5](https://github.com/kubb-project/kubb/compare/@kubb/swagger-swr-v1.0.0-beta.4...@kubb/swagger-swr-v1.0.0-beta.5) (2023-04-03)


### Features

* operation object with all paths and methods grouped by operationId ([5cd51db](https://github.com/kubb-project/kubb/commit/5cd51dbdc4e2ed366313b17d9f9a273e8e9a5db1))
* swaggerOperationGenerator with getParams and abstract resolve ([876173a](https://github.com/kubb-project/kubb/commit/876173a0c8a3ea2f18f81b8c7e26a83d3eab8214))
* swr plugin ([fb091d9](https://github.com/kubb-project/kubb/commit/fb091d98b97cf91df8ccdeb84db6b963cc7e3712))
* use of resolveName of pluginContext ([3903e73](https://github.com/kubb-project/kubb/commit/3903e73c547c1137b48d3d4630fb34dbf1434857))


### Bug Fixes

* cleanup operationGenerator ([15be8e1](https://github.com/kubb-project/kubb/commit/15be8e152512fe1c84bdbec9a117e3728e254fef))
* move getParams out of operationGenerator ([12701df](https://github.com/kubb-project/kubb/commit/12701dfaf2cd724f1a86db0544ffd2d19f30386b))


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

## [1.0.0-beta.4](https://github.com/kubb-project/kubb/compare/@kubb/swagger-swr-v1.0.0-beta.3...@kubb/swagger-swr-v1.0.0-beta.4) (2023-03-31)


### Features

* operation object with all paths and methods grouped by operationId ([5cd51db](https://github.com/kubb-project/kubb/commit/5cd51dbdc4e2ed366313b17d9f9a273e8e9a5db1))


### Bug Fixes

* cleanup operationGenerator ([15be8e1](https://github.com/kubb-project/kubb/commit/15be8e152512fe1c84bdbec9a117e3728e254fef))


### Miscellaneous Chores

* release 1.0.0-beta.4 ([4127252](https://github.com/kubb-project/kubb/commit/4127252b59422a5692e17e3673a26ae346d9cdba))

## [1.0.0-beta.3](https://github.com/kubb-project/kubb/compare/@kubb/swagger-swr-v1.0.0-beta.2...@kubb/swagger-swr-v1.0.0-beta.3) (2023-03-27)


### Features

* swr plugin ([fb091d9](https://github.com/kubb-project/kubb/commit/fb091d98b97cf91df8ccdeb84db6b963cc7e3712))


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
