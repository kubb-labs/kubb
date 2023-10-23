# Changelog

# [1.14.0](https://github.com/kubb-project/kubb/compare/kubb-v1.13.0...kubb-v1.14.0) (2023-10-20)


### ✨ Features

* `overrideBy` to specify different options per `operationId | tag | path | method` ([ebb3db1](https://github.com/kubb-project/kubb/commit/ebb3db14c3796ea5211a49ccded5544ee54ad66c))


### 📚 Documentation

* better docs with examples ([fb42958](https://github.com/kubb-project/kubb/commit/fb429588f213a0ec7973fd64aa24eea17529747a))
* escape curly braces ([0690e47](https://github.com/kubb-project/kubb/commit/0690e47421c32e251969f4809bf14ad83202bb44))
* swagger-msw docs update ([562c5b1](https://github.com/kubb-project/kubb/commit/562c5b10fda5ea8e8cb2605b0942f49150c5b577))
* update .all-contributorsrc [skip ci] ([df328ce](https://github.com/kubb-project/kubb/commit/df328ce890c8b434c9b43548e376703d3014e5be))
* update docs ([97bbf62](https://github.com/kubb-project/kubb/commit/97bbf62331103f1c5fd8c90372e42b8a3d78dc8b))
* update docs with examples ([9087387](https://github.com/kubb-project/kubb/commit/908738795b2c1a3612dbc556b957f41c62465dc2))
* update README.md [skip ci] ([6fd9e5a](https://github.com/kubb-project/kubb/commit/6fd9e5a9d93674d47901769c1e52ada6255c325e))

## [1.14.3](https://github.com/kubb-project/kubb/compare/kubb-v1.14.0...kubb-v1.14.3) (2023-10-23)


### 🐞 Bug Fixes

* add `as QueryKey` cast for `@tanstack/react-query` v5 ([67a3073](https://github.com/kubb-project/kubb/commit/67a30731713b2f1a047f0cd72f728db752322305))
* better types for plugin `api` ([a4303b7](https://github.com/kubb-project/kubb/commit/a4303b7b102d871f514649f2edb4fb9058d6564d))
* better types for PluginFactoryOptions and `KubbPlugin` ([3fb7bdd](https://github.com/kubb-project/kubb/commit/3fb7bdd7b612373c55597705037eab9fdc8202ee))
* replace 'importModule' by 'PackageManager' ([f66065a](https://github.com/kubb-project/kubb/commit/f66065af900041eae6c26f301abaeef25d69157b))
* use of `fileManager.addIndexes` and `URLPath` without static functions ([9bc291d](https://github.com/kubb-project/kubb/commit/9bc291d5b9126b1d3f26803e6a1c54a3b008f634))


### 📦 Miscellaneous Chores

* release 1.14.2 ([91e61ac](https://github.com/kubb-project/kubb/commit/91e61acde1c3824c40f291e1142363eaa95fb1cf))
* release 1.14.3 ([695f324](https://github.com/kubb-project/kubb/commit/695f3242d61ac13f4284f3bdf529a3bc0e353244))

## [1.13.0](https://github.com/kubb-project/kubb/compare/kubb-v1.12.0...kubb-v1.13.0) (2023-10-18)


### 📚 Documentation

* react-query v5 example ([7d9d428](https://github.com/kubb-project/kubb/commit/7d9d428ba2195fff47da5cf2dc0c98c651fc824c))


### ✨ Features

* `[@tanstack-query](https://github.com/tanstack-query)` v5 support ([c7d31dd](https://github.com/kubb-project/kubb/commit/c7d31dd11bb8c42d441101069d5d6b0e81db68c0))
* `input.data` for oasParser ([feb56f4](https://github.com/kubb-project/kubb/commit/feb56f49f4b12215d5c948c3508d058fb5eb42c1))
* `pathParamsType` to override behaviour when calling a generated get/post/put function ([12624c4](https://github.com/kubb-project/kubb/commit/12624c4e426b417e50e5f19665fd1b529b3d0b6a))
* PackageManager to retreive a version in the package.json of the user ([220cd63](https://github.com/kubb-project/kubb/commit/220cd631f95e24e622c6579849a53b3cedd95b50))

## [1.12.0](https://github.com/kubb-project/kubb/compare/kubb-v1.11.6...kubb-v1.12.0) (2023-10-18)


### ✨ Features

* **client,swr,tanstack-query:** add clientImportPath option ([f3b3b30](https://github.com/kubb-project/kubb/commit/f3b3b30501fe48a19071fe37b082d3646b81b5c8))
* type for `resolveName` ([53f9893](https://github.com/kubb-project/kubb/commit/53f98933e4b1ffe834622207768257d524f1f725))


### 🐞 Bug Fixes

* docs about wrong Badge usage, wrong import line example ([15c0cd3](https://github.com/kubb-project/kubb/commit/15c0cd34f54629292d30c57e162dad4467f8b9c8))

## [1.11.6](https://github.com/kubb-project/kubb/compare/kubb-v1.11.5...kubb-v1.11.6) (2023-10-16)


### ✨ Features

* **swagger-ts:** support nullable types ([5a4f7cf](https://github.com/kubb-project/kubb/commit/5a4f7cf2e9faa063dc2844c98cf738098ce62ebe))


### 🐞 Bug Fixes

* nonnullable for generated types ([0c676e4](https://github.com/kubb-project/kubb/commit/0c676e4ec3735e3f41e6e3bed45dc4bbbcc89a00))


### 📦 Miscellaneous Chores

* release 1.11.6 ([70826b2](https://github.com/kubb-project/kubb/commit/70826b2d52d970b16a7f00a8c63f95354699df7c))

## [1.11.5](https://github.com/kubb-project/kubb/compare/kubb-v1.11.4...kubb-v1.11.5) (2023-10-16)


### 🐞 Bug Fixes

* omit request/response based on readOnly/writeOnly ([d8341ef](https://github.com/kubb-project/kubb/commit/d8341efa712b8f7727563b99e7762684ff529685))
* readonly support for Zod and TypeScript ([a6e7557](https://github.com/kubb-project/kubb/commit/a6e75578b8038b5a7b29dc160bef8e481d2cc1ab))

## [1.11.4](https://github.com/kubb-project/kubb/compare/kubb-v1.11.3...kubb-v1.11.4) (2023-10-16)


### 🐞 Bug Fixes

* multiple body parameters in endpoint ([67e9be8](https://github.com/kubb-project/kubb/commit/67e9be81c58eb07490f1c6042a8c0bc9be81640b))

## [1.11.3](https://github.com/kubb-project/kubb/compare/kubb-v1.11.2...kubb-v1.11.3) (2023-10-14)


### 🐞 Bug Fixes

* correct parameters schema for `Zodios`(use of .shape and .schema.shape) ([b162622](https://github.com/kubb-project/kubb/commit/b162622ac30a2f2f74a8e98a20c8630a52073ca7))
* remove `auto-bind` ([1cda7ef](https://github.com/kubb-project/kubb/commit/1cda7ef9181eea2d20299cd778c8c362cb807673))

## [1.11.2](https://github.com/kubb-project/kubb/compare/kubb-v1.11.1...kubb-v1.11.2) (2023-10-13)


### 🐞 Bug Fixes

* remove of `types` exports field ([1c07fd7](https://github.com/kubb-project/kubb/commit/1c07fd72424db47e3a717d99ea5019bb7744f3c0))

## [1.11.1](https://github.com/kubb-project/kubb/compare/kubb-v1.11.0...kubb-v1.11.1) (2023-10-12)


### 🐞 Bug Fixes

* include `@kubb/react` for legacy `yarn install` ([237ade7](https://github.com/kubb-project/kubb/commit/237ade716b5b6ffc12ddcf4f50106ae7cdd7dc0a))

## [1.11.0](https://github.com/kubb-project/kubb/compare/kubb-v1.10.4...kubb-v1.11.0) (2023-10-11)


### ✨ Features

* use of `createRoot` and `client` subPackage ([d2e7b45](https://github.com/kubb-project/kubb/commit/d2e7b4596bbdba1e1dacbcd3df6b38a3d6fde467))
* use of `jsxImportSource` for a custom react-runtime being used by `@kubb/react-template` ([db8f351](https://github.com/kubb-project/kubb/commit/db8f3519ffa8dc2ede5309f0c4c8acb30bc6757e))


### 🐞 Bug Fixes

* remove `@swc/core` dependency(decrease of the bundle size) ([2dfc28f](https://github.com/kubb-project/kubb/commit/2dfc28f7959af550abd807fa38d1989e3603be7c))
* upgrade `oas` + custom patch for `typesVersions` ([e9e26ae](https://github.com/kubb-project/kubb/commit/e9e26ae204a2eb3b6dc1e3a391c17a5d9d64f86c))

## [1.10.4](https://github.com/kubb-project/kubb/compare/kubb-v1.10.3...kubb-v1.10.4) (2023-10-10)


### 📚 Documentation

* update .all-contributorsrc [skip ci] ([e58d89c](https://github.com/kubb-project/kubb/commit/e58d89c4ac94e441dcbf8e4c2a41da5ef2814276))
* update README.md [skip ci] ([b38bc52](https://github.com/kubb-project/kubb/commit/b38bc52279f0eed2259619f30a0486c0d1679e2a))


### ✨ Features

* **swr:** shouldFetch option for swr plugin ([adbfd73](https://github.com/kubb-project/kubb/commit/adbfd7366928101170e070348eaef64f7a145bc3))


### 📦 Miscellaneous Chores

* release 1.10.4 ([e2607b3](https://github.com/kubb-project/kubb/commit/e2607b3499ea9c810b508456b4e0ad5841a27347))

## [1.10.3](https://github.com/kubb-project/kubb/compare/kubb-v1.10.2...kubb-v1.10.3) (2023-10-10)


### 🐞 Bug Fixes

* include `react` and `react-reconciler` in the bundle ([4193520](https://github.com/kubb-project/kubb/commit/419352026db0f650825c877bd171b42e4e838e51))

## [1.10.2](https://github.com/kubb-project/kubb/compare/kubb-v1.10.1...kubb-v1.10.2) (2023-10-10)


### 🐞 Bug Fixes

* support for `configs/` folder for `kubb.config.ts` ([e448c32](https://github.com/kubb-project/kubb/commit/e448c3274a5df672bb9a8bfbfb9957dbdf954afd))

## 1.10.1 (2023-10-10)


### 📦 Miscellaneous Chores

* release 1.2.2 ([1213f57](https://github.com/kubb-project/kubb/commit/1213f57a4a56b5cac7709b24060d42f5dfc56d40))
* release 1.2.2 ([9489c97](https://github.com/kubb-project/kubb/commit/9489c97159a0f0e755b4257cd330e11d4d648b88))
* release 1.3.1 ([3821664](https://github.com/kubb-project/kubb/commit/3821664148c130e7e1905ac59ec359204b0c0370))
* release 1.3.1 ([fc869d9](https://github.com/kubb-project/kubb/commit/fc869d9c1429f3b513e3ba5a8854e1bf1d1f2122))
* release 1.3.3 ([6254b12](https://github.com/kubb-project/kubb/commit/6254b122a9b810c527e38024ea5d9b5a61f7a935))
* release 1.4.0 ([fc0de82](https://github.com/kubb-project/kubb/commit/fc0de826f94c2ff933dd2cefe26168ea6fcf8c3b))
* release 1.4.0 ([b1d4561](https://github.com/kubb-project/kubb/commit/b1d456179bc4415168142939b4be64b225a4870f))
* release 1.4.0 ([30e7e5f](https://github.com/kubb-project/kubb/commit/30e7e5f25e89eb39704043816ac90f13a509f5d8))
* release 1.4.1 ([9805506](https://github.com/kubb-project/kubb/commit/98055065a6931b96dc1038890eb56ebb0342818f))
* release 1.5.2 ([2f49c97](https://github.com/kubb-project/kubb/commit/2f49c97863b3dcee1a6158d97a5ca66848d52261))
* release 1.8.0 ([218b7f0](https://github.com/kubb-project/kubb/commit/218b7f0e8ec1cbc8b6db504ec6e06d8dbeb1109e))


### 📚 Documentation

* `bun` support ([8977443](https://github.com/kubb-project/kubb/commit/897744358fb588a870d49f248a50017ece2e3b50))
* add sitemap ([3e50453](https://github.com/kubb-project/kubb/commit/3e5045351e511cc2dc1211694c226c5098f2d5a9))
* add tip for `module` import ([5b7e24a](https://github.com/kubb-project/kubb/commit/5b7e24a7171e644d35e6f9a49fc2e6543868ba64))
* documentation for client and globals ([8f2b478](https://github.com/kubb-project/kubb/commit/8f2b478f91f307d7b322466bf623f9f8d192b876))
* fix typo zod website ([2d59ee3](https://github.com/kubb-project/kubb/commit/2d59ee35e0afcadd82ec74f4761199b1e75b83c2))
* react-hook-form + data-driven-forms example ([df538f9](https://github.com/kubb-project/kubb/commit/df538f95763976c2fe544c761b13288b62b182ef))
* readme update + typo's ([a1bb145](https://github.com/kubb-project/kubb/commit/a1bb14550c7d6d73832da612275ef66f65d32a02))
* swagger-form ([2aab49c](https://github.com/kubb-project/kubb/commit/2aab49cc24edbc90529421cb4edc300139046ee9))
* swagger-msw plugin ([b8f14c1](https://github.com/kubb-project/kubb/commit/b8f14c1690bc66160936c92144a2e2b0ce227d88))
* update @kubb/swagger-client import statement. ([17da197](https://github.com/kubb-project/kubb/commit/17da1976dc0dea6236083cc82a2f0922482f4177))
* update docs ([a246bb1](https://github.com/kubb-project/kubb/commit/a246bb1171a95ba9d639468c5f8214573bd33513))
* use of vitepress ([346a3b7](https://github.com/kubb-project/kubb/commit/346a3b7099e7019c04750bad8fe1fa9dc66c3c97))


### ✨ Features

* `client.ts` globals(declare const) can override the options set for `axios` ([b9dc851](https://github.com/kubb-project/kubb/commit/b9dc851896a5509cbf0e2f1910e4939631efa337))
* `client.ts` with the use of `process.env` override to set options for `axios` ([89c0d08](https://github.com/kubb-project/kubb/commit/89c0d08986255fd554f1d6df661b0a9a2a83847a))
* `ClientBuilder` ([0746839](https://github.com/kubb-project/kubb/commit/07468390532db3494429c62284f8f94b4fe6e6b0))
* `ClientFunction` with React for creating an axios get/post/put call ([7ef6819](https://github.com/kubb-project/kubb/commit/7ef68198c85888d76bf2949d9cc99993c1dd7fc7))
* `contentType` to override default `application/json` ([c5d50ce](https://github.com/kubb-project/kubb/commit/c5d50ce666806fe1f34684de1d542f3ac92e53fc))
* `dataReturnType` for @kubb/swagger-tanstack-query, @kubb/swagger-client and @kubb/swagger-swr ([9e5b124](https://github.com/kubb-project/kubb/commit/9e5b12451c592d17e41546e9d214cad80b6f24ca))
* `Import` and `Export` component for the`react-template` plugin ([2c3f193](https://github.com/kubb-project/kubb/commit/2c3f193183641c43ca8c0f5c579b2668f4f7c1f5))
* `optionalType` for `swagger-ts` ([ae204ea](https://github.com/kubb-project/kubb/commit/ae204ea5bd02a7817c281bcd14fbf729e4d48eb3))
* ✨ `mapper` and `extraImports` to override default mapper ([9b8c6e2](https://github.com/kubb-project/kubb/commit/9b8c6e21e891ec8f4d5d6a581ec8a18fbb616462))
* ✨ `swagger-form` FormGenerator and FormParser ([6424e5f](https://github.com/kubb-project/kubb/commit/6424e5f48960a24313e4ce2c115fd58af3cde814))
* ✨ `swagger-form` package for `react-hook-form` ([567e33c](https://github.com/kubb-project/kubb/commit/567e33c8cb11f50562f60039166a55264282bbb9))
* ✨ add `reset.d.ts` to the `@kubb/ts-config` that can be used to override default TypeScrip types ([ae47aa5](https://github.com/kubb-project/kubb/commit/ae47aa5bbffc0f24d878e917eda3047856ca3fc7))
* ✨ skipBy to exclude `tags`, `names`, `paths`, ... out of the generation ([44be77b](https://github.com/kubb-project/kubb/commit/44be77bb8748ae0188481716ef19dc6a39f1e538))
* ✨ useInfiniteQuery for `React`, `Solid`, `Svelte` and `Vue` ([d683cc7](https://github.com/kubb-project/kubb/commit/d683cc7909818757f62560bc1936b79bd0a79bfe))
* ArrowFunction ([3f1ba74](https://github.com/kubb-project/kubb/commit/3f1ba74c6579e6b4b3a1eb6290b2db84fe44ed1e))
* choose to use `Date` or `string` type for format `date` or `date-time` ([404227d](https://github.com/kubb-project/kubb/commit/404227de2c0baea4e0a14e9ff4c59efbc5c1db59))
* msw ([aed6b3e](https://github.com/kubb-project/kubb/commit/aed6b3e146f933408152d9e3e077d1cd233f5616))
* react-template with custom `react-dom` renderer ([df1d238](https://github.com/kubb-project/kubb/commit/df1d238efd7286a5256365ebcce67e08e4372c62))
* responseSchema with `$ref` property ([5b91d6d](https://github.com/kubb-project/kubb/commit/5b91d6d6f1a5143d072b65c58c3335803e9276b1))
* support for `bun` with read/write ([4c4283b](https://github.com/kubb-project/kubb/commit/4c4283bb92995d369c65ba8087f81771ffb36086))
* transformers ([20bc44d](https://github.com/kubb-project/kubb/commit/20bc44dda3771c1f632bace6a5c0c82cbdc5c632))
* use of `cac` instead of `commander` ([3814acb](https://github.com/kubb-project/kubb/commit/3814acb392f882ded2a75ef987ccdd79227a9238))
* use of a tranformer function to override the name of the hook/type/client ([f405183](https://github.com/kubb-project/kubb/commit/f405183b198e47e732873108956f639d94d94937))
* useInfiniteQuery for `React` ([effe453](https://github.com/kubb-project/kubb/commit/effe4535c51cf20b42a6f112bb757e1bbfbd8dcc))


### 🐞 Bug Fixes

* `and` for `zod` without `z.object` ([5d89c93](https://github.com/kubb-project/kubb/commit/5d89c9381e75ae8a268d0ce4aa26af7873c9e866))
* `EMFILE: too many open files` for Windows ([8c9dbce](https://github.com/kubb-project/kubb/commit/8c9dbce410430df669156b211ecae32fe17c88de))
* `fakerParser`, `formParser` and `zodParser` with custom mapper ([77151ba](https://github.com/kubb-project/kubb/commit/77151ba528759a032d8b86db98694c28a232be16))
* `path.resolve` with correct format for `Windows` ([ea7ff93](https://github.com/kubb-project/kubb/commit/ea7ff935f9be35c1899d82c1e9d2495eb92c8bcf))
* `z.union` does not work on a single element ([a646a5c](https://github.com/kubb-project/kubb/commit/a646a5c96854d8d8395e26758c3cf4fad35633f5))
* 🐛 fix: `fileManager` memory loop ([acc58dc](https://github.com/kubb-project/kubb/commit/acc58dcb40e4c320da2ceb09b3d8a1a32abed515))
* add `@swc/core` ([7c44878](https://github.com/kubb-project/kubb/commit/7c44878e83d65eeb57dbbea15b2066cc61cc2471))
* add `ClientBuilder` for our client generator + ReturnType ([21de173](https://github.com/kubb-project/kubb/commit/21de1738d24d6a6dbae516ef60bbcc4b67fec6ea))
* add `QueryBuilder` for our SWR generator + ReturnType ([5bfc99c](https://github.com/kubb-project/kubb/commit/5bfc99c364143acb10bf8c457ed53562b579b180))
* add `QueryBuilder` for Tanstack/query generators ([3c4ea57](https://github.com/kubb-project/kubb/commit/3c4ea57077a0d1c131a2f692e9f2a55c6bcec468))
* add enum name when enum value is a number ([5c04268](https://github.com/kubb-project/kubb/commit/5c04268982359984d6ca096cd4ece11a5bb3a61a))
* add jsdocs for overrides ([aa29352](https://github.com/kubb-project/kubb/commit/aa29352e279aa2c30fa98244281c54d66b5a1d5d))
* add react-query-devtools ([26188ed](https://github.com/kubb-project/kubb/commit/26188edbedb7b14431d51f66929d80d7508009eb))
* advanced queue ([e8e90b9](https://github.com/kubb-project/kubb/commit/e8e90b9cbeadad793b759a174641874dc39c2c01))
* allOf, anyOf without `any & any` fallback ([ee0237f](https://github.com/kubb-project/kubb/commit/ee0237f7a7516a9adebf5dbbeeae0df4a2369fec))
* anyOf support(same result as oneOf) ([70f5d47](https://github.com/kubb-project/kubb/commit/70f5d47a93a1eebfaef50c18f9b0fbc4c17cc6ff))
* better timeout order for CLI ([44dee73](https://github.com/kubb-project/kubb/commit/44dee7370ca5e65e85aa312dcedc83dac61e85dd))
* better use of `$ref` ([73f0b53](https://github.com/kubb-project/kubb/commit/73f0b53ed142ba01bcb284d24344ecd57b647e32))
* clientOptions to override Axios/Fetch options ([f9799e7](https://github.com/kubb-project/kubb/commit/f9799e70d9fafe64d53959792061f14f74d3ed21))
* combine `allOf` and `properties` ([36c022d](https://github.com/kubb-project/kubb/commit/36c022d1876abde9fedcd986fa85a71121114af0))
* correct use of logging(added `stacktrace` option) ([6c89e3d](https://github.com/kubb-project/kubb/commit/6c89e3dae8b318625e3f484b1dbb259f9b14d378))
* date, email uri, nullish and uui support for `zod` ([63bb669](https://github.com/kubb-project/kubb/commit/63bb669fc7f1fc58095fe620c612cceef7404592))
* date, uri, and uui support for `faker.js` ([203f701](https://github.com/kubb-project/kubb/commit/203f7016d6e9f353e31655b908a62af7eb8e8965))
* dereference for swagger JSON schemas ([ce3565a](https://github.com/kubb-project/kubb/commit/ce3565a38cb50b5c213bc569d75977ad882e5b95))
* description for pathParams and queryParams ([95ce086](https://github.com/kubb-project/kubb/commit/95ce0863cad0a3f81e1787d780f710ed5a91ddba))
* don't create an infiniteQuery when the `infinite` option is unset. ([ee8b799](https://github.com/kubb-project/kubb/commit/ee8b799c2e50cf2ce9c1eb28314dff7228363f4c))
* enums for `Zod` cannot have min/max ([79b8374](https://github.com/kubb-project/kubb/commit/79b8374d76063bf89e3a48fdef7ebea0aa84c808))
* export `client.ts` in `index.js` ([52b0c81](https://github.com/kubb-project/kubb/commit/52b0c81f190cae86de557bb62db60c8e18cfb07b))
* fallback on 2xx instead of hardcoded 200 for the ResponseSchema ([84686f0](https://github.com/kubb-project/kubb/commit/84686f00e3da65a38de971e99168c50ef0030d0f))
* full debug mode for fileManager, build, pluginManager and update for Queue to include `node.js` performance ([839d636](https://github.com/kubb-project/kubb/commit/839d6362e5ab19eb893e0ac1b6b1eb82d9c6de58))
* get requestSchema based on `operation.getRequestBody` or `operation.getRequestBody(requestBodyTypes.at(0)` ([85e3e78](https://github.com/kubb-project/kubb/commit/85e3e786786f1b4c57cec1605d5fb96aeac1ab83))
* handlers + demo MSW ([3c3b636](https://github.com/kubb-project/kubb/commit/3c3b6364ea28e44e407940299268166b5a348ab8))
* headers ([fdc228a](https://github.com/kubb-project/kubb/commit/fdc228a848f180ef1f1307ccedcdaa74c16caa5c))
* improvements for logger used in our CLI ([9c648da](https://github.com/kubb-project/kubb/commit/9c648daef4a23c8eec3f5d2529e933cbf7d2e3d3))
* include all schemas in `components` responses and request ([269929f](https://github.com/kubb-project/kubb/commit/269929fc182822bd0757bab2a619340fc232e735))
* logging naming ([9ed216f](https://github.com/kubb-project/kubb/commit/9ed216f1ffb05089a2071818855dc03000e78608))
* make `vue` work with refs ([d243087](https://github.com/kubb-project/kubb/commit/d2430871401ab23fc3b3af1823be3538819fdba1))
* max 50 queue items per run ([c90e28f](https://github.com/kubb-project/kubb/commit/c90e28f324a98ea21f136058f5e02342d8b22a17))
* msw without requestMock ([17a1ba2](https://github.com/kubb-project/kubb/commit/17a1ba23886dea79efb0752eb23323dd60dbaebd))
* no banner for subpackage client ([a0a6627](https://github.com/kubb-project/kubb/commit/a0a6627a0e3215884fdde191a9a153a309516e57))
* OraWritable to create a direct stream for hooks(`execa.pipeStdout`) ([0e95549](https://github.com/kubb-project/kubb/commit/0e955496e4e64e0091951eabca5849b719b60329))
* patch of oas-normalize(https://github.com/readmeio/oas-normalize/pull/291) ([0f1bcef](https://github.com/kubb-project/kubb/commit/0f1bcefba3d6afb462fd4962bfd7d9f54fa475e3))
* paths to include multiLevel objects(`fullName`) ([918482d](https://github.com/kubb-project/kubb/commit/918482d59ac82fe9812a563333de71d78db4e079))
* pluginManager with `api` config will now be an function so the `core` functionality is accessible when using `this` ([4306318](https://github.com/kubb-project/kubb/commit/43063189a1a18ed2aca23b0505d3163aeddbc2ef))
* proper escape Regex(Escape all characters not included in SingleStringCharacters and DoubleStringCharacters) ([4b43cc1](https://github.com/kubb-project/kubb/commit/4b43cc169de5173eec8a760148fb4ab33d2a4eab))
* queryKey with `{url, params}` object ([186e05d](https://github.com/kubb-project/kubb/commit/186e05d5c310766c8579fd840ce3dc6bb6f14bb5))
* randomColour with more options(dark mode with `bold`) ([487d59c](https://github.com/kubb-project/kubb/commit/487d59c4f25d754dc7bf9562ea1bf40334cefaaf))
* read/write with queue to not block nodejs ([b73d21f](https://github.com/kubb-project/kubb/commit/b73d21f4866fd58feb9ff05057cd74946cace495))
* removal of jest ([cae68a4](https://github.com/kubb-project/kubb/commit/cae68a40b72296588dd5dcc22b454becbe9791e0))
* remove out unused imports ([14f7c48](https://github.com/kubb-project/kubb/commit/14f7c488963b5d0659f00c38983dc5c14209b4d0))
* remove peerDependency for 'react' in swagger-client ([29af254](https://github.com/kubb-project/kubb/commit/29af25436f60e79715bdad7f35266edbe208c112))
* remove rimraf + use of correct order for params ([03180e3](https://github.com/kubb-project/kubb/commit/03180e3d33c5dd96bb101be691ae56a2edd3f0b9))
* remove uniqueId ([2607eff](https://github.com/kubb-project/kubb/commit/2607effc60d1fb2aa1f4e69d60498234d7c03a96))
* resolve `client.ts` based on root instead of using the generic `this.resolvePath` ([073b81f](https://github.com/kubb-project/kubb/commit/073b81f91681f4f62fb14f8b4304aceac89c255b))
* ResponseConfig for mutation ([4c48ff6](https://github.com/kubb-project/kubb/commit/4c48ff694ff5df1091aad3290420b3a85234bf1c))
* revert `patch` refactor ([f3596e9](https://github.com/kubb-project/kubb/commit/f3596e9fd782f30fdaabd292c173778d1f34c32c))
* run with a timeout and every executation will be done with our `queue` ([60e00cf](https://github.com/kubb-project/kubb/commit/60e00cf4f1dfd1628681f39959d544d8e3843a7d))
* skipBy improvements ([b6fd85e](https://github.com/kubb-project/kubb/commit/b6fd85eac66b3a6ecbd7d8099f374a37b17937a8))
* spacing TS ([4218c1b](https://github.com/kubb-project/kubb/commit/4218c1b59bbd0f2189cf2a0f88da089ed0cb086d))
* support for `minItems` and `maxItems` ([90a92a2](https://github.com/kubb-project/kubb/commit/90a92a234e930f465709c8bb9d92f12723272d1e))
* support for PATCH ([c326d7c](https://github.com/kubb-project/kubb/commit/c326d7cafaa2ddf258579f889f061bbdf51a96fd))
* support for refs in `tanstack-query-vue` ([1afc5cb](https://github.com/kubb-project/kubb/commit/1afc5cb645cfaa5959fc005365d679cd6abdbb6d))
* type update for `SWR@2.2.0` ([6358699](https://github.com/kubb-project/kubb/commit/6358699e5f32846dcc889322f834c679438def16))
* types fix `exports` based on `https://arethetypeswrong.github.io/` ([f942def](https://github.com/kubb-project/kubb/commit/f942defb40584fdfddc94852bf751a6acf10476a))
* typescript enum value needs to be a string ([6bfdd17](https://github.com/kubb-project/kubb/commit/6bfdd178fa5e2bd49336c2bf9ae5ef395b14b03c))
* uniqueId per plugin ([b170dd8](https://github.com/kubb-project/kubb/commit/b170dd80433852c7c7dfe462c737c8abd11f8d6d))
* update ci ([d93ab42](https://github.com/kubb-project/kubb/commit/d93ab42b560dc7ba9b8d212329ec49d080f93777))
* update packages ([8b5a483](https://github.com/kubb-project/kubb/commit/8b5a4836d13009138d94f2af236a9fa0bec50c6d))
* upgrade js-runtime ([4c1379d](https://github.com/kubb-project/kubb/commit/4c1379dad889cd244f5d3e0bd3178b08a34eb981))
* upgrade oas(es support) and overall packages ([c5b1f4e](https://github.com/kubb-project/kubb/commit/c5b1f4e0f6e4fc880df94f8a02d9a0b9b81053ff))
* upgrade package ([5f2b5ed](https://github.com/kubb-project/kubb/commit/5f2b5ed865fc7e63127194c3f01698c0e5d6034a))
* upgrade packages for vitest ([9a0778e](https://github.com/kubb-project/kubb/commit/9a0778e07969a23d8e5663da308181d36b1d8272))
* use `z.union` when enum has `type: number` set ([7fa922d](https://github.com/kubb-project/kubb/commit/7fa922d5fd0663ee4c84de6a57f5426e6f972ae9))
* use fixed `typescript` version, version 4 is not supported ([6f20725](https://github.com/kubb-project/kubb/commit/6f20725d94dbdaba2dceabce87a5276afb332256))
* use of `content[bodyType || 'application/json']` when available + fallback on `schema` for `OperationGenerator ([20cf285](https://github.com/kubb-project/kubb/commit/20cf285ca82618beed4afad74d646dced100a53e))
* use of pluginsOptions and small cleanup ([15d50a5](https://github.com/kubb-project/kubb/commit/15d50a5d56f1ca8b44ef70be56fefc489eaf6d93))
* warning with correct cli message(validate for swagger) ([b091e28](https://github.com/kubb-project/kubb/commit/b091e282f079e7694bf04a35ea6a0ebfd3aa06da))
* when alias starts with a number, exclude and replace by _ ([10962ff](https://github.com/kubb-project/kubb/commit/10962ff755f61208d88f36d0c8bd87823d5e8410))
