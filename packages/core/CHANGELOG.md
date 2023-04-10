# Changelog
## [1.0.1-beta.11](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.0.0-beta.11...@kubb/core-v1.0.1-beta.11) (2023-04-10)


### Bug Fixes

* no fileManager needed for OperationGenerator + this.addFile change with multiParams ([cde8225](https://github.com/kubb-project/kubb/commit/cde8225a5207360bd17f4ede66ce2a07d5dfd53d))
* remove propdrilling of directory ([99b8016](https://github.com/kubb-project/kubb/commit/99b801658a514a223e590d14f7d7729e85391ffc))

## [1.0.0-beta.11](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.0.0-beta.10...@kubb/core-v1.0.0-beta.11) (2023-04-09)


### Features

* `groupBy.exportAs` to make it possible go group all import with `export * as groupBy.exportAs from "./x"` ([214ff25](https://github.com/kubb-project/kubb/commit/214ff250e8ecf23d754a456c1b9289c6475099e0))


### Miscellaneous Chores

* release 1.0.0-beta.11 ([826bf51](https://github.com/kubb-project/kubb/commit/826bf517f275ac5e75c89bde26d7f6d8abef76c8))

## [1.0.0-beta.10](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.0.0-beta.9...@kubb/core-v1.0.0-beta.10) (2023-04-09)


### Bug Fixes

* duplocated queryParams(coming from the pathParams) ([714281f](https://github.com/kubb-project/kubb/commit/714281f5d511c02c130a66b75e774f231ee06e9b))
* writeIndexes without write, use of the filemanager instead ([5359521](https://github.com/kubb-project/kubb/commit/53595216451a21f25a8687e564c16f4d13d1f594))


### Miscellaneous Chores

* release 1.0.0-beta.10 ([bb4ab12](https://github.com/kubb-project/kubb/commit/bb4ab1290053274ae46b867f1876214506b0669a))

## [1.0.0-beta.9](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.0.0-beta.8...@kubb/core-v1.0.0-beta.9) (2023-04-05)


### Miscellaneous Chores

* release 1.0.0-beta.9 ([3f57281](https://github.com/kubb-project/kubb/commit/3f5728174b5c004ab7fb0d860960caf409bda040))

## [1.0.0-beta.8](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.0.0-beta.7...@kubb/core-v1.0.0-beta.8) (2023-04-05)


### Bug Fixes

* use of declare module to have autocomplete when using plugins in object format ([b64e728](https://github.com/kubb-project/kubb/commit/b64e728bcf61824c7c9609b363ffcdbea6c1530f))


### Miscellaneous Chores

* release 1.0.0-beta.8 ([f331db4](https://github.com/kubb-project/kubb/commit/f331db4a15fee8de12e95b9583b111dc1cbe8cc4))

## [1.0.0-beta.7](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.0.0-beta.6...@kubb/core-v1.0.0-beta.7) (2023-04-04)


### Miscellaneous Chores

* release 1.0.0-beta.7 ([7973833](https://github.com/kubb-project/kubb/commit/7973833327cc54286c872b609da34786fa71e447))

## [1.0.0-beta.6](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.0.0-beta.5...@kubb/core-v1.0.0-beta.6) (2023-04-04)


### Miscellaneous Chores

* release 1.0.0-beta.6 ([b11e6fe](https://github.com/kubb-project/kubb/commit/b11e6fe2b65c4784c151bb2e08729cd166f09151))
* release 1.0.0-beta.6 ([6f27206](https://github.com/kubb-project/kubb/commit/6f2720619c386771b9a8ea232c23948ff3781203))

## [1.0.0-beta.5](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.0.0-beta.4...@kubb/core-v1.0.0-beta.5) (2023-04-03)


### Features

* extraTexts for zodBuilder and enum for zod ([9f61235](https://github.com/kubb-project/kubb/commit/9f61235a71a3b0633387b3ea47a913943da3f623))
* format with js-beautify instead of Prettier(works also in the browser) ([ecc0952](https://github.com/kubb-project/kubb/commit/ecc0952c929aa71bac8a3bb0cf400289c7dee142))
* getUniqueName used for aliases + also for enums ([60580c4](https://github.com/kubb-project/kubb/commit/60580c4e79b4e1154855bafffeb63c2f4e9fc202))
* imports for fileManager ([1e021e7](https://github.com/kubb-project/kubb/commit/1e021e7210ad6b76d94ecf6c038bccc568188979))
* move typescript logic to swagger-typescript package ([d4b6d2b](https://github.com/kubb-project/kubb/commit/d4b6d2b8035de648bb583662d5c022a37dff8f74))
* oneof for zod and typescript + added description for zod ([ebef9d2](https://github.com/kubb-project/kubb/commit/ebef9d2597f38989c6d43a87053d5eba23948bca))
* react-query plugin output in one file(with correct imports) ([2bd3af4](https://github.com/kubb-project/kubb/commit/2bd3af4fdf188b5ac7c1335a97229479e471af85))
* ResolveIdOptions with generic for KubbPlugin type ([ea8a0cc](https://github.com/kubb-project/kubb/commit/ea8a0cc9c308c1059024a5aa558fbb62a95511a2))
* svelte-query ([be06ace](https://github.com/kubb-project/kubb/commit/be06ace70add445a9fda3caf168223fbd278a147))
* swr plugin ([fb091d9](https://github.com/kubb-project/kubb/commit/fb091d98b97cf91df8ccdeb84db6b963cc7e3712))
* ts-codegen package ([b25db7e](https://github.com/kubb-project/kubb/commit/b25db7e9b874dd953f25b1814c4c7db3fbc9ff0b))
* use of @humanwhocodes/module-importer(like eslint) to get plugins when they are used in a JSON format ([b4715ef](https://github.com/kubb-project/kubb/commit/b4715efb6d835f72b5f135245c1dde13d228fb77))
* use of pathParams to create function arguments for ReactQuery GET hooks ([e6994fc](https://github.com/kubb-project/kubb/commit/e6994fc9576122d1aaf2edabab65d871f43a6e8a))
* use of prettier format ([3e3451b](https://github.com/kubb-project/kubb/commit/3e3451b057e227df160af6410dad37ffddb0d41c))
* use of resolveName of pluginContext ([3903e73](https://github.com/kubb-project/kubb/commit/3903e73c547c1137b48d3d4630fb34dbf1434857))
* use of swagger-ts name instead of swagger-typescript ([e9c27a4](https://github.com/kubb-project/kubb/commit/e9c27a4d1485b4d38e58fb0d67380796f1eb1aad))
* vue-query ([712f2f2](https://github.com/kubb-project/kubb/commit/712f2f2af4b03091df2e1cea46afade8868e842b))


### Bug Fixes

* add banner for index.global.js ([91548c3](https://github.com/kubb-project/kubb/commit/91548c3f72c6e7074df8bfec02a66b2bd03a4c7a))
* add declarationMap for easy access in editor ([40ff030](https://github.com/kubb-project/kubb/commit/40ff0305fb975bd02561682c5d7a9266259e185f))
* add input file to fileManager(when no plugins are defined) + read with correct encoding + export name for corePlugin ([70edbcb](https://github.com/kubb-project/kubb/commit/70edbcb26891c570b560bf44e40bfb63d01daaa6))
* add options to every plugin + removal of EmittedFile type ([a31b427](https://github.com/kubb-project/kubb/commit/a31b4275ca0904deb97fbc1b4c4827f6fbfd020d))
* add process for browser ([1497bc5](https://github.com/kubb-project/kubb/commit/1497bc5ee4c3f6acf554dc81b0bcaeed889a7121))
* also save esm and cjs for browser ([991b239](https://github.com/kubb-project/kubb/commit/991b239885b841a242887c97835086a8ec131397))
* always throw error ([e0528b4](https://github.com/kubb-project/kubb/commit/e0528b4859497c6feb03c61126b4bbdfa578d060))
* another try with browser ([43e6de0](https://github.com/kubb-project/kubb/commit/43e6de0fc692bee7fd6c23506cc5efd437ad01b9))
* better use of fileManager and single file(mode file) ([af010b9](https://github.com/kubb-project/kubb/commit/af010b9ae07b48cedc9d7328d121fb562aba1af0))
* better way of replacing(hard delete) ([71ff388](https://github.com/kubb-project/kubb/commit/71ff3887f3d3ebdb141339611a673242c38f1efa))
* bring back changelog ([30573e4](https://github.com/kubb-project/kubb/commit/30573e41027f01d79182b17f1f78152447d9401a))
* browser subpackage ([b8b3c19](https://github.com/kubb-project/kubb/commit/b8b3c191d10465b0ddeabf3ecdf77d564b597f35))
* build core for browser API's ([1d68e15](https://github.com/kubb-project/kubb/commit/1d68e15a6b350f6ccde339c128a1d42049782da6))
* build for browser ([8b09762](https://github.com/kubb-project/kubb/commit/8b09762e3da68d767fc05141294c5a5a16673ba6))
* build with core ([3609c81](https://github.com/kubb-project/kubb/commit/3609c811447d49751bf38048f5b4f1a1ea272132))
* cleanup devdeps ([92c5a00](https://github.com/kubb-project/kubb/commit/92c5a0003739047326baade146938f5ca013654d))
* cleanup imports and move duplicate stuff to swagger package ([73e7c66](https://github.com/kubb-project/kubb/commit/73e7c660dc3856afad64cf53f294f5003fa63f27))
* correct browser tag ([3d8477a](https://github.com/kubb-project/kubb/commit/3d8477a4ec148ecbfc9ca796f173d4d3c06790cb))
* correct rimraf [@types](https://github.com/types) version ([f56b88f](https://github.com/kubb-project/kubb/commit/f56b88f75487720360780a8f5b0d60a8de200ccf))
* correct use of catcher ([6865076](https://github.com/kubb-project/kubb/commit/6865076b5901e1851f529f9fb480f30cc2dd3e77))
* fileManager.getSource public + cleanup ([9fc7df7](https://github.com/kubb-project/kubb/commit/9fc7df76d7a7b4a9af0c1b34a629370ea7d21f9b))
* getFileSource and combineFiles to utils file ([4e8aa6a](https://github.com/kubb-project/kubb/commit/4e8aa6ab6b30bb10358903f1b95d66ff3e3c526f))
* global as globalThis to support node and browser ([fba5f9c](https://github.com/kubb-project/kubb/commit/fba5f9c7d2e9903a787370f9c617a625f5a786b9))
* globalName kubb ([040eb6e](https://github.com/kubb-project/kubb/commit/040eb6eabcdd747ac8d572152c4394a8bdca2a69))
* graceful-fs alias for browser ([993114b](https://github.com/kubb-project/kubb/commit/993114b46419c2d7142d2f9196b4ec5810cb1a56))
* if URL then do not write to fileSystem + write option for output ([8945dbe](https://github.com/kubb-project/kubb/commit/8945dbe51de9a7354135f2404b2d086acd8ba744))
* input.path is now required and can also be an URL ([5559c47](https://github.com/kubb-project/kubb/commit/5559c4702fc0142853ff316233921c19702469f9))
* move getParams out of operationGenerator ([12701df](https://github.com/kubb-project/kubb/commit/12701dfaf2cd724f1a86db0544ffd2d19f30386b))
* process define ([f145111](https://github.com/kubb-project/kubb/commit/f1451110ec9c67ecfd9841e6d08a05b586151e66))
* refactor of operationgenerator + baseOperationGenerator for swagger package ([2f4739b](https://github.com/kubb-project/kubb/commit/2f4739b25e3a456f44647ee46272cd341975152b))
* refactor zodBuilder and typeBuilder ([6e0ada6](https://github.com/kubb-project/kubb/commit/6e0ada6af9fa71658c0812cc72db507aa15cea66))
* remove browser exports ([35e21ea](https://github.com/kubb-project/kubb/commit/35e21ea5575d65414111820fa4a44c17fd68740d))
* result of build(core) will be array of files ([057861c](https://github.com/kubb-project/kubb/commit/057861ccda4048c2fee546bda38939ce65d47fa1))
* reverse files before returning all files(build core) ([eac087d](https://github.com/kubb-project/kubb/commit/eac087d1d09dce9b682064d5c731f6270f2727cd))
* rimraf upgrade ([6a8ffd1](https://github.com/kubb-project/kubb/commit/6a8ffd111c24f14ae006312a254b7936441a3d1c))
* setStatus to success and remove file out of FileManager even if the code is not set(infinite loop) ([09d3384](https://github.com/kubb-project/kubb/commit/09d338499af66f79fa209a8a5899fe43a4255e51))
* support for ESM modules ([cec3b57](https://github.com/kubb-project/kubb/commit/cec3b57ba9b97a030bb276a3957c826ace72b7d3))
* tsup node ([50bbf4f](https://github.com/kubb-project/kubb/commit/50bbf4fc401bfb148c8ba0c080fab40169df96eb))
* typescript strict mode for core, cli and ts-codegen ([c0dd917](https://github.com/kubb-project/kubb/commit/c0dd917cca5df924d706c271dfe9f0eae9f87897))
* umd module for all packages ([2b99a4b](https://github.com/kubb-project/kubb/commit/2b99a4b61cec48f65f3be97713455c54cfb12e1f))
* upgrade packages ([dcc2f7e](https://github.com/kubb-project/kubb/commit/dcc2f7e1f97ca494785abbb581025d46ae6ceacd))
* upgrade packages + cleanup ([66ca9cf](https://github.com/kubb-project/kubb/commit/66ca9cf7835f0da347f263e9ac1c14eecfa7d036))
* upgrade typescript ([5f01312](https://github.com/kubb-project/kubb/commit/5f01312d290f666299eeffb6b685e5a4980e1e47))
* use core without fs-extra, see safeWriteFileToPath + removal of prettier format ([822d733](https://github.com/kubb-project/kubb/commit/822d73312c84f989f6f55523f4bec23b6c8fdb78))
* use of queue instead of the eventsEmitters + remove addFile out of all lifeCycle methods except *buildStart* ([62973b7](https://github.com/kubb-project/kubb/commit/62973b75a95f861d6f1b431e1efc9af21c76ba81))
* use of stream-browserify and platform browser ([37e453a](https://github.com/kubb-project/kubb/commit/37e453a38cbe57e00f9318d19fb24ce3673adaaf))
* windows support for imports ([b938be9](https://github.com/kubb-project/kubb/commit/b938be9f12c080b38a0814bda1861687ebc3f232))


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

## [1.0.0-beta.4](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.0.0-beta.3...@kubb/core-v1.0.0-beta.4) (2023-03-31)


### Bug Fixes

* getFileSource and combineFiles to utils file ([4e8aa6a](https://github.com/kubb-project/kubb/commit/4e8aa6ab6b30bb10358903f1b95d66ff3e3c526f))


### Miscellaneous Chores

* release 1.0.0-beta.4 ([4127252](https://github.com/kubb-project/kubb/commit/4127252b59422a5692e17e3673a26ae346d9cdba))

## [1.0.0-beta.3](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.0.0-beta.2...@kubb/core-v1.0.0-beta.3) (2023-03-27)


### Features

* swr plugin ([fb091d9](https://github.com/kubb-project/kubb/commit/fb091d98b97cf91df8ccdeb84db6b963cc7e3712))


### Miscellaneous Chores

* release 1.0.0-beta.3 ([c134fb6](https://github.com/kubb-project/kubb/commit/c134fb61d0634abfea0740467087ff1b2d7ba3fa))

## [1.0.0-beta.2](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.0.0-beta.1...@kubb/core-v1.0.0-beta.2) (2023-03-26)


### Features

* svelte-query ([be06ace](https://github.com/kubb-project/kubb/commit/be06ace70add445a9fda3caf168223fbd278a147))
* vue-query ([712f2f2](https://github.com/kubb-project/kubb/commit/712f2f2af4b03091df2e1cea46afade8868e842b))


### Miscellaneous Chores

* release 1.0.0-beta.2 ([390b3d0](https://github.com/kubb-project/kubb/commit/390b3d0eb3aa7edbf2dd8d7d2765312c76710397))
* release 1.0.0-beta.2 ([826bfef](https://github.com/kubb-project/kubb/commit/826bfef6b81c46ea92531ce36ac6617c52a7bba8))

## [1.0.0-beta.1](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.0.0-alpha.8...@kubb/core-v1.0.0-beta.1) (2023-03-26)


### Bug Fixes

* correct rimraf [@types](https://github.com/types) version ([f56b88f](https://github.com/kubb-project/kubb/commit/f56b88f75487720360780a8f5b0d60a8de200ccf))


### Miscellaneous Chores

* release 1.0.0-beta.1 ([151d4c3](https://github.com/kubb-project/kubb/commit/151d4c393d4d6d0b2b85267dd2ef00c6f20636aa))

## [1.0.0-alpha.8](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.0.0-alpha.7...@kubb/core-v1.0.0-alpha.8) (2023-03-19)


### Bug Fixes

* add declarationMap for easy access in editor ([40ff030](https://github.com/kubb-project/kubb/commit/40ff0305fb975bd02561682c5d7a9266259e185f))
* typescript strict mode for core, cli and ts-codegen ([c0dd917](https://github.com/kubb-project/kubb/commit/c0dd917cca5df924d706c271dfe9f0eae9f87897))


### Miscellaneous Chores

* release 1.0.0-alpha.8 ([c5a3d68](https://github.com/kubb-project/kubb/commit/c5a3d6879abdb09c5ed9776e2e715800a2bf51d9))

## [1.0.0-alpha.7](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.0.0-alpha.6...@kubb/core-v1.0.0-alpha.7) (2023-03-18)


### Features

* extraTexts for zodBuilder and enum for zod ([9f61235](https://github.com/kubb-project/kubb/commit/9f61235a71a3b0633387b3ea47a913943da3f623))
* format with js-beautify instead of Prettier(works also in the browser) ([ecc0952](https://github.com/kubb-project/kubb/commit/ecc0952c929aa71bac8a3bb0cf400289c7dee142))
* getUniqueName used for aliases + also for enums ([60580c4](https://github.com/kubb-project/kubb/commit/60580c4e79b4e1154855bafffeb63c2f4e9fc202))
* imports for fileManager ([1e021e7](https://github.com/kubb-project/kubb/commit/1e021e7210ad6b76d94ecf6c038bccc568188979))
* move typescript logic to swagger-typescript package ([d4b6d2b](https://github.com/kubb-project/kubb/commit/d4b6d2b8035de648bb583662d5c022a37dff8f74))
* oneof for zod and typescript + added description for zod ([ebef9d2](https://github.com/kubb-project/kubb/commit/ebef9d2597f38989c6d43a87053d5eba23948bca))
* react-query plugin output in one file(with correct imports) ([2bd3af4](https://github.com/kubb-project/kubb/commit/2bd3af4fdf188b5ac7c1335a97229479e471af85))
* resolvePathOptions with generic for KubbPlugin type ([ea8a0cc](https://github.com/kubb-project/kubb/commit/ea8a0cc9c308c1059024a5aa558fbb62a95511a2))
* ts-codegen package ([b25db7e](https://github.com/kubb-project/kubb/commit/b25db7e9b874dd953f25b1814c4c7db3fbc9ff0b))
* use of @humanwhocodes/module-importer(like eslint) to get plugins when they are used in a JSON format ([b4715ef](https://github.com/kubb-project/kubb/commit/b4715efb6d835f72b5f135245c1dde13d228fb77))
* use of pathParams to create function arguments for ReactQuery GET hooks ([e6994fc](https://github.com/kubb-project/kubb/commit/e6994fc9576122d1aaf2edabab65d871f43a6e8a))
* use of prettier format ([3e3451b](https://github.com/kubb-project/kubb/commit/3e3451b057e227df160af6410dad37ffddb0d41c))
* use of swagger-ts name instead of swagger-typescript ([e9c27a4](https://github.com/kubb-project/kubb/commit/e9c27a4d1485b4d38e58fb0d67380796f1eb1aad))


### Bug Fixes

* add banner for index.global.js ([91548c3](https://github.com/kubb-project/kubb/commit/91548c3f72c6e7074df8bfec02a66b2bd03a4c7a))
* add input file to fileManager(when no plugins are defined) + read with correct encoding + export name for corePlugin ([70edbcb](https://github.com/kubb-project/kubb/commit/70edbcb26891c570b560bf44e40bfb63d01daaa6))
* add options to every plugin + removal of EmittedFile type ([a31b427](https://github.com/kubb-project/kubb/commit/a31b4275ca0904deb97fbc1b4c4827f6fbfd020d))
* add process for browser ([1497bc5](https://github.com/kubb-project/kubb/commit/1497bc5ee4c3f6acf554dc81b0bcaeed889a7121))
* also save esm and cjs for browser ([991b239](https://github.com/kubb-project/kubb/commit/991b239885b841a242887c97835086a8ec131397))
* always throw error ([e0528b4](https://github.com/kubb-project/kubb/commit/e0528b4859497c6feb03c61126b4bbdfa578d060))
* another try with browser ([43e6de0](https://github.com/kubb-project/kubb/commit/43e6de0fc692bee7fd6c23506cc5efd437ad01b9))
* better use of fileManager and single file(mode file) ([af010b9](https://github.com/kubb-project/kubb/commit/af010b9ae07b48cedc9d7328d121fb562aba1af0))
* better way of replacing(hard delete) ([71ff388](https://github.com/kubb-project/kubb/commit/71ff3887f3d3ebdb141339611a673242c38f1efa))
* bring back changelog ([30573e4](https://github.com/kubb-project/kubb/commit/30573e41027f01d79182b17f1f78152447d9401a))
* browser subpackage ([b8b3c19](https://github.com/kubb-project/kubb/commit/b8b3c191d10465b0ddeabf3ecdf77d564b597f35))
* build core for browser API's ([1d68e15](https://github.com/kubb-project/kubb/commit/1d68e15a6b350f6ccde339c128a1d42049782da6))
* build for browser ([8b09762](https://github.com/kubb-project/kubb/commit/8b09762e3da68d767fc05141294c5a5a16673ba6))
* build with core ([3609c81](https://github.com/kubb-project/kubb/commit/3609c811447d49751bf38048f5b4f1a1ea272132))
* cleanup devdeps ([92c5a00](https://github.com/kubb-project/kubb/commit/92c5a0003739047326baade146938f5ca013654d))
* cleanup imports and move duplicate stuff to swagger package ([73e7c66](https://github.com/kubb-project/kubb/commit/73e7c660dc3856afad64cf53f294f5003fa63f27))
* correct browser tag ([3d8477a](https://github.com/kubb-project/kubb/commit/3d8477a4ec148ecbfc9ca796f173d4d3c06790cb))
* correct use of catcher ([6865076](https://github.com/kubb-project/kubb/commit/6865076b5901e1851f529f9fb480f30cc2dd3e77))
* fileManager.getSource public + cleanup ([9fc7df7](https://github.com/kubb-project/kubb/commit/9fc7df76d7a7b4a9af0c1b34a629370ea7d21f9b))
* global as globalThis to support node and browser ([fba5f9c](https://github.com/kubb-project/kubb/commit/fba5f9c7d2e9903a787370f9c617a625f5a786b9))
* globalName kubb ([040eb6e](https://github.com/kubb-project/kubb/commit/040eb6eabcdd747ac8d572152c4394a8bdca2a69))
* graceful-fs alias for browser ([993114b](https://github.com/kubb-project/kubb/commit/993114b46419c2d7142d2f9196b4ec5810cb1a56))
* if URL then do not write to fileSystem + write option for output ([8945dbe](https://github.com/kubb-project/kubb/commit/8945dbe51de9a7354135f2404b2d086acd8ba744))
* input.path is now required and can also be an URL ([5559c47](https://github.com/kubb-project/kubb/commit/5559c4702fc0142853ff316233921c19702469f9))
* process define ([f145111](https://github.com/kubb-project/kubb/commit/f1451110ec9c67ecfd9841e6d08a05b586151e66))
* refactor of operationgenerator + baseOperationGenerator for swagger package ([2f4739b](https://github.com/kubb-project/kubb/commit/2f4739b25e3a456f44647ee46272cd341975152b))
* refactor zodBuilder and typeBuilder ([6e0ada6](https://github.com/kubb-project/kubb/commit/6e0ada6af9fa71658c0812cc72db507aa15cea66))
* remove browser exports ([35e21ea](https://github.com/kubb-project/kubb/commit/35e21ea5575d65414111820fa4a44c17fd68740d))
* result of build(core) will be array of files ([057861c](https://github.com/kubb-project/kubb/commit/057861ccda4048c2fee546bda38939ce65d47fa1))
* reverse files before returning all files(build core) ([eac087d](https://github.com/kubb-project/kubb/commit/eac087d1d09dce9b682064d5c731f6270f2727cd))
* rimraf upgrade ([6a8ffd1](https://github.com/kubb-project/kubb/commit/6a8ffd111c24f14ae006312a254b7936441a3d1c))
* setStatus to success and remove file out of FileManager even if the code is not set(infinite loop) ([09d3384](https://github.com/kubb-project/kubb/commit/09d338499af66f79fa209a8a5899fe43a4255e51))
* support for ESM modules ([cec3b57](https://github.com/kubb-project/kubb/commit/cec3b57ba9b97a030bb276a3957c826ace72b7d3))
* tsup node ([50bbf4f](https://github.com/kubb-project/kubb/commit/50bbf4fc401bfb148c8ba0c080fab40169df96eb))
* umd module for all packages ([2b99a4b](https://github.com/kubb-project/kubb/commit/2b99a4b61cec48f65f3be97713455c54cfb12e1f))
* upgrade packages ([dcc2f7e](https://github.com/kubb-project/kubb/commit/dcc2f7e1f97ca494785abbb581025d46ae6ceacd))
* upgrade packages + cleanup ([66ca9cf](https://github.com/kubb-project/kubb/commit/66ca9cf7835f0da347f263e9ac1c14eecfa7d036))
* upgrade typescript ([5f01312](https://github.com/kubb-project/kubb/commit/5f01312d290f666299eeffb6b685e5a4980e1e47))
* use core without fs-extra, see safeWriteFileToPath + removal of prettier format ([822d733](https://github.com/kubb-project/kubb/commit/822d73312c84f989f6f55523f4bec23b6c8fdb78))
* use of queue instead of the eventsEmitters + remove addFile out of all lifeCycle methods except *buildStart* ([62973b7](https://github.com/kubb-project/kubb/commit/62973b75a95f861d6f1b431e1efc9af21c76ba81))
* use of stream-browserify and platform browser ([37e453a](https://github.com/kubb-project/kubb/commit/37e453a38cbe57e00f9318d19fb24ce3673adaaf))
* windows support for imports ([b938be9](https://github.com/kubb-project/kubb/commit/b938be9f12c080b38a0814bda1861687ebc3f232))


### Miscellaneous Chores

* release 1.0.0-alpha.1 ([608fd59](https://github.com/kubb-project/kubb/commit/608fd5926079f9dd77046d6788a5550fb964c0b2))
* release 1.0.0-alpha.2 ([3d645ac](https://github.com/kubb-project/kubb/commit/3d645accedb121856e61bab166fafe74db6ca3f3))
* release 1.0.0-alpha.3 ([4fb3d6a](https://github.com/kubb-project/kubb/commit/4fb3d6a6ff5b6b0950d94a12f04c4fd3db89c595))
* release 1.0.0-alpha.4 ([8d808c3](https://github.com/kubb-project/kubb/commit/8d808c3d0b255b76dc79ad92324f0f2ee8afd619))
* release 1.0.0-alpha.5 ([8bb9ed2](https://github.com/kubb-project/kubb/commit/8bb9ed2d0ce9ee47db2d24daba993b81cd56d2c0))
* release 1.0.0-alpha.6 ([550035a](https://github.com/kubb-project/kubb/commit/550035a122a2e5a5294a49a0d2c927fc238315e6))
* release 1.0.0-alpha.7 ([29bd33a](https://github.com/kubb-project/kubb/commit/29bd33aefb990c298d6615f10add0ca7fce69861))

## [1.0.0-alpha.6](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.0.0-alpha.5...@kubb/core-v1.0.0-alpha.6) (2023-03-11)


### Miscellaneous Chores

* release 1.0.0-alpha.6 ([550035a](https://github.com/kubb-project/kubb/commit/550035a122a2e5a5294a49a0d2c927fc238315e6))

## [1.0.0-alpha.5](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.0.0-alpha.4...@kubb/core-v1.0.0-alpha.5) (2023-03-11)


### Bug Fixes

* use of queue instead of the eventsEmitters + remove addFile out of all lifeCycle methods except *buildStart* ([62973b7](https://github.com/kubb-project/kubb/commit/62973b75a95f861d6f1b431e1efc9af21c76ba81))


### Miscellaneous Chores

* release 1.0.0-alpha.5 ([8bb9ed2](https://github.com/kubb-project/kubb/commit/8bb9ed2d0ce9ee47db2d24daba993b81cd56d2c0))

## [1.0.0-alpha.4](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.0.0-alpha.3...@kubb/core-v1.0.0-alpha.4) (2023-03-10)


### Bug Fixes

* setStatus to success and remove file out of FileManager even if the code is not set(infinite loop) ([09d3384](https://github.com/kubb-project/kubb/commit/09d338499af66f79fa209a8a5899fe43a4255e51))


### Miscellaneous Chores

* release 1.0.0-alpha.4 ([8d808c3](https://github.com/kubb-project/kubb/commit/8d808c3d0b255b76dc79ad92324f0f2ee8afd619))

## [1.0.0-alpha.3](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.0.0-alpha.2...@kubb/core-v1.0.0-alpha.3) (2023-03-10)


### Features

* getUniqueName used for aliases + also for enums ([60580c4](https://github.com/kubb-project/kubb/commit/60580c4e79b4e1154855bafffeb63c2f4e9fc202))


### Miscellaneous Chores

* release 1.0.0-alpha.3 ([4fb3d6a](https://github.com/kubb-project/kubb/commit/4fb3d6a6ff5b6b0950d94a12f04c4fd3db89c595))

## [1.0.0-alpha.2](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.0.0-alpha.1...@kubb/core-v1.0.0-alpha.2) (2023-03-09)


### Miscellaneous Chores

* release 1.0.0-alpha.2 ([3d645ac](https://github.com/kubb-project/kubb/commit/3d645accedb121856e61bab166fafe74db6ca3f3))

## [1.0.0-alpha.1](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.56.4...@kubb/core-v1.0.0-alpha.1) (2023-03-05)


### Miscellaneous Chores

* release 1.0.0-alpha.1 ([608fd59](https://github.com/kubb-project/kubb/commit/608fd5926079f9dd77046d6788a5550fb964c0b2))

## [0.56.4](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.56.3...@kubb/core-v0.56.4) (2023-03-02)


### Miscellaneous Chores

* **@kubb/core:** Synchronize undefined versions

## [0.56.3](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.56.2...@kubb/core-v0.56.3) (2023-03-02)


### Bug Fixes

* windows support for imports ([b938be9](https://github.com/kubb-project/kubb/commit/b938be9f12c080b38a0814bda1861687ebc3f232))

## [0.56.2](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.56.1...@kubb/core-v0.56.2) (2023-03-02)


### Miscellaneous Chores

* **@kubb/core:** Synchronize undefined versions

## [0.56.1](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.56.0...@kubb/core-v0.56.1) (2023-03-01)


### Bug Fixes

* support for ESM modules ([cec3b57](https://github.com/kubb-project/kubb/commit/cec3b57ba9b97a030bb276a3957c826ace72b7d3))

## [0.56.0](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.55.0...@kubb/core-v0.56.0) (2023-02-28)


### Miscellaneous Chores

* **@kubb/core:** Synchronize undefined versions

## [0.55.0](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.54.0...@kubb/core-v0.55.0) (2023-02-27)


### Miscellaneous Chores

* **@kubb/core:** Synchronize undefined versions

## [0.54.0](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.53.0...@kubb/core-v0.54.0) (2023-02-26)


### Miscellaneous Chores

* **@kubb/core:** Synchronize undefined versions

## [0.53.0](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.52.1...@kubb/core-v0.53.0) (2023-02-26)


### Features

* resolvePathOptions with generic for KubbPlugin type ([ea8a0cc](https://github.com/kubb-project/kubb/commit/ea8a0cc9c308c1059024a5aa558fbb62a95511a2))

## [0.52.1](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.52.0...@kubb/core-v0.52.1) (2023-02-26)


### Miscellaneous Chores

* **@kubb/core:** Synchronize undefined versions

## [0.52.0](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.51.0...@kubb/core-v0.52.0) (2023-02-26)


### Features

* oneof for zod and typescript + added description for zod ([ebef9d2](https://github.com/kubb-project/kubb/commit/ebef9d2597f38989c6d43a87053d5eba23948bca))

## [0.51.0](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.50.1...@kubb/core-v0.51.0) (2023-02-25)


### Features

* extraTexts for zodBuilder and enum for zod ([9f61235](https://github.com/kubb-project/kubb/commit/9f61235a71a3b0633387b3ea47a913943da3f623))
* use of prettier format ([3e3451b](https://github.com/kubb-project/kubb/commit/3e3451b057e227df160af6410dad37ffddb0d41c))

## [0.50.1](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.50.0...@kubb/core-v0.50.1) (2023-02-23)


### Miscellaneous Chores

* **@kubb/core:** Synchronize undefined versions

## [0.50.0](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.49.1...@kubb/core-v0.50.0) (2023-02-23)


### Features

* ts-codegen package ([b25db7e](https://github.com/kubb-project/kubb/commit/b25db7e9b874dd953f25b1814c4c7db3fbc9ff0b))
* use of swagger-ts name instead of swagger-typescript ([e9c27a4](https://github.com/kubb-project/kubb/commit/e9c27a4d1485b4d38e58fb0d67380796f1eb1aad))


### Bug Fixes

* cleanup imports and move duplicate stuff to swagger package ([73e7c66](https://github.com/kubb-project/kubb/commit/73e7c660dc3856afad64cf53f294f5003fa63f27))

## [0.49.1](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.49.0...@kubb/core-v0.49.1) (2023-02-23)


### Bug Fixes

* refactor zodBuilder and typeBuilder ([6e0ada6](https://github.com/kubb-project/kubb/commit/6e0ada6af9fa71658c0812cc72db507aa15cea66))

## [0.49.0](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.48.0...@kubb/core-v0.49.0) (2023-02-23)


### Miscellaneous Chores

* **@kubb/core:** Synchronize undefined versions

## [0.48.0](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.47.1...@kubb/core-v0.48.0) (2023-02-23)


### Miscellaneous Chores

* **@kubb/core:** Synchronize undefined versions

## [0.47.1](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.47.0...@kubb/core-v0.47.1) (2023-02-22)


### Bug Fixes

* refactor of operationgenerator + baseOperationGenerator for swagger package ([2f4739b](https://github.com/kubb-project/kubb/commit/2f4739b25e3a456f44647ee46272cd341975152b))

## [0.47.0](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.46.0...@kubb/core-v0.47.0) (2023-02-22)


### Features

* format with js-beautify instead of Prettier(works also in the browser) ([ecc0952](https://github.com/kubb-project/kubb/commit/ecc0952c929aa71bac8a3bb0cf400289c7dee142))

## [0.46.0](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.45.1...@kubb/core-v0.46.0) (2023-02-22)


### Miscellaneous Chores

* **@kubb/core:** Synchronize undefined versions

## [0.45.1](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.45.0...@kubb/core-v0.45.1) (2023-02-22)


### Miscellaneous Chores

* **@kubb/core:** Synchronize undefined versions

## [0.45.0](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.44.2...@kubb/core-v0.45.0) (2023-02-22)


### Features

* use of pathParams to create function arguments for ReactQuery GET hooks ([e6994fc](https://github.com/kubb-project/kubb/commit/e6994fc9576122d1aaf2edabab65d871f43a6e8a))

## [0.44.2](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.44.1...@kubb/core-v0.44.2) (2023-02-22)


### Bug Fixes

* if URL then do not write to fileSystem + write option for output ([8945dbe](https://github.com/kubb-project/kubb/commit/8945dbe51de9a7354135f2404b2d086acd8ba744))

## [0.44.1](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.44.0...@kubb/core-v0.44.1) (2023-02-22)


### Bug Fixes

* input.path is now required and can also be an URL ([5559c47](https://github.com/kubb-project/kubb/commit/5559c4702fc0142853ff316233921c19702469f9))

## [0.44.0](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.43.3...@kubb/core-v0.44.0) (2023-02-22)


### Miscellaneous Chores

* **@kubb/core:** Synchronize undefined versions

## [0.43.3](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.43.2...@kubb/core-v0.43.3) (2023-02-21)


### Bug Fixes

* better way of replacing(hard delete) ([71ff388](https://github.com/kubb-project/kubb/commit/71ff3887f3d3ebdb141339611a673242c38f1efa))

## [0.43.2](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.43.1...@kubb/core-v0.43.2) (2023-02-21)


### Bug Fixes

* reverse files before returning all files(build core) ([eac087d](https://github.com/kubb-project/kubb/commit/eac087d1d09dce9b682064d5c731f6270f2727cd))

## [0.43.1](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.43.0...@kubb/core-v0.43.1) (2023-02-21)


### Miscellaneous Chores

* **@kubb/core:** Synchronize undefined versions

## [0.43.0](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.42.1...@kubb/core-v0.43.0) (2023-02-21)


### Miscellaneous Chores

* **@kubb/core:** Synchronize undefined versions

## [0.42.1](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.42.0...@kubb/core-v0.42.1) (2023-02-20)


### Bug Fixes

* fileManager.getSource public + cleanup ([9fc7df7](https://github.com/kubb-project/kubb/commit/9fc7df76d7a7b4a9af0c1b34a629370ea7d21f9b))

## [0.42.0](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.41.1...@kubb/core-v0.42.0) (2023-02-20)


### Features

* move typescript logic to swagger-ts package ([d4b6d2b](https://github.com/kubb-project/kubb/commit/d4b6d2b8035de648bb583662d5c022a37dff8f74))


### Bug Fixes

* better use of fileManager and single file(mode file) ([af010b9](https://github.com/kubb-project/kubb/commit/af010b9ae07b48cedc9d7328d121fb562aba1af0))

## [0.41.1](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.41.0...@kubb/core-v0.41.1) (2023-02-16)


### Bug Fixes

* build with core ([3609c81](https://github.com/kubb-project/kubb/commit/3609c811447d49751bf38048f5b4f1a1ea272132))

## [0.41.0](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.40.0...@kubb/core-v0.41.0) (2023-02-16)


### Features

* react-query plugin output in one file(with correct imports) ([2bd3af4](https://github.com/kubb-project/kubb/commit/2bd3af4fdf188b5ac7c1335a97229479e471af85))


### Bug Fixes

* add options to every plugin + removal of EmittedFile type ([a31b427](https://github.com/kubb-project/kubb/commit/a31b4275ca0904deb97fbc1b4c4827f6fbfd020d))

## [0.40.0](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.39.1...@kubb/core-v0.40.0) (2023-02-16)


### Features

* use of @humanwhocodes/module-importer(like eslint) to get plugins when they are used in a JSON format ([b4715ef](https://github.com/kubb-project/kubb/commit/b4715efb6d835f72b5f135245c1dde13d228fb77))

## [0.39.1](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.39.0...@kubb/core-v0.39.1) (2023-02-16)


### Bug Fixes

* upgrade packages + cleanup ([66ca9cf](https://github.com/kubb-project/kubb/commit/66ca9cf7835f0da347f263e9ac1c14eecfa7d036))

## [0.39.0](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.38.0...@kubb/core-v0.39.0) (2023-02-11)


### Features

* imports for fileManager ([1e021e7](https://github.com/kubb-project/kubb/commit/1e021e7210ad6b76d94ecf6c038bccc568188979))

## [0.38.0](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.37.30...@kubb/core-v0.38.0) (2023-02-11)


### Miscellaneous Chores

* **@kubb/core:** Synchronize undefined versions

## [0.37.30](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.37.29...@kubb/core-v0.37.30) (2023-02-04)


### Miscellaneous Chores

* **@kubb/core:** Synchronize undefined versions

## [0.37.29](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.37.28...@kubb/core-v0.37.29) (2023-02-04)


### Miscellaneous Chores

* **@kubb/core:** Synchronize undefined versions

## [0.37.28](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.37.27...@kubb/core-v0.37.28) (2023-02-03)


### Bug Fixes

* upgrade packages ([dcc2f7e](https://github.com/kubb-project/kubb/commit/dcc2f7e1f97ca494785abbb581025d46ae6ceacd))

## [0.37.27](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.37.26...@kubb/core-v0.37.27) (2023-01-13)


### Bug Fixes

* rimraf upgrade ([6a8ffd1](https://github.com/kubb-project/kubb/commit/6a8ffd111c24f14ae006312a254b7936441a3d1c))
* tsup node ([50bbf4f](https://github.com/kubb-project/kubb/commit/50bbf4fc401bfb148c8ba0c080fab40169df96eb))

## [0.37.26](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.37.25...@kubb/core-v0.37.26) (2023-01-10)


### Bug Fixes

* correct use of catcher ([6865076](https://github.com/kubb-project/kubb/commit/6865076b5901e1851f529f9fb480f30cc2dd3e77))

## [0.37.25](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.37.24...@kubb/core-v0.37.25) (2023-01-10)


### Bug Fixes

* always throw error ([e0528b4](https://github.com/kubb-project/kubb/commit/e0528b4859497c6feb03c61126b4bbdfa578d060))

## [0.37.24](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.37.23...@kubb/core-v0.37.24) (2023-01-09)


### Miscellaneous Chores

* **@kubb/core:** Synchronize undefined versions

## [0.37.23](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.37.22...@kubb/core-v0.37.23) (2023-01-09)


### Miscellaneous Chores

* **@kubb/core:** Synchronize undefined versions

## [0.37.22](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.37.21...@kubb/core-v0.37.22) (2023-01-09)


### Miscellaneous Chores

* **@kubb/core:** Synchronize undefined versions

## [0.37.21](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.37.20...@kubb/core-v0.37.21) (2023-01-09)


### Miscellaneous Chores

* **@kubb/core:** Synchronize undefined versions

## [0.37.20](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.37.19...@kubb/core-v0.37.20) (2023-01-09)


### Bug Fixes

* cleanup devdeps ([92c5a00](https://github.com/kubb-project/kubb/commit/92c5a0003739047326baade146938f5ca013654d))
* umd module for all packages ([2b99a4b](https://github.com/kubb-project/kubb/commit/2b99a4b61cec48f65f3be97713455c54cfb12e1f))

## [0.37.19](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.37.18...@kubb/core-v0.37.19) (2023-01-09)


### Bug Fixes

* result of build(core) will be array of files ([057861c](https://github.com/kubb-project/kubb/commit/057861ccda4048c2fee546bda38939ce65d47fa1))

## [0.37.18](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.37.17...@kubb/core-v0.37.18) (2023-01-08)


### Bug Fixes

* add input file to fileManager(when no plugins are defined) + read with correct encoding + export name for corePlugin ([70edbcb](https://github.com/kubb-project/kubb/commit/70edbcb26891c570b560bf44e40bfb63d01daaa6))

## [0.37.17](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.37.16...@kubb/core-v0.37.17) (2023-01-08)


### Bug Fixes

* globalName kubb ([040eb6e](https://github.com/kubb-project/kubb/commit/040eb6eabcdd747ac8d572152c4394a8bdca2a69))

## [0.37.16](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.37.15...@kubb/core-v0.37.16) (2023-01-08)


### Bug Fixes

* global as globalThis to support node and browser ([fba5f9c](https://github.com/kubb-project/kubb/commit/fba5f9c7d2e9903a787370f9c617a625f5a786b9))

## [0.37.15](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.37.14...@kubb/core-v0.37.15) (2023-01-08)


### Bug Fixes

* process define ([f145111](https://github.com/kubb-project/kubb/commit/f1451110ec9c67ecfd9841e6d08a05b586151e66))

## [0.37.14](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.37.13...@kubb/core-v0.37.14) (2023-01-08)


### Bug Fixes

* add process for browser ([1497bc5](https://github.com/kubb-project/kubb/commit/1497bc5ee4c3f6acf554dc81b0bcaeed889a7121))

## [0.37.13](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.37.12...@kubb/core-v0.37.13) (2023-01-08)


### Bug Fixes

* use of stream-browserify and platform browser ([37e453a](https://github.com/kubb-project/kubb/commit/37e453a38cbe57e00f9318d19fb24ce3673adaaf))

## [0.37.12](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.37.11...@kubb/core-v0.37.12) (2023-01-08)


### Bug Fixes

* add banner for index.global.js ([91548c3](https://github.com/kubb-project/kubb/commit/91548c3f72c6e7074df8bfec02a66b2bd03a4c7a))

## [0.37.11](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.37.10...@kubb/core-v0.37.11) (2023-01-08)


### Bug Fixes

* use core without fs-extra, see safeWriteFileToPath + removal of prettier format ([822d733](https://github.com/kubb-project/kubb/commit/822d73312c84f989f6f55523f4bec23b6c8fdb78))

## [0.37.10](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.37.9...@kubb/core-v0.37.10) (2023-01-08)


### Bug Fixes

* another try with browser ([43e6de0](https://github.com/kubb-project/kubb/commit/43e6de0fc692bee7fd6c23506cc5efd437ad01b9))

## [0.37.9](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.37.8...@kubb/core-v0.37.9) (2023-01-08)


### Bug Fixes

* remove browser exports ([35e21ea](https://github.com/kubb-project/kubb/commit/35e21ea5575d65414111820fa4a44c17fd68740d))

## [0.37.8](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.37.7...@kubb/core-v0.37.8) (2023-01-08)


### Bug Fixes

* graceful-fs alias for browser ([993114b](https://github.com/kubb-project/kubb/commit/993114b46419c2d7142d2f9196b4ec5810cb1a56))

## [0.37.7](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.37.6...@kubb/core-v0.37.7) (2023-01-08)


### Bug Fixes

* browser subpackage ([b8b3c19](https://github.com/kubb-project/kubb/commit/b8b3c191d10465b0ddeabf3ecdf77d564b597f35))

## [0.37.6](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.37.5...@kubb/core-v0.37.6) (2023-01-08)


### Bug Fixes

* correct browser tag ([3d8477a](https://github.com/kubb-project/kubb/commit/3d8477a4ec148ecbfc9ca796f173d4d3c06790cb))

## [0.37.5](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.37.4...@kubb/core-v0.37.5) (2023-01-08)


### Bug Fixes

* also save esm and cjs for browser ([991b239](https://github.com/kubb-project/kubb/commit/991b239885b841a242887c97835086a8ec131397))

## [0.37.4](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.37.3...@kubb/core-v0.37.4) (2023-01-08)


### Bug Fixes

* build for browser ([8b09762](https://github.com/kubb-project/kubb/commit/8b09762e3da68d767fc05141294c5a5a16673ba6))

## [0.37.3](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.37.2...@kubb/core-v0.37.3) (2023-01-08)


### Bug Fixes

* build core for browser API's ([1d68e15](https://github.com/kubb-project/kubb/commit/1d68e15a6b350f6ccde339c128a1d42049782da6))

## [0.37.2](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.37.1...@kubb/core-v0.37.2) (2023-01-08)


### Bug Fixes

* bring back changelog ([30573e4](https://github.com/kubb-project/kubb/commit/30573e41027f01d79182b17f1f78152447d9401a))

## [0.37.1](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.37.0...@kubb/core-v0.37.1) (2023-01-08)

### Miscellaneous Chores

* **@kubb/core:** Synchronize undefined versions

## [0.37.0](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.36.1...@kubb/core-v0.37.0) (2023-01-08)

### Miscellaneous Chores

* **@kubb/core:** Synchronize undefined versions


## [0.36.1](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.36.0...@kubb/core-v0.36.1) (2023-01-08)


### Bug Fixes

* createRequire for imports that are still using require, node14 with ESM mode does not support require out of the box(we had a crash on Nextjs) ([0fdec3f](https://github.com/kubb-project/kubb/commit/0fdec3f3f4fdd8fbec11559b55c716bdb70100bc))

## [0.36.0](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.35.0...@kubb/core-v0.36.0) (2023-01-08)


### Features

* playground with Nextjs ([131d6a7](https://github.com/kubb-project/kubb/commit/131d6a785f8a9f80a8262a6a5c37c0a104f36a3d))
* use nextJs to convert JSON to types with swagger-ts ([3483562](https://github.com/kubb-project/kubb/commit/34835621c2ea916f0366949e41ec7e242ec0bf34))


### Bug Fixes

* read with error when parsing oas instance ([3be6b3c](https://github.com/kubb-project/kubb/commit/3be6b3c379aa8423d90ac555a4e44d54762e4776))

## [0.35.0](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.34.0...@kubb/core-v0.35.0) (2023-01-07)


### Features

* watch CLI option(use of chokidar) ([48b7511](https://github.com/kubb-project/kubb/commit/48b7511eb188c9683100e19b8d2fe5e63df8b80c))

## [0.34.0](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.33.0...@kubb/core-v0.34.0) (2023-01-07)


### Features

* use of operationGenerator for swagger-tanstack-query + sort for the typebuilder ([fb4622c](https://github.com/kubb-project/kubb/commit/fb4622c0837f3990172354dfc2cbf5fabefd033d))

## [0.33.0](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.32.0...@kubb/core-v0.33.0) (2023-01-07)


### Features

* SchemaGenerator as base for other plugins that wants to generate schema's(typescript, zod,...) ([9a2f810](https://github.com/kubb-project/kubb/commit/9a2f8105c1c33016184b817d95205ec8a7cd0cd7))

## [0.32.0](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.31.4...@kubb/core-v0.32.0) (2023-01-06)


### Features

* use of TypeBuilder instead of generate ([bf68d9f](https://github.com/kubb-project/kubb/commit/bf68d9f6cc2333bea074faaf39b18a4587f6ce89))

## [0.31.4](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.31.3...@kubb/core-v0.31.4) (2023-01-06)


### Miscellaneous Chores

* **@kubb/core:** Synchronize undefined versions

## [0.31.3](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.31.2...@kubb/core-v0.31.3) (2023-01-05)


### Miscellaneous Chores

* **@kubb/core:** Synchronize undefined versions

## [0.31.2](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.31.1...@kubb/core-v0.31.2) (2023-01-05)


### Bug Fixes

* refactor validation plugins ([2e0c9b9](https://github.com/kubb-project/kubb/commit/2e0c9b9a68f7cbf6d629a02166b8afe9de552606))

## [0.31.1](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.31.0...@kubb/core-v0.31.1) (2023-01-05)


### Miscellaneous Chores

* **@kubb/core:** Synchronize undefined versions

## [0.31.0](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.30.1...@kubb/core-v0.31.0) (2023-01-04)


### Miscellaneous Chores

* **@kubb/core:** Synchronize undefined versions

## [0.30.1](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.30.0...@kubb/core-v0.30.1) (2023-01-04)


### Bug Fixes

* move writeIndexes to swagger-ts ([3d171a7](https://github.com/kubb-project/kubb/commit/3d171a7a3c8e536398b9e99918607da9b18af8cc))

## [0.30.0](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.29.0...@kubb/core-v0.30.0) (2023-01-04)


### Features

* better error message per plugin ([1a0d6ad](https://github.com/kubb-project/kubb/commit/1a0d6adeade3c13e238ee79747e1bdb3b2d1d356))

## [0.29.0](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.28.1...@kubb/core-v0.29.0) (2023-01-04)


### Features

* mode directory so we can save models inside a models.ts file + addOrAppend for the fileManager ([e85477b](https://github.com/kubb-project/kubb/commit/e85477ba4dff2b32df6a9c1103a69c18e2059b72))

## [0.28.1](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.28.0...@kubb/core-v0.28.1) (2023-01-04)


### Bug Fixes

* replace importee by fileName and importer by directory ([b1a7d0f](https://github.com/kubb-project/kubb/commit/b1a7d0fbfb512a7d0eb45e255f5f878a8645fd4d))

## [0.28.0](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.27.1...@kubb/core-v0.28.0) (2023-01-04)


### Features

* use of directory-tree to create TreeNode structure to create index files(onBuildEnd) ([ed5abc5](https://github.com/kubb-project/kubb/commit/ed5abc5aa3e31e32bfe193beb0a955486c0259d6))
* use of treeNode with parent and children getters ([b4283de](https://github.com/kubb-project/kubb/commit/b4283de91f3c0f9c28ad5fbcf801dbd387c09ed0))


### Bug Fixes

* create subIndex files when no files are inside a specific folder(in the future we need to support multiple folders, one folder for now) ([523cf6a](https://github.com/kubb-project/kubb/commit/523cf6a0d3a3c541c9c637dfb26b055112209a5a))

## [0.27.1](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.27.0...@kubb/core-v0.27.1) (2023-01-03)


### Bug Fixes

* indexSource with file.path instead file.fileName ([bda1278](https://github.com/kubb-project/kubb/commit/bda12789f1dd55d4a94db888b874603f9f7dec39))
* rename emitFile by addFile ([fb947f1](https://github.com/kubb-project/kubb/commit/fb947f1395c9adc0752d4bfbf8ffd5657546db2e))
* use of nodejs modules for lodash instead of import of full package ([d962c39](https://github.com/kubb-project/kubb/commit/d962c396cabe42ff08dfdbcaa2c5f75b99fea288))

## [0.27.0](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.26.0...@kubb/core-v0.27.0) (2023-01-03)


### Features

* fileManager root option + create graph ([205ee53](https://github.com/kubb-project/kubb/commit/205ee537ea60b89e1ef2d0b25eb4037f2d01a4a2))

## [0.26.0](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.25.1...@kubb/core-v0.26.0) (2023-01-02)


### Miscellaneous Chores

* **@kubb/core:** Synchronize undefined versions

## [0.25.1](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.25.0...@kubb/core-v0.25.1) (2023-01-02)


### Miscellaneous Chores

* **@kubb/core:** Synchronize undefined versions

## [0.25.0](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.24.0...@kubb/core-v0.25.0) (2023-01-02)


### Features

* **swagger-ts:** jsdocs codegen for typescript types with appendJSDocToNode and createJSDoc ([827850c](https://github.com/kubb-project/kubb/commit/827850c4d0de657acc1eaf5d81d835d575452b68))


### Bug Fixes

* correct docsRepositoryBase ([3f9a471](https://github.com/kubb-project/kubb/commit/3f9a47171ace52e41c5638f0adf8d7f53dc4283d))

## [0.24.0](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.23.2...@kubb/core-v0.24.0) (2023-01-01)


### Miscellaneous Chores

* **@kubb/core:** Synchronize undefined versions

## [0.23.2](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.23.1...@kubb/core-v0.23.2) (2023-01-01)


### Miscellaneous Chores

* **@kubb/core:** Synchronize undefined versions

## [0.23.1](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.23.0...@kubb/core-v0.23.1) (2023-01-01)


### Miscellaneous Chores

* **@kubb/core:** Synchronize undefined versions

## [0.23.0](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.22.0...@kubb/core-v0.23.0) (2023-01-01)


### Features

* emitFile can use EmittedFile or File + rewrite swagger plugin to use emitFile resolvePath of selected plugin ([c43bc26](https://github.com/kubb-project/kubb/commit/c43bc2621eddaacd27eed39f6d70586434326747))
* fileManager as part of the buildContext ([015772d](https://github.com/kubb-project/kubb/commit/015772d844a4b2c6a224f8c0b9571157b5de5737))


### Bug Fixes

* mark EmittedFile as deprecated ([5115aae](https://github.com/kubb-project/kubb/commit/5115aae5b5b7c4f71a222114abf6a4c318ed63b1))
* resolvePathByPluginName fallback on core plugin ([6ab22b7](https://github.com/kubb-project/kubb/commit/6ab22b713e2bdd2b2e6448afbab85ec0db962801))

## [0.22.0](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.21.1...@kubb/core-v0.22.0) (2023-01-01)


### Features

* use of PluginManager ([96422e3](https://github.com/kubb-project/kubb/commit/96422e3b4422b5171045a5d132e916fa1a02b1c1))

## [0.21.1](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.21.0...@kubb/core-v0.21.1) (2023-01-01)


### Bug Fixes

* use of this.resolvePath with objectParams with possibility to call resolvePathForPlugin when passing pluginName ([c31ac69](https://github.com/kubb-project/kubb/commit/c31ac6928906dcb758171966dc3a9e580546f345))

## [0.21.0](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.20.0...@kubb/core-v0.21.0) (2023-01-01)


### Features

* FileManager with event emits(node) ([b419f35](https://github.com/kubb-project/kubb/commit/b419f357ce7f62fecca8fe5ab413e111e3b8df20))
* resolvePath for a specific plugin only(resolvePathForPlugin) ([5ebb878](https://github.com/kubb-project/kubb/commit/5ebb8784ab48349412fe9627d361d502bafcc2cc))


### Bug Fixes

* removal of FileEmitter anc custom Emitter ([bcc1069](https://github.com/kubb-project/kubb/commit/bcc106926f43119a3f1a68151385af591e4d81d5))

## [0.20.0](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.19.1...@kubb/core-v0.20.0) (2022-12-31)


### Miscellaneous Chores

* **@kubb/core:** Synchronize undefined versions

## [0.19.1](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.19.0...@kubb/core-v0.19.1) (2022-12-31)


### Miscellaneous Chores

* **@kubb/core:** Synchronize undefined versions

## [0.19.0](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.18.1...@kubb/core-v0.19.0) (2022-12-31)


### Miscellaneous Chores

* **@kubb/core:** Synchronize undefined versions

## [0.18.1](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.18.0...@kubb/core-v0.18.1) (2022-12-30)


### Miscellaneous Chores

* **@kubb/core:** Synchronize undefined versions

## [0.18.0](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.17.0...@kubb/core-v0.18.0) (2022-12-30)


### Miscellaneous Chores

* **@kubb/core:** Synchronize undefined versions

## [0.17.0](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.16.0...@kubb/core-v0.17.0) (2022-12-30)


### Features

* kubbConfig on buildStart ([650613f](https://github.com/kubb-project/kubb/commit/650613f2d8e4440023c4d534fe3bc95213b7817e))


### Bug Fixes

* refactor types and names ([f7ffc69](https://github.com/kubb-project/kubb/commit/f7ffc69c00ab1648ff36ed93ec27a9c7996c0f21))
* rename addToIndex by addToRoot ([074003a](https://github.com/kubb-project/kubb/commit/074003a43fa209750a9d122764daa34583b9da70))

## [0.16.0](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.15.0...@kubb/core-v0.16.0) (2022-12-29)


### Miscellaneous Chores

* **@kubb/core:** Synchronize undefined versions

## [0.15.0](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.14.2...@kubb/core-v0.15.0) (2022-12-29)


### Features

* done hook together with hooks option in @kubb/core ([1597824](https://github.com/kubb-project/kubb/commit/15978249096a0cfc85bc0b212c795ae76aa3999b))


### Bug Fixes

* use of clean inside output options ([739d6d8](https://github.com/kubb-project/kubb/commit/739d6d803d007cc23f11bc613ed26f999d4ed6c4))

## [0.14.2](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.14.1...@kubb/core-v0.14.2) (2022-12-29)


### Miscellaneous Chores

* **@kubb/core:** Synchronize undefined versions

## [0.14.1](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.14.0...@kubb/core-v0.14.1) (2022-12-28)


### Bug Fixes

* speed up cli for Ora ([1a690a0](https://github.com/kubb-project/kubb/commit/1a690a051c887e8d2cf97885374e0e30778cea65))

## [0.14.0](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.13.0...@kubb/core-v0.14.0) (2022-12-28)


### Features

* better use of resolvePath(importee and importer) ([f650c70](https://github.com/kubb-project/kubb/commit/f650c7064c89006053e22d898ca2762d6cc99103))
* clear functionality ([a4347c5](https://github.com/kubb-project/kubb/commit/a4347c58c62d77e7f8385902d6cf4c9cbf8f255f))
* simpler index generation for types and reactQuery + combine subfolders ([832827b](https://github.com/kubb-project/kubb/commit/832827b79b7a4f945cb21900d57f360a4673c03e))
* use of #ref for types ([4414054](https://github.com/kubb-project/kubb/commit/4414054efe2a5790a6b5a1e7ff04eddacf2aaf2b))


### Bug Fixes

* endless loop fileEmitter delete ([916918f](https://github.com/kubb-project/kubb/commit/916918fb007ac09833d61f8fd4e4773689a57e71))

## [0.13.0](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.12.0...@kubb/core-v0.13.0) (2022-12-26)


### Miscellaneous Chores

* **@kubb/core:** Synchronize undefined versions

## [0.12.0](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.11.2...@kubb/core-v0.12.0) (2022-12-26)


### Bug Fixes

* @kubb/core build without this ([c838a46](https://github.com/kubb-project/kubb/commit/c838a46c05c921a45fbad24204b8e307a123f5c3))
* generic use of cache inside of core plugin ([b9e1525](https://github.com/kubb-project/kubb/commit/b9e1525511e94872c0e05eaf2182c6a4b2f6b546))

## [0.11.2](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.11.1...@kubb/core-v0.11.2) (2022-12-26)


### Bug Fixes

* use of input.path instead of input.schema ([4d70ac8](https://github.com/kubb-project/kubb/commit/4d70ac8c1ab211ac05a391af4ccbd06f514437a7))

## [0.11.1](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.11.0...@kubb/core-v0.11.1) (2022-12-12)


### Bug Fixes

* definePlugin and export names of plugin and cleanup ([a17eb80](https://github.com/kubb-project/kubb/commit/a17eb80a90debb7f9cbf646dd9e9905489d42031))

## [0.11.0](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.10.0...@kubb/core-v0.11.0) (2022-12-12)


### Features

* ✨ swagger-tanstack-query ([d2e5866](https://github.com/kubb-project/kubb/commit/d2e58668dd85b24ae99944754e64a153155b03b4))

## [0.10.0](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.9.1...@kubb/core-v0.10.0) (2022-12-11)


### Features

* add simple example + cleanup packages ([1069dcf](https://github.com/kubb-project/kubb/commit/1069dcff473f151696dbf533ec07624ec4fd5d20))

## [0.9.1](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.9.0...@kubb/core-v0.9.1) (2022-11-29)


### Bug Fixes

* **update:** update packages ([b900b80](https://github.com/kubb-project/kubb/commit/b900b80ee56a33903ad3da3393425c239e3f65d1))

## [0.9.0](https://github.com/kubb-project/kubb/compare/@kubb/core-v0.8.0...@kubb/core-v0.9.0) (2022-11-24)


### Features

* add general QueueMeta type ([46fc7b9](https://github.com/kubb-project/kubb/commit/46fc7b9ee413e35e7de6cb1f70a9d0627a06848a))
* async emitFile ([88738ec](https://github.com/kubb-project/kubb/commit/88738ec0e6ff02fd099fd5d8ba8421f839e698d6))
* base type creation with new generator(using typescript compiler) ([3350167](https://github.com/kubb-project/kubb/commit/3350167d6e6ec1a6acf0254534397d3e69a1b75a))
* cli JSON config with plugins ([984baf2](https://github.com/kubb-project/kubb/commit/984baf254811833994093c65ca72420bc78e40f6))
* **core:** ✨ ast for typescript ([3ffc269](https://github.com/kubb-project/kubb/commit/3ffc269d7cc040b93650633c7bb2af21d3dc2f3d))
* **core:** ✨ use of fs-extra instead of fs(included subfolder creation) ([5b12c11](https://github.com/kubb-project/kubb/commit/5b12c112b2fe4e08a5aedd75f199cd4b0ff2e24d))
* define schemas for config and schema ([#1](https://github.com/kubb-project/kubb/issues/1)) ([2940bed](https://github.com/kubb-project/kubb/commit/2940bed15195db4cff8eeaad51aa1b9bfe423963))
* emitter with topics ([fdf9144](https://github.com/kubb-project/kubb/commit/fdf9144a3adb1f1c07574bc5d392237a062588f6))
* generator cli + definedConfig and plugin types ([ce88da9](https://github.com/kubb-project/kubb/commit/ce88da997b7d4fec2a0d0255a088c0bf968b5d17))
* meta for this.resolve and resolvePath based on the fileEmitterType ([4fcf9bc](https://github.com/kubb-project/kubb/commit/4fcf9bc4adb3e1437c35473f2ffc48670a7c001a))
* plugin system (based on Rolltup and Unplugin) ([09a9f3a](https://github.com/kubb-project/kubb/commit/09a9f3ad5dba14cc57e3627f3c7c4955da4c340f))
* queue ([4687478](https://github.com/kubb-project/kubb/commit/4687478b67ad3452cbb7b00ba0c51138892fb4ca))
* queue system ([7d56acd](https://github.com/kubb-project/kubb/commit/7d56acdfaca448d32df88613f8665f31c317ddd1))
* swagger-ts ([54fb329](https://github.com/kubb-project/kubb/commit/54fb32936f4d06beb03eedc576820452497db25b))
* **swagger-ts:** ✨ useQuery with react-query(tryout) ([84eb7e2](https://github.com/kubb-project/kubb/commit/84eb7e2a7b7158b8eb7a950ef99b9c356cc8fd8a))
* use of api object(same like Rollup does it) ([b78a189](https://github.com/kubb-project/kubb/commit/b78a189a9d92aa206873884fbee4a11691d56884))
* use of custom transform(hookReduceArg0) to reduce the result for transform ([4fb3889](https://github.com/kubb-project/kubb/commit/4fb388959326f4caa93dd70ff11ea3afd39d24c9))
* use of declare module for better type support ([2a868ad](https://github.com/kubb-project/kubb/commit/2a868add3eb63010e97492b3e7dd829d8e0a7ca7))
* use of on for the event Emitter ([fb13274](https://github.com/kubb-project/kubb/commit/fb13274889b5ddfad3919747f526c23d7ab14745))
* use of prettier for formatting ([4e26f76](https://github.com/kubb-project/kubb/commit/4e26f76c58d389b2d6ca0891d0fcdabb8ee1dabe))
* use of promise to return correct status for buildEnd + logs for the different parallel tasks ([562699d](https://github.com/kubb-project/kubb/commit/562699dec96c8b6b9670835dd10006439b90eb68))
* useQuery with response object type ([4f03bd6](https://github.com/kubb-project/kubb/commit/4f03bd69a1f683610bd1df247dbc420c43debd09))


### Bug Fixes

* add ts-node ([22adf77](https://github.com/kubb-project/kubb/commit/22adf77830f92b8daea2f232308b65a17daaadca))
* **core:** 🐛 casted type for context ([0f42f5c](https://github.com/kubb-project/kubb/commit/0f42f5cb52c06d197d3d9a706fdedb6bc26f0f74))
* correct output path(root + output.path) ([726aa60](https://github.com/kubb-project/kubb/commit/726aa608bd089e112e6dcd594405c83f65ba88dc))
* correct transform(delete out of queue when transform returns null) ([186f7f3](https://github.com/kubb-project/kubb/commit/186f7f32adb9c580959d18dc7e200a8e43688c2f))
* typing related to overloading with declare module ([4f99899](https://github.com/kubb-project/kubb/commit/4f99899cd9eb8e8b2ac8bf83ff15faf356701e5d))
* use same parameter order for write as other logic + only show logger when logLevel is defined ([b71eedf](https://github.com/kubb-project/kubb/commit/b71eedf43a8e94b528fd1e1975869e4a4474a3f8))
