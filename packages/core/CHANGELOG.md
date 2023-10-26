# Changelog
## [1.14.5](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.14.4...@kubb/core-v1.14.5) (2023-10-26)


### ✨ Features

* &lt;File.Source/&gt; with path and print to read external file ([4bf2d9a](https://github.com/kubb-project/kubb/commit/4bf2d9a1e3023ef90be3fb28b25554d70f844ea1))
* `ClientFunction` with React for creating an axios get/post/put call ([7ef6819](https://github.com/kubb-project/kubb/commit/7ef68198c85888d76bf2949d9cc99993c1dd7fc7))
* `input.data` for oasParser ([feb56f4](https://github.com/kubb-project/kubb/commit/feb56f49f4b12215d5c948c3508d058fb5eb42c1))
* `optionalType` for `swagger-ts` ([ae204ea](https://github.com/kubb-project/kubb/commit/ae204ea5bd02a7817c281bcd14fbf729e4d48eb3))
* `pathParamsType` to override behaviour when calling a generated get/post/put function ([12624c4](https://github.com/kubb-project/kubb/commit/12624c4e426b417e50e5f19665fd1b529b3d0b6a))
* `QueryKeyFunction` to render queryKey with React(`@kubb/react-template`) ([0157491](https://github.com/kubb-project/kubb/commit/0157491d2007cb6e64578871f4478f1787684ed6))
* `useResolve` with pluginManager(resolvePath and resolveName) ([78b1c1c](https://github.com/kubb-project/kubb/commit/78b1c1c9f850f9e256107e839b0eaa902e9e8c66))
* ✨ skipBy to exclude `tags`, `names`, `paths`, ... out of the generation ([44be77b](https://github.com/kubb-project/kubb/commit/44be77bb8748ae0188481716ef19dc6a39f1e538))
* PackageManager to retreive a version in the package.json of the user ([220cd63](https://github.com/kubb-project/kubb/commit/220cd631f95e24e622c6579849a53b3cedd95b50))
* support for `bun` with read/write ([4c4283b](https://github.com/kubb-project/kubb/commit/4c4283bb92995d369c65ba8087f81771ffb36086))
* type for `resolveName` ([53f9893](https://github.com/kubb-project/kubb/commit/53f98933e4b1ffe834622207768257d524f1f725))
* use of `createRoot` and `client` subPackage ([d2e7b45](https://github.com/kubb-project/kubb/commit/d2e7b4596bbdba1e1dacbcd3df6b38a3d6fde467))
* use of `jsxImportSource` for a custom react-runtime being used by `@kubb/react-template` ([db8f351](https://github.com/kubb-project/kubb/commit/db8f3519ffa8dc2ede5309f0c4c8acb30bc6757e))


### 📚 Documentation

* add tip for `module` import ([5b7e24a](https://github.com/kubb-project/kubb/commit/5b7e24a7171e644d35e6f9a49fc2e6543868ba64))
* better docs with examples ([fb42958](https://github.com/kubb-project/kubb/commit/fb429588f213a0ec7973fd64aa24eea17529747a))
* readme update + typo's ([a1bb145](https://github.com/kubb-project/kubb/commit/a1bb14550c7d6d73832da612275ef66f65d32a02))
* swagger-msw plugin ([b8f14c1](https://github.com/kubb-project/kubb/commit/b8f14c1690bc66160936c92144a2e2b0ce227d88))
* update docs ([a246bb1](https://github.com/kubb-project/kubb/commit/a246bb1171a95ba9d639468c5f8214573bd33513))
* update docs with examples ([9087387](https://github.com/kubb-project/kubb/commit/908738795b2c1a3612dbc556b957f41c62465dc2))
* use of vitepress ([346a3b7](https://github.com/kubb-project/kubb/commit/346a3b7099e7019c04750bad8fe1fa9dc66c3c97))


### 🐞 Bug Fixes

* `eventEmitter` public for `PluginManager` ([c3d340f](https://github.com/kubb-project/kubb/commit/c3d340f3d613b88cd4dd655f786446776975466e))
* anyOf support(same result as oneOf) ([70f5d47](https://github.com/kubb-project/kubb/commit/70f5d47a93a1eebfaef50c18f9b0fbc4c17cc6ff))
* better types for plugin `api` ([a4303b7](https://github.com/kubb-project/kubb/commit/a4303b7b102d871f514649f2edb4fb9058d6564d))
* better types for PluginFactoryOptions and `KubbPlugin` ([3fb7bdd](https://github.com/kubb-project/kubb/commit/3fb7bdd7b612373c55597705037eab9fdc8202ee))
* getParams refactor for generics ([3b01f51](https://github.com/kubb-project/kubb/commit/3b01f51b2e9fdf891a23f655eba5680be6dcb76e))
* logging naming ([9ed216f](https://github.com/kubb-project/kubb/commit/9ed216f1ffb05089a2071818855dc03000e78608))
* make `vue` work with refs ([d243087](https://github.com/kubb-project/kubb/commit/d2430871401ab23fc3b3af1823be3538819fdba1))
* proper escape Regex(Escape all characters not included in SingleStringCharacters and DoubleStringCharacters) ([4b43cc1](https://github.com/kubb-project/kubb/commit/4b43cc169de5173eec8a760148fb4ab33d2a4eab))
* queryKey with `{url, params}` object ([186e05d](https://github.com/kubb-project/kubb/commit/186e05d5c310766c8579fd840ce3dc6bb6f14bb5))
* remove `@swc/core` dependency(decrease of the bundle size) ([2dfc28f](https://github.com/kubb-project/kubb/commit/2dfc28f7959af550abd807fa38d1989e3603be7c))
* remove of `types` exports field ([1c07fd7](https://github.com/kubb-project/kubb/commit/1c07fd72424db47e3a717d99ea5019bb7744f3c0))
* remove out unused imports ([14f7c48](https://github.com/kubb-project/kubb/commit/14f7c488963b5d0659f00c38983dc5c14209b4d0))
* remove rimraf + use of correct order for params ([03180e3](https://github.com/kubb-project/kubb/commit/03180e3d33c5dd96bb101be691ae56a2edd3f0b9))
* ResponseConfig for mutation ([4c48ff6](https://github.com/kubb-project/kubb/commit/4c48ff694ff5df1091aad3290420b3a85234bf1c))
* spacing TS ([4218c1b](https://github.com/kubb-project/kubb/commit/4218c1b59bbd0f2189cf2a0f88da089ed0cb086d))
* types fix `exports` based on `https://arethetypeswrong.github.io/` ([f942def](https://github.com/kubb-project/kubb/commit/f942defb40584fdfddc94852bf751a6acf10476a))
* uniqueId per plugin ([b170dd8](https://github.com/kubb-project/kubb/commit/b170dd80433852c7c7dfe462c737c8abd11f8d6d))
* upgrade `oas` + custom patch for `typesVersions` ([e9e26ae](https://github.com/kubb-project/kubb/commit/e9e26ae204a2eb3b6dc1e3a391c17a5d9d64f86c))
* upgrade js-runtime ([4c1379d](https://github.com/kubb-project/kubb/commit/4c1379dad889cd244f5d3e0bd3178b08a34eb981))
* upgrade oas(es support) and overall packages ([c5b1f4e](https://github.com/kubb-project/kubb/commit/c5b1f4e0f6e4fc880df94f8a02d9a0b9b81053ff))
* use of `fileManager.addIndexes` and `URLPath` without static functions ([9bc291d](https://github.com/kubb-project/kubb/commit/9bc291d5b9126b1d3f26803e6a1c54a3b008f634))
* use of `FunctionParams` ([9ca29c1](https://github.com/kubb-project/kubb/commit/9ca29c10ba410d6c7e67d3106395c6b38d960511))
* use of pluginsOptions and small cleanup ([15d50a5](https://github.com/kubb-project/kubb/commit/15d50a5d56f1ca8b44ef70be56fefc489eaf6d93))


### 📦 Miscellaneous Chores

* release 1.10.4 ([e2607b3](https://github.com/kubb-project/kubb/commit/e2607b3499ea9c810b508456b4e0ad5841a27347))
* release 1.11.6 ([70826b2](https://github.com/kubb-project/kubb/commit/70826b2d52d970b16a7f00a8c63f95354699df7c))
* release 1.14.2 ([91e61ac](https://github.com/kubb-project/kubb/commit/91e61acde1c3824c40f291e1142363eaa95fb1cf))
* release 1.14.3 ([695f324](https://github.com/kubb-project/kubb/commit/695f3242d61ac13f4284f3bdf529a3bc0e353244))
* release 1.4.0 ([fc0de82](https://github.com/kubb-project/kubb/commit/fc0de826f94c2ff933dd2cefe26168ea6fcf8c3b))
* release 1.4.0 ([b1d4561](https://github.com/kubb-project/kubb/commit/b1d456179bc4415168142939b4be64b225a4870f))
* release 1.4.1 ([9805506](https://github.com/kubb-project/kubb/commit/98055065a6931b96dc1038890eb56ebb0342818f))
* release 1.5.2 ([2f49c97](https://github.com/kubb-project/kubb/commit/2f49c97863b3dcee1a6158d97a5ca66848d52261))
* release 1.8.0 ([218b7f0](https://github.com/kubb-project/kubb/commit/218b7f0e8ec1cbc8b6db504ec6e06d8dbeb1109e))

## [1.14.4](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.14.3...@kubb/core-v1.14.4) (2023-10-25)


### ✨ Features

* &lt;File.Source/&gt; with path and print to read external file ([4bf2d9a](https://github.com/kubb-project/kubb/commit/4bf2d9a1e3023ef90be3fb28b25554d70f844ea1))
* `ClientFunction` with React for creating an axios get/post/put call ([7ef6819](https://github.com/kubb-project/kubb/commit/7ef68198c85888d76bf2949d9cc99993c1dd7fc7))
* `input.data` for oasParser ([feb56f4](https://github.com/kubb-project/kubb/commit/feb56f49f4b12215d5c948c3508d058fb5eb42c1))
* `optionalType` for `swagger-ts` ([ae204ea](https://github.com/kubb-project/kubb/commit/ae204ea5bd02a7817c281bcd14fbf729e4d48eb3))
* `pathParamsType` to override behaviour when calling a generated get/post/put function ([12624c4](https://github.com/kubb-project/kubb/commit/12624c4e426b417e50e5f19665fd1b529b3d0b6a))
* `QueryKeyFunction` to render queryKey with React(`@kubb/react-template`) ([0157491](https://github.com/kubb-project/kubb/commit/0157491d2007cb6e64578871f4478f1787684ed6))
* `useResolve` with pluginManager(resolvePath and resolveName) ([78b1c1c](https://github.com/kubb-project/kubb/commit/78b1c1c9f850f9e256107e839b0eaa902e9e8c66))
* ✨ skipBy to exclude `tags`, `names`, `paths`, ... out of the generation ([44be77b](https://github.com/kubb-project/kubb/commit/44be77bb8748ae0188481716ef19dc6a39f1e538))
* PackageManager to retreive a version in the package.json of the user ([220cd63](https://github.com/kubb-project/kubb/commit/220cd631f95e24e622c6579849a53b3cedd95b50))
* support for `bun` with read/write ([4c4283b](https://github.com/kubb-project/kubb/commit/4c4283bb92995d369c65ba8087f81771ffb36086))
* type for `resolveName` ([53f9893](https://github.com/kubb-project/kubb/commit/53f98933e4b1ffe834622207768257d524f1f725))
* use of `createRoot` and `client` subPackage ([d2e7b45](https://github.com/kubb-project/kubb/commit/d2e7b4596bbdba1e1dacbcd3df6b38a3d6fde467))
* use of `jsxImportSource` for a custom react-runtime being used by `@kubb/react-template` ([db8f351](https://github.com/kubb-project/kubb/commit/db8f3519ffa8dc2ede5309f0c4c8acb30bc6757e))


### 📚 Documentation

* add tip for `module` import ([5b7e24a](https://github.com/kubb-project/kubb/commit/5b7e24a7171e644d35e6f9a49fc2e6543868ba64))
* better docs with examples ([fb42958](https://github.com/kubb-project/kubb/commit/fb429588f213a0ec7973fd64aa24eea17529747a))
* readme update + typo's ([a1bb145](https://github.com/kubb-project/kubb/commit/a1bb14550c7d6d73832da612275ef66f65d32a02))
* swagger-msw plugin ([b8f14c1](https://github.com/kubb-project/kubb/commit/b8f14c1690bc66160936c92144a2e2b0ce227d88))
* update docs ([a246bb1](https://github.com/kubb-project/kubb/commit/a246bb1171a95ba9d639468c5f8214573bd33513))
* update docs with examples ([9087387](https://github.com/kubb-project/kubb/commit/908738795b2c1a3612dbc556b957f41c62465dc2))
* use of vitepress ([346a3b7](https://github.com/kubb-project/kubb/commit/346a3b7099e7019c04750bad8fe1fa9dc66c3c97))


### 🐞 Bug Fixes

* `eventEmitter` public for `PluginManager` ([c3d340f](https://github.com/kubb-project/kubb/commit/c3d340f3d613b88cd4dd655f786446776975466e))
* anyOf support(same result as oneOf) ([70f5d47](https://github.com/kubb-project/kubb/commit/70f5d47a93a1eebfaef50c18f9b0fbc4c17cc6ff))
* better types for plugin `api` ([a4303b7](https://github.com/kubb-project/kubb/commit/a4303b7b102d871f514649f2edb4fb9058d6564d))
* better types for PluginFactoryOptions and `KubbPlugin` ([3fb7bdd](https://github.com/kubb-project/kubb/commit/3fb7bdd7b612373c55597705037eab9fdc8202ee))
* getParams refactor for generics ([3b01f51](https://github.com/kubb-project/kubb/commit/3b01f51b2e9fdf891a23f655eba5680be6dcb76e))
* logging naming ([9ed216f](https://github.com/kubb-project/kubb/commit/9ed216f1ffb05089a2071818855dc03000e78608))
* make `vue` work with refs ([d243087](https://github.com/kubb-project/kubb/commit/d2430871401ab23fc3b3af1823be3538819fdba1))
* proper escape Regex(Escape all characters not included in SingleStringCharacters and DoubleStringCharacters) ([4b43cc1](https://github.com/kubb-project/kubb/commit/4b43cc169de5173eec8a760148fb4ab33d2a4eab))
* queryKey with `{url, params}` object ([186e05d](https://github.com/kubb-project/kubb/commit/186e05d5c310766c8579fd840ce3dc6bb6f14bb5))
* remove `@swc/core` dependency(decrease of the bundle size) ([2dfc28f](https://github.com/kubb-project/kubb/commit/2dfc28f7959af550abd807fa38d1989e3603be7c))
* remove of `types` exports field ([1c07fd7](https://github.com/kubb-project/kubb/commit/1c07fd72424db47e3a717d99ea5019bb7744f3c0))
* remove out unused imports ([14f7c48](https://github.com/kubb-project/kubb/commit/14f7c488963b5d0659f00c38983dc5c14209b4d0))
* remove rimraf + use of correct order for params ([03180e3](https://github.com/kubb-project/kubb/commit/03180e3d33c5dd96bb101be691ae56a2edd3f0b9))
* ResponseConfig for mutation ([4c48ff6](https://github.com/kubb-project/kubb/commit/4c48ff694ff5df1091aad3290420b3a85234bf1c))
* spacing TS ([4218c1b](https://github.com/kubb-project/kubb/commit/4218c1b59bbd0f2189cf2a0f88da089ed0cb086d))
* types fix `exports` based on `https://arethetypeswrong.github.io/` ([f942def](https://github.com/kubb-project/kubb/commit/f942defb40584fdfddc94852bf751a6acf10476a))
* uniqueId per plugin ([b170dd8](https://github.com/kubb-project/kubb/commit/b170dd80433852c7c7dfe462c737c8abd11f8d6d))
* upgrade `oas` + custom patch for `typesVersions` ([e9e26ae](https://github.com/kubb-project/kubb/commit/e9e26ae204a2eb3b6dc1e3a391c17a5d9d64f86c))
* upgrade js-runtime ([4c1379d](https://github.com/kubb-project/kubb/commit/4c1379dad889cd244f5d3e0bd3178b08a34eb981))
* upgrade oas(es support) and overall packages ([c5b1f4e](https://github.com/kubb-project/kubb/commit/c5b1f4e0f6e4fc880df94f8a02d9a0b9b81053ff))
* use of `fileManager.addIndexes` and `URLPath` without static functions ([9bc291d](https://github.com/kubb-project/kubb/commit/9bc291d5b9126b1d3f26803e6a1c54a3b008f634))
* use of `FunctionParams` ([9ca29c1](https://github.com/kubb-project/kubb/commit/9ca29c10ba410d6c7e67d3106395c6b38d960511))
* use of pluginsOptions and small cleanup ([15d50a5](https://github.com/kubb-project/kubb/commit/15d50a5d56f1ca8b44ef70be56fefc489eaf6d93))


### 📦 Miscellaneous Chores

* release 1.10.4 ([e2607b3](https://github.com/kubb-project/kubb/commit/e2607b3499ea9c810b508456b4e0ad5841a27347))
* release 1.11.6 ([70826b2](https://github.com/kubb-project/kubb/commit/70826b2d52d970b16a7f00a8c63f95354699df7c))
* release 1.14.2 ([91e61ac](https://github.com/kubb-project/kubb/commit/91e61acde1c3824c40f291e1142363eaa95fb1cf))
* release 1.14.3 ([695f324](https://github.com/kubb-project/kubb/commit/695f3242d61ac13f4284f3bdf529a3bc0e353244))
* release 1.4.0 ([fc0de82](https://github.com/kubb-project/kubb/commit/fc0de826f94c2ff933dd2cefe26168ea6fcf8c3b))
* release 1.4.0 ([b1d4561](https://github.com/kubb-project/kubb/commit/b1d456179bc4415168142939b4be64b225a4870f))
* release 1.4.1 ([9805506](https://github.com/kubb-project/kubb/commit/98055065a6931b96dc1038890eb56ebb0342818f))
* release 1.5.2 ([2f49c97](https://github.com/kubb-project/kubb/commit/2f49c97863b3dcee1a6158d97a5ca66848d52261))
* release 1.8.0 ([218b7f0](https://github.com/kubb-project/kubb/commit/218b7f0e8ec1cbc8b6db504ec6e06d8dbeb1109e))

## [1.14.3](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.14.0...@kubb/core-v1.14.3) (2023-10-23)


### 🐞 Bug Fixes

* better types for plugin `api` ([a4303b7](https://github.com/kubb-project/kubb/commit/a4303b7b102d871f514649f2edb4fb9058d6564d))
* better types for PluginFactoryOptions and `KubbPlugin` ([3fb7bdd](https://github.com/kubb-project/kubb/commit/3fb7bdd7b612373c55597705037eab9fdc8202ee))
* use of `fileManager.addIndexes` and `URLPath` without static functions ([9bc291d](https://github.com/kubb-project/kubb/commit/9bc291d5b9126b1d3f26803e6a1c54a3b008f634))


### 📦 Miscellaneous Chores

* release 1.14.2 ([91e61ac](https://github.com/kubb-project/kubb/commit/91e61acde1c3824c40f291e1142363eaa95fb1cf))
* release 1.14.3 ([695f324](https://github.com/kubb-project/kubb/commit/695f3242d61ac13f4284f3bdf529a3bc0e353244))

## [1.14.0](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.13.0...@kubb/core-v1.14.0) (2023-10-20)


### 📚 Documentation

* better docs with examples ([fb42958](https://github.com/kubb-project/kubb/commit/fb429588f213a0ec7973fd64aa24eea17529747a))
* update docs with examples ([9087387](https://github.com/kubb-project/kubb/commit/908738795b2c1a3612dbc556b957f41c62465dc2))

## [1.13.0](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.12.0...@kubb/core-v1.13.0) (2023-10-18)


### ✨ Features

* `input.data` for oasParser ([feb56f4](https://github.com/kubb-project/kubb/commit/feb56f49f4b12215d5c948c3508d058fb5eb42c1))
* `pathParamsType` to override behaviour when calling a generated get/post/put function ([12624c4](https://github.com/kubb-project/kubb/commit/12624c4e426b417e50e5f19665fd1b529b3d0b6a))
* PackageManager to retreive a version in the package.json of the user ([220cd63](https://github.com/kubb-project/kubb/commit/220cd631f95e24e622c6579849a53b3cedd95b50))

## [1.12.0](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.11.6...@kubb/core-v1.12.0) (2023-10-18)


### ✨ Features

* type for `resolveName` ([53f9893](https://github.com/kubb-project/kubb/commit/53f98933e4b1ffe834622207768257d524f1f725))

## [1.11.6](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.11.5...@kubb/core-v1.11.6) (2023-10-16)


### 📦 Miscellaneous Chores

* release 1.11.6 ([70826b2](https://github.com/kubb-project/kubb/commit/70826b2d52d970b16a7f00a8c63f95354699df7c))

## [1.11.5](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.11.4...@kubb/core-v1.11.5) (2023-10-16)


### 📦 Miscellaneous Chores

* **@kubb/core:** Synchronize undefined versions

## [1.11.4](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.11.3...@kubb/core-v1.11.4) (2023-10-16)


### 📦 Miscellaneous Chores

* **@kubb/core:** Synchronize undefined versions

## [1.11.3](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.11.2...@kubb/core-v1.11.3) (2023-10-14)


### 📦 Miscellaneous Chores

* **@kubb/core:** Synchronize undefined versions

## [1.11.2](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.11.1...@kubb/core-v1.11.2) (2023-10-13)


### 🐞 Bug Fixes

* remove of `types` exports field ([1c07fd7](https://github.com/kubb-project/kubb/commit/1c07fd72424db47e3a717d99ea5019bb7744f3c0))

## [1.11.1](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.11.0...@kubb/core-v1.11.1) (2023-10-12)


### 📦 Miscellaneous Chores

* **@kubb/core:** Synchronize undefined versions

## [1.11.0](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.10.4...@kubb/core-v1.11.0) (2023-10-11)


### ✨ Features

* use of `createRoot` and `client` subPackage ([d2e7b45](https://github.com/kubb-project/kubb/commit/d2e7b4596bbdba1e1dacbcd3df6b38a3d6fde467))
* use of `jsxImportSource` for a custom react-runtime being used by `@kubb/react-template` ([db8f351](https://github.com/kubb-project/kubb/commit/db8f3519ffa8dc2ede5309f0c4c8acb30bc6757e))


### 🐞 Bug Fixes

* remove `@swc/core` dependency(decrease of the bundle size) ([2dfc28f](https://github.com/kubb-project/kubb/commit/2dfc28f7959af550abd807fa38d1989e3603be7c))
* upgrade `oas` + custom patch for `typesVersions` ([e9e26ae](https://github.com/kubb-project/kubb/commit/e9e26ae204a2eb3b6dc1e3a391c17a5d9d64f86c))

## [1.10.4](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.10.3...@kubb/core-v1.10.4) (2023-10-10)


### 📦 Miscellaneous Chores

* release 1.10.4 ([e2607b3](https://github.com/kubb-project/kubb/commit/e2607b3499ea9c810b508456b4e0ad5841a27347))

## [1.10.3](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.10.2...@kubb/core-v1.10.3) (2023-10-10)


### 📦 Miscellaneous Chores

* **@kubb/core:** Synchronize undefined versions

## [1.10.2](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.10.1...@kubb/core-v1.10.2) (2023-10-10)


### 📦 Miscellaneous Chores

* **@kubb/core:** Synchronize undefined versions

## [1.10.1](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.10.0...@kubb/core-v1.10.1) (2023-10-10)


### 🐞 Bug Fixes

* make `vue` work with refs ([d243087](https://github.com/kubb-project/kubb/commit/d2430871401ab23fc3b3af1823be3538819fdba1))
* queryKey with `{url, params}` object ([186e05d](https://github.com/kubb-project/kubb/commit/186e05d5c310766c8579fd840ce3dc6bb6f14bb5))

## [1.10.0](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.9.5...@kubb/core-v1.10.0) (2023-10-08)


### ✨ Features

* `ClientFunction` with React for creating an axios get/post/put call ([7ef6819](https://github.com/kubb-project/kubb/commit/7ef68198c85888d76bf2949d9cc99993c1dd7fc7))

## [1.9.5](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.9.4...@kubb/core-v1.9.5) (2023-10-06)


### 🐞 Bug Fixes

* remove out unused imports ([14f7c48](https://github.com/kubb-project/kubb/commit/14f7c488963b5d0659f00c38983dc5c14209b4d0))
* ResponseConfig for mutation ([4c48ff6](https://github.com/kubb-project/kubb/commit/4c48ff694ff5df1091aad3290420b3a85234bf1c))

## [1.9.4](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.9.3...@kubb/core-v1.9.4) (2023-09-29)


### 📦 Miscellaneous Chores

* **@kubb/core:** Synchronize undefined versions

## [1.9.3](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.9.2...@kubb/core-v1.9.3) (2023-09-28)


### 📦 Miscellaneous Chores

* **@kubb/core:** Synchronize undefined versions

## [1.9.2](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.9.1...@kubb/core-v1.9.2) (2023-09-27)


### 🐞 Bug Fixes

* proper escape Regex(Escape all characters not included in SingleStringCharacters and DoubleStringCharacters) ([4b43cc1](https://github.com/kubb-project/kubb/commit/4b43cc169de5173eec8a760148fb4ab33d2a4eab))

## [1.9.1](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.9.0...@kubb/core-v1.9.1) (2023-09-22)


### 🐞 Bug Fixes

* remove rimraf + use of correct order for params ([03180e3](https://github.com/kubb-project/kubb/commit/03180e3d33c5dd96bb101be691ae56a2edd3f0b9))

## [1.9.0](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.8.5...@kubb/core-v1.9.0) (2023-09-22)


### ✨ Features

* `optionalType` for `swagger-ts` ([ae204ea](https://github.com/kubb-project/kubb/commit/ae204ea5bd02a7817c281bcd14fbf729e4d48eb3))

## [1.8.5](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.8.4...@kubb/core-v1.8.5) (2023-09-13)


### 🐞 Bug Fixes

* spacing TS ([4218c1b](https://github.com/kubb-project/kubb/commit/4218c1b59bbd0f2189cf2a0f88da089ed0cb086d))

## [1.8.4](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.8.3...@kubb/core-v1.8.4) (2023-09-13)


### 📦 Miscellaneous Chores

* **@kubb/core:** Synchronize undefined versions

## [1.8.3](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.8.2...@kubb/core-v1.8.3) (2023-09-12)


### 📚 Documentation

* readme update + typo's ([a1bb145](https://github.com/kubb-project/kubb/commit/a1bb14550c7d6d73832da612275ef66f65d32a02))


### 🐞 Bug Fixes

* upgrade js-runtime ([4c1379d](https://github.com/kubb-project/kubb/commit/4c1379dad889cd244f5d3e0bd3178b08a34eb981))

## [1.8.2](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.8.1...@kubb/core-v1.8.2) (2023-09-11)


### 🐞 Bug Fixes

* use of pluginsOptions and small cleanup ([15d50a5](https://github.com/kubb-project/kubb/commit/15d50a5d56f1ca8b44ef70be56fefc489eaf6d93))

## [1.8.1](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.8.0...@kubb/core-v1.8.1) (2023-09-10)


### 📦 Miscellaneous Chores

* **@kubb/core:** Synchronize undefined versions

## [1.8.0](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.7.3...@kubb/core-v1.8.0) (2023-09-10)


### 📚 Documentation

* swagger-msw plugin ([b8f14c1](https://github.com/kubb-project/kubb/commit/b8f14c1690bc66160936c92144a2e2b0ce227d88))


### 📦 Miscellaneous Chores

* release 1.8.0 ([218b7f0](https://github.com/kubb-project/kubb/commit/218b7f0e8ec1cbc8b6db504ec6e06d8dbeb1109e))

## [1.7.3](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.7.2...@kubb/core-v1.7.3) (2023-09-09)


### 📦 Miscellaneous Chores

* **@kubb/core:** Synchronize undefined versions

## [1.7.2](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.7.1...@kubb/core-v1.7.2) (2023-09-08)


### 📦 Miscellaneous Chores

* **@kubb/core:** Synchronize undefined versions

## [1.7.1](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.7.0...@kubb/core-v1.7.1) (2023-09-06)


### 📦 Miscellaneous Chores

* **@kubb/core:** Synchronize undefined versions

## [1.7.0](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.6.3...@kubb/core-v1.7.0) (2023-09-05)


### 📦 Miscellaneous Chores

* **@kubb/core:** Synchronize undefined versions

## [1.6.3](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.6.2...@kubb/core-v1.6.3) (2023-09-03)


### 📦 Miscellaneous Chores

* **@kubb/core:** Synchronize undefined versions

## [1.6.2](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.6.1...@kubb/core-v1.6.2) (2023-09-02)


### 🐞 Bug Fixes

* upgrade oas(es support) and overall packages ([c5b1f4e](https://github.com/kubb-project/kubb/commit/c5b1f4e0f6e4fc880df94f8a02d9a0b9b81053ff))

## [1.6.1](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.6.0...@kubb/core-v1.6.1) (2023-08-29)


### 🐞 Bug Fixes

* anyOf support(same result as oneOf) ([70f5d47](https://github.com/kubb-project/kubb/commit/70f5d47a93a1eebfaef50c18f9b0fbc4c17cc6ff))

## [1.6.0](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.5.5...@kubb/core-v1.6.0) (2023-08-25)


### 📦 Miscellaneous Chores

* **@kubb/core:** Synchronize undefined versions

## [1.5.5](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.5.4...@kubb/core-v1.5.5) (2023-08-11)


### 📚 Documentation

* add tip for `module` import ([5b7e24a](https://github.com/kubb-project/kubb/commit/5b7e24a7171e644d35e6f9a49fc2e6543868ba64))

## [1.5.4](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.5.3...@kubb/core-v1.5.4) (2023-07-28)


### 📦 Miscellaneous Chores

* **@kubb/core:** Synchronize undefined versions

## [1.5.3](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.5.2...@kubb/core-v1.5.3) (2023-07-27)


### 📦 Miscellaneous Chores

* **@kubb/core:** Synchronize undefined versions

## [1.5.2](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.5.1...@kubb/core-v1.5.2) (2023-07-08)


### 📦 Miscellaneous Chores

* release 1.5.2 ([2f49c97](https://github.com/kubb-project/kubb/commit/2f49c97863b3dcee1a6158d97a5ca66848d52261))

## [1.5.1](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.5.0...@kubb/core-v1.5.1) (2023-07-08)


### 📚 Documentation

* use of vitepress ([346a3b7](https://github.com/kubb-project/kubb/commit/346a3b7099e7019c04750bad8fe1fa9dc66c3c97))

## [1.5.0](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.4.2...@kubb/core-v1.5.0) (2023-07-05)


### ✨ Features

* ✨ skipBy to exclude `tags`, `names`, `paths`, ... out of the generation ([44be77b](https://github.com/kubb-project/kubb/commit/44be77bb8748ae0188481716ef19dc6a39f1e538))
* support for `bun` with read/write ([4c4283b](https://github.com/kubb-project/kubb/commit/4c4283bb92995d369c65ba8087f81771ffb36086))

## [1.4.2](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.4.1...@kubb/core-v1.4.2) (2023-06-28)


### 🐞 Bug Fixes

* types fix `exports` based on `https://arethetypeswrong.github.io/` ([f942def](https://github.com/kubb-project/kubb/commit/f942defb40584fdfddc94852bf751a6acf10476a))

## [1.4.1](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.4.0...@kubb/core-v1.4.1) (2023-06-27)


### 📦 Miscellaneous Chores

* release 1.4.1 ([9805506](https://github.com/kubb-project/kubb/commit/98055065a6931b96dc1038890eb56ebb0342818f))

## [1.4.0](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.4.0...@kubb/core-v1.4.0) (2023-06-27)


### ✨ Features

* `client.ts` globals(declare const) can override the options set for `axios` ([b9dc851](https://github.com/kubb-project/kubb/commit/b9dc851896a5509cbf0e2f1910e4939631efa337))
* `client.ts` with the use of `process.env` override to set options for `axios` ([89c0d08](https://github.com/kubb-project/kubb/commit/89c0d08986255fd554f1d6df661b0a9a2a83847a))
* `groupBy.exportAs` to make it possible go group all import with `export * as groupBy.exportAs from "./x"` ([214ff25](https://github.com/kubb-project/kubb/commit/214ff250e8ecf23d754a456c1b9289c6475099e0))
* ✨ `swagger-form` FormGenerator and FormParser ([6424e5f](https://github.com/kubb-project/kubb/commit/6424e5f48960a24313e4ce2c115fd58af3cde814))
* ✨ add `reset.d.ts` to the `@kubb/ts-config` that can be used to override default TypeScrip types ([ae47aa5](https://github.com/kubb-project/kubb/commit/ae47aa5bbffc0f24d878e917eda3047856ca3fc7))
* ✨ useInfiniteQuery for `React`, `Solid`, `Svelte` and `Vue` ([d683cc7](https://github.com/kubb-project/kubb/commit/d683cc7909818757f62560bc1936b79bd0a79bfe))
* **swagger-cli:** option input to override input.path of `kubb.config.js` ([76443b9](https://github.com/kubb-project/kubb/commit/76443b9956d1579c88b21699505de77e3a737f19))
* use of `cac` instead of `commander` ([3814acb](https://github.com/kubb-project/kubb/commit/3814acb392f882ded2a75ef987ccdd79227a9238))
* use of `exports` for the fileManager ([e0582ee](https://github.com/kubb-project/kubb/commit/e0582eef921d10d3fc35af8a802ef2d81f790639))


### 📚 Documentation

* documentation for client and globals ([8f2b478](https://github.com/kubb-project/kubb/commit/8f2b478f91f307d7b322466bf623f9f8d192b876))
* react-hook-form + data-driven-forms example ([df538f9](https://github.com/kubb-project/kubb/commit/df538f95763976c2fe544c761b13288b62b182ef))
* update docs ([a246bb1](https://github.com/kubb-project/kubb/commit/a246bb1171a95ba9d639468c5f8214573bd33513))


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


### 🐞 Bug Fixes

* `EMFILE: too many open files` for Windows ([8c9dbce](https://github.com/kubb-project/kubb/commit/8c9dbce410430df669156b211ecae32fe17c88de))
* `path.resolve` with correct format for `Windows` ([ea7ff93](https://github.com/kubb-project/kubb/commit/ea7ff935f9be35c1899d82c1e9d2495eb92c8bcf))
* 🐛 fix: `fileManager` memory loop ([acc58dc](https://github.com/kubb-project/kubb/commit/acc58dcb40e4c320da2ceb09b3d8a1a32abed515))
* add `QueryBuilder` for Tanstack/query generators ([3c4ea57](https://github.com/kubb-project/kubb/commit/3c4ea57077a0d1c131a2f692e9f2a55c6bcec468))
* advanced queue ([e8e90b9](https://github.com/kubb-project/kubb/commit/e8e90b9cbeadad793b759a174641874dc39c2c01))
* better operationGeneration + schemas.request could be optional ([cf10b02](https://github.com/kubb-project/kubb/commit/cf10b0242761847133ebf01bae64d0bfed1334ab))
* **core:** only read in file when input is not a URL ([6ad51e0](https://github.com/kubb-project/kubb/commit/6ad51e0f5107cb7d05c07d7870a730a7258cc788))
* correct use of logging(added `stacktrace` option) ([6c89e3d](https://github.com/kubb-project/kubb/commit/6c89e3dae8b318625e3f484b1dbb259f9b14d378))
* do not include initialFile(input) in the FileManager ([0ff037d](https://github.com/kubb-project/kubb/commit/0ff037d2646a3b01fc3332048e1e70e2423bd896))
* drop of node 16 in favour of node 18 as minimum version ([f4112ef](https://github.com/kubb-project/kubb/commit/f4112efc4abc3a95e50b58a3fa925c7425d911dd))
* duplicate import names ([7a8e6fa](https://github.com/kubb-project/kubb/commit/7a8e6fa3f00e37c771b15fb0287adc1dd166acb7))
* exit code 1 with correct error handling + use of pretty-error(debug mode) ([9cbe630](https://github.com/kubb-project/kubb/commit/9cbe6303377f31cca06df6ce29a74a68cc153194))
* full debug mode for fileManager, build, pluginManager and update for Queue to include `node.js` performance ([839d636](https://github.com/kubb-project/kubb/commit/839d6362e5ab19eb893e0ac1b6b1eb82d9c6de58))
* hide meta data when `logLevel` is silent and possibility to override `logLevel` with the CLI ([d5ba5f3](https://github.com/kubb-project/kubb/commit/d5ba5f3433dc41db03f93154110e55369273be0f))
* improvements for logger used in our CLI ([9c648da](https://github.com/kubb-project/kubb/commit/9c648daef4a23c8eec3f5d2529e933cbf7d2e3d3))
* init cli ([2f79cb0](https://github.com/kubb-project/kubb/commit/2f79cb08141f924b3c3834183fbe97b197acef20))
* log stdout of hooks when logLevel is `info` ([ca885e0](https://github.com/kubb-project/kubb/commit/ca885e0393bdd1cb93bd68b8067eabf758d413d2))
* max 50 queue items per run ([c90e28f](https://github.com/kubb-project/kubb/commit/c90e28f324a98ea21f136058f5e02342d8b22a17))
* no fileManager needed for OperationGenerator + this.addFile change with multiParams ([cde8225](https://github.com/kubb-project/kubb/commit/cde8225a5207360bd17f4ede66ce2a07d5dfd53d))
* OraWritable to create a direct stream for hooks(`execa.pipeStdout`) ([0e95549](https://github.com/kubb-project/kubb/commit/0e955496e4e64e0091951eabca5849b719b60329))
* ParallelPluginError with promise.allSettled ([b1c0585](https://github.com/kubb-project/kubb/commit/b1c0585d8e650d9b5fbe105ead0040677b2546e4))
* Path and objectToParameters with paramterName in camelCase ([a446b18](https://github.com/kubb-project/kubb/commit/a446b188e5001b3597125bcfed61e454e9ed06c0))
* pluginManager with `api` config will now be an function so the `core` functionality is accessible when using `this` ([4306318](https://github.com/kubb-project/kubb/commit/43063189a1a18ed2aca23b0505d3163aeddbc2ef))
* randomColour with more options(dark mode with `bold`) ([487d59c](https://github.com/kubb-project/kubb/commit/487d59c4f25d754dc7bf9562ea1bf40334cefaaf))
* read/write with queue to not block nodejs ([b73d21f](https://github.com/kubb-project/kubb/commit/b73d21f4866fd58feb9ff05057cd74946cace495))
* remove `lodash` dependency ([8729ef8](https://github.com/kubb-project/kubb/commit/8729ef8f3f3d487b7c239f015e8321aabe17bd3b))
* remove propdrilling of directory ([99b8016](https://github.com/kubb-project/kubb/commit/99b801658a514a223e590d14f7d7729e85391ffc))
* run with a timeout and every executation will be done with our `queue` ([60e00cf](https://github.com/kubb-project/kubb/commit/60e00cf4f1dfd1628681f39959d544d8e3843a7d))
* uniqueId per plugin ([b170dd8](https://github.com/kubb-project/kubb/commit/b170dd80433852c7c7dfe462c737c8abd11f8d6d))
* use of codegen for imports and exports ([aeccdbd](https://github.com/kubb-project/kubb/commit/aeccdbdc0068ef6e99902243958f4982e8b27223))
* use of transformReservedWord and better naming for req, res and params ([5574dd1](https://github.com/kubb-project/kubb/commit/5574dd1fa597c84d03d65547cab0b819049380a3))
* warning with correct cli message(validate for swagger) ([b091e28](https://github.com/kubb-project/kubb/commit/b091e282f079e7694bf04a35ea6a0ebfd3aa06da))

### 📦 Miscellaneous Chores

* **@kubb/core:** Synchronize undefined versions

## [1.3.3](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.3.2...@kubb/core-v1.3.3) (2023-06-27)


### 📦 Miscellaneous Chores

* **@kubb/core:** Synchronize undefined versions

## [1.3.2](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.3.1...@kubb/core-v1.3.2) (2023-06-25)


### Miscellaneous Chores

* **@kubb/core:** Synchronize undefined versions

## [1.3.1](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.3.0...@kubb/core-v1.3.1) (2023-06-24)


### Miscellaneous Chores

* release 1.3.1 ([fc869d9](https://github.com/kubb-project/kubb/commit/fc869d9c1429f3b513e3ba5a8854e1bf1d1f2122))

## [1.3.0](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.2.4...@kubb/core-v1.3.0) (2023-06-23)


### Features

* ✨ useInfiniteQuery for `React`, `Solid`, `Svelte` and `Vue` ([d683cc7](https://github.com/kubb-project/kubb/commit/d683cc7909818757f62560bc1936b79bd0a79bfe))


### Bug Fixes

* advanced queue ([e8e90b9](https://github.com/kubb-project/kubb/commit/e8e90b9cbeadad793b759a174641874dc39c2c01))
* max 50 queue items per run ([c90e28f](https://github.com/kubb-project/kubb/commit/c90e28f324a98ea21f136058f5e02342d8b22a17))

## [1.2.4](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.2.3...@kubb/core-v1.2.4) (2023-06-17)


### Miscellaneous Chores

* **@kubb/core:** Synchronize undefined versions

## [1.2.3](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.2.2...@kubb/core-v1.2.3) (2023-06-17)


### Miscellaneous Chores

* **@kubb/core:** Synchronize undefined versions

## [1.2.2](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.2.1...@kubb/core-v1.2.2) (2023-06-16)


### Features

* use of `cac` instead of `commander` ([3814acb](https://github.com/kubb-project/kubb/commit/3814acb392f882ded2a75ef987ccdd79227a9238))


### Miscellaneous Chores

* release 1.2.2 ([9489c97](https://github.com/kubb-project/kubb/commit/9489c97159a0f0e755b4257cd330e11d4d648b88))

## [1.2.1](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.2.0...@kubb/core-v1.2.1) (2023-06-15)


### Bug Fixes

* 🐛 fix: `fileManager` memory loop ([acc58dc](https://github.com/kubb-project/kubb/commit/acc58dcb40e4c320da2ceb09b3d8a1a32abed515))
* correct use of logging(added `stacktrace` option) ([6c89e3d](https://github.com/kubb-project/kubb/commit/6c89e3dae8b318625e3f484b1dbb259f9b14d378))
* full debug mode for fileManager, build, pluginManager and update for Queue to include `node.js` performance ([839d636](https://github.com/kubb-project/kubb/commit/839d6362e5ab19eb893e0ac1b6b1eb82d9c6de58))
* pluginManager with `api` config will now be an function so the `core` functionality is accessible when using `this` ([4306318](https://github.com/kubb-project/kubb/commit/43063189a1a18ed2aca23b0505d3163aeddbc2ef))
* randomColour with more options(dark mode with `bold`) ([487d59c](https://github.com/kubb-project/kubb/commit/487d59c4f25d754dc7bf9562ea1bf40334cefaaf))
* run with a timeout and every executation will be done with our `queue` ([60e00cf](https://github.com/kubb-project/kubb/commit/60e00cf4f1dfd1628681f39959d544d8e3843a7d))

## [1.2.0](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.1.13...@kubb/core-v1.2.0) (2023-06-14)


### Features

* `client.ts` globals(declare const) can override the options set for `axios` ([b9dc851](https://github.com/kubb-project/kubb/commit/b9dc851896a5509cbf0e2f1910e4939631efa337))
* ✨ add `reset.d.ts` to the `@kubb/ts-config` that can be used to override default TypeScrip types ([ae47aa5](https://github.com/kubb-project/kubb/commit/ae47aa5bbffc0f24d878e917eda3047856ca3fc7))


### Bug Fixes

* improvements for logger used in our CLI ([9c648da](https://github.com/kubb-project/kubb/commit/9c648daef4a23c8eec3f5d2529e933cbf7d2e3d3))
* warning with correct cli message(validate for swagger) ([b091e28](https://github.com/kubb-project/kubb/commit/b091e282f079e7694bf04a35ea6a0ebfd3aa06da))

## [1.1.13](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.1.12...@kubb/core-v1.1.13) (2023-06-13)


### Bug Fixes

* read/write with queue to not block nodejs ([b73d21f](https://github.com/kubb-project/kubb/commit/b73d21f4866fd58feb9ff05057cd74946cace495))

## [1.1.12](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.1.11...@kubb/core-v1.1.12) (2023-06-13)


### Miscellaneous Chores

* **@kubb/core:** Synchronize undefined versions

## [1.1.11](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.1.10...@kubb/core-v1.1.11) (2023-06-12)


### Bug Fixes

* OraWritable to create a direct stream for hooks(`execa.pipeStdout`) ([0e95549](https://github.com/kubb-project/kubb/commit/0e955496e4e64e0091951eabca5849b719b60329))

## [1.1.10](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.1.9...@kubb/core-v1.1.10) (2023-06-12)


### Miscellaneous Chores

* **@kubb/core:** Synchronize undefined versions

## [1.1.9](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.1.8...@kubb/core-v1.1.9) (2023-06-11)


### Bug Fixes

* `EMFILE: too many open files` for Windows ([8c9dbce](https://github.com/kubb-project/kubb/commit/8c9dbce410430df669156b211ecae32fe17c88de))
* `path.resolve` with correct format for `Windows` ([ea7ff93](https://github.com/kubb-project/kubb/commit/ea7ff935f9be35c1899d82c1e9d2495eb92c8bcf))

## [1.1.8](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.1.7...@kubb/core-v1.1.8) (2023-06-10)


### Bug Fixes

* remove `lodash` dependency ([8729ef8](https://github.com/kubb-project/kubb/commit/8729ef8f3f3d487b7c239f015e8321aabe17bd3b))

## [1.1.7](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.1.6...@kubb/core-v1.1.7) (2023-06-08)


### Miscellaneous Chores

* **@kubb/core:** Synchronize undefined versions

## [1.1.6](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.1.5...@kubb/core-v1.1.6) (2023-06-08)


### Bug Fixes

* drop of node 16 in favour of node 18 as minimum version ([f4112ef](https://github.com/kubb-project/kubb/commit/f4112efc4abc3a95e50b58a3fa925c7425d911dd))

## [1.1.5](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.1.4...@kubb/core-v1.1.5) (2023-06-07)


### Miscellaneous Chores

* **@kubb/core:** Synchronize undefined versions

## [1.1.4](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.1.3...@kubb/core-v1.1.4) (2023-06-07)


### Bug Fixes

* init cli ([2f79cb0](https://github.com/kubb-project/kubb/commit/2f79cb08141f924b3c3834183fbe97b197acef20))

## [1.1.3](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.1.2...@kubb/core-v1.1.3) (2023-06-06)


### Bug Fixes

* hide meta data when `logLevel` is silent and possibility to override `logLevel` with the CLI ([d5ba5f3](https://github.com/kubb-project/kubb/commit/d5ba5f3433dc41db03f93154110e55369273be0f))

## [1.1.2](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.1.1...@kubb/core-v1.1.2) (2023-06-06)


### Miscellaneous Chores

* **@kubb/core:** Synchronize undefined versions

## [1.1.1](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.1.0...@kubb/core-v1.1.1) (2023-06-06)


### Miscellaneous Chores

* **@kubb/core:** Synchronize undefined versions

## [1.1.0](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.0.3...@kubb/core-v1.1.0) (2023-06-05)


### Bug Fixes

* Path and objectToParameters with paramterName in camelCase ([a446b18](https://github.com/kubb-project/kubb/commit/a446b188e5001b3597125bcfed61e454e9ed06c0))


### Miscellaneous Chores

* release 1.1.0 ([93ebdf1](https://github.com/kubb-project/kubb/commit/93ebdf116d63f022cacb8276de30d778df225ce5))

## [1.0.3](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.0.2...@kubb/core-v1.0.3) (2023-06-05)


### Bug Fixes

* log stdout of hooks when logLevel is `info` ([ca885e0](https://github.com/kubb-project/kubb/commit/ca885e0393bdd1cb93bd68b8067eabf758d413d2))

## [1.0.2](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.0.1...@kubb/core-v1.0.2) (2023-06-05)


### Bug Fixes

* **core:** only read in file when input is not a URL ([6ad51e0](https://github.com/kubb-project/kubb/commit/6ad51e0f5107cb7d05c07d7870a730a7258cc788))

## [1.0.1](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.0.0...@kubb/core-v1.0.1) (2023-06-05)


### Features

* **swagger-cli:** option input to override input.path of `kubb.config.js` ([76443b9](https://github.com/kubb-project/kubb/commit/76443b9956d1579c88b21699505de77e3a737f19))


### Bug Fixes

* exit code 1 with correct error handling + use of pretty-error(debug mode) ([9cbe630](https://github.com/kubb-project/kubb/commit/9cbe6303377f31cca06df6ce29a74a68cc153194))
* ParallelPluginError with promise.allSettled ([b1c0585](https://github.com/kubb-project/kubb/commit/b1c0585d8e650d9b5fbe105ead0040677b2546e4))


### Miscellaneous Chores

* release 1.0.1 ([8d62c91](https://github.com/kubb-project/kubb/commit/8d62c9117643b5cce9a75978a698adc6d76e1cf8))

## [1.0.0](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.0.0-beta.19...@kubb/core-v1.0.0) (2023-06-02)


### Miscellaneous Chores

* release 1.0.0 ([4009e28](https://github.com/kubb-project/kubb/commit/4009e283a93be87ff21562c6b59299ca3cfa73f8))
