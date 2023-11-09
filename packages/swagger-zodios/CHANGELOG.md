# Changelog

## [1.14.3](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.14.8...@kubb/swagger-zodios-v1.14.3) (2023-11-09)


### 📚 Documentation

* update docs with examples ([9087387](https://github.com/kubb-project/kubb/commit/908738795b2c1a3612dbc556b957f41c62465dc2))


### 📦 Miscellaneous Chores

* release 1.14.2 ([91e61ac](https://github.com/kubb-project/kubb/commit/91e61acde1c3824c40f291e1142363eaa95fb1cf))
* release 1.14.3 ([695f324](https://github.com/kubb-project/kubb/commit/695f3242d61ac13f4284f3bdf529a3bc0e353244))

## [1.14.8](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.14.7...@kubb/swagger-zodios-v1.14.8) (2023-11-09)


### 📚 Documentation

* update docs with examples ([9087387](https://github.com/kubb-project/kubb/commit/908738795b2c1a3612dbc556b957f41c62465dc2))


### 📦 Miscellaneous Chores

* release 1.14.2 ([91e61ac](https://github.com/kubb-project/kubb/commit/91e61acde1c3824c40f291e1142363eaa95fb1cf))
* release 1.14.3 ([695f324](https://github.com/kubb-project/kubb/commit/695f3242d61ac13f4284f3bdf529a3bc0e353244))

## [1.14.7](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.14.6...@kubb/swagger-zodios-v1.14.7) (2023-11-08)


### 📚 Documentation

* update docs with examples ([9087387](https://github.com/kubb-project/kubb/commit/908738795b2c1a3612dbc556b957f41c62465dc2))


### 📦 Miscellaneous Chores

* release 1.14.2 ([91e61ac](https://github.com/kubb-project/kubb/commit/91e61acde1c3824c40f291e1142363eaa95fb1cf))
* release 1.14.3 ([695f324](https://github.com/kubb-project/kubb/commit/695f3242d61ac13f4284f3bdf529a3bc0e353244))

## [1.14.6](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.14.5...@kubb/swagger-zodios-v1.14.6) (2023-10-27)


### 📦 Miscellaneous Chores

* **@kubb/swagger-zodios:** Synchronize undefined versions

## [1.14.5](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.14.4...@kubb/swagger-zodios-v1.14.5) (2023-10-26)


### ✨ Features

* &lt;File.Source/&gt; with path and print to read external file ([4bf2d9a](https://github.com/kubb-project/kubb/commit/4bf2d9a1e3023ef90be3fb28b25554d70f844ea1))
* `ClientFunction` with React for creating an axios get/post/put call ([7ef6819](https://github.com/kubb-project/kubb/commit/7ef68198c85888d76bf2949d9cc99993c1dd7fc7))
* `contentType` to override default `application/json` ([c5d50ce](https://github.com/kubb-project/kubb/commit/c5d50ce666806fe1f34684de1d542f3ac92e53fc))
* ✨ skipBy to exclude `tags`, `names`, `paths`, ... out of the generation ([44be77b](https://github.com/kubb-project/kubb/commit/44be77bb8748ae0188481716ef19dc6a39f1e538))
* use of `jsxImportSource` for a custom react-runtime being used by `@kubb/react-template` ([db8f351](https://github.com/kubb-project/kubb/commit/db8f3519ffa8dc2ede5309f0c4c8acb30bc6757e))
* use of a tranformer function to override the name of the hook/type/client ([f405183](https://github.com/kubb-project/kubb/commit/f405183b198e47e732873108956f639d94d94937))


### 🐞 Bug Fixes

* correct parameters schema for `Zodios`(use of .shape and .schema.shape) ([b162622](https://github.com/kubb-project/kubb/commit/b162622ac30a2f2f74a8e98a20c8630a52073ca7))
* multiple body parameters in endpoint ([67e9be8](https://github.com/kubb-project/kubb/commit/67e9be81c58eb07490f1c6042a8c0bc9be81640b))
* proper escape Regex(Escape all characters not included in SingleStringCharacters and DoubleStringCharacters) ([4b43cc1](https://github.com/kubb-project/kubb/commit/4b43cc169de5173eec8a760148fb4ab33d2a4eab))
* remove of `types` exports field ([1c07fd7](https://github.com/kubb-project/kubb/commit/1c07fd72424db47e3a717d99ea5019bb7744f3c0))
* remove rimraf + use of correct order for params ([03180e3](https://github.com/kubb-project/kubb/commit/03180e3d33c5dd96bb101be691ae56a2edd3f0b9))
* revert `patch` refactor ([f3596e9](https://github.com/kubb-project/kubb/commit/f3596e9fd782f30fdaabd292c173778d1f34c32c))
* skipBy improvements ([b6fd85e](https://github.com/kubb-project/kubb/commit/b6fd85eac66b3a6ecbd7d8099f374a37b17937a8))
* support for PATCH ([c326d7c](https://github.com/kubb-project/kubb/commit/c326d7cafaa2ddf258579f889f061bbdf51a96fd))
* types fix `exports` based on `https://arethetypeswrong.github.io/` ([f942def](https://github.com/kubb-project/kubb/commit/f942defb40584fdfddc94852bf751a6acf10476a))
* upgrade `oas` + custom patch for `typesVersions` ([e9e26ae](https://github.com/kubb-project/kubb/commit/e9e26ae204a2eb3b6dc1e3a391c17a5d9d64f86c))
* use of pluginsOptions and small cleanup ([15d50a5](https://github.com/kubb-project/kubb/commit/15d50a5d56f1ca8b44ef70be56fefc489eaf6d93))


### 📚 Documentation

* add tip for `module` import ([5b7e24a](https://github.com/kubb-project/kubb/commit/5b7e24a7171e644d35e6f9a49fc2e6543868ba64))
* readme update + typo's ([a1bb145](https://github.com/kubb-project/kubb/commit/a1bb14550c7d6d73832da612275ef66f65d32a02))
* swagger-msw plugin ([b8f14c1](https://github.com/kubb-project/kubb/commit/b8f14c1690bc66160936c92144a2e2b0ce227d88))
* update docs with examples ([9087387](https://github.com/kubb-project/kubb/commit/908738795b2c1a3612dbc556b957f41c62465dc2))


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

## [1.14.4](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.14.3...@kubb/swagger-zodios-v1.14.4) (2023-10-25)


### ✨ Features

* &lt;File.Source/&gt; with path and print to read external file ([4bf2d9a](https://github.com/kubb-project/kubb/commit/4bf2d9a1e3023ef90be3fb28b25554d70f844ea1))
* `ClientFunction` with React for creating an axios get/post/put call ([7ef6819](https://github.com/kubb-project/kubb/commit/7ef68198c85888d76bf2949d9cc99993c1dd7fc7))
* `contentType` to override default `application/json` ([c5d50ce](https://github.com/kubb-project/kubb/commit/c5d50ce666806fe1f34684de1d542f3ac92e53fc))
* ✨ skipBy to exclude `tags`, `names`, `paths`, ... out of the generation ([44be77b](https://github.com/kubb-project/kubb/commit/44be77bb8748ae0188481716ef19dc6a39f1e538))
* use of `jsxImportSource` for a custom react-runtime being used by `@kubb/react-template` ([db8f351](https://github.com/kubb-project/kubb/commit/db8f3519ffa8dc2ede5309f0c4c8acb30bc6757e))
* use of a tranformer function to override the name of the hook/type/client ([f405183](https://github.com/kubb-project/kubb/commit/f405183b198e47e732873108956f639d94d94937))


### 🐞 Bug Fixes

* correct parameters schema for `Zodios`(use of .shape and .schema.shape) ([b162622](https://github.com/kubb-project/kubb/commit/b162622ac30a2f2f74a8e98a20c8630a52073ca7))
* multiple body parameters in endpoint ([67e9be8](https://github.com/kubb-project/kubb/commit/67e9be81c58eb07490f1c6042a8c0bc9be81640b))
* proper escape Regex(Escape all characters not included in SingleStringCharacters and DoubleStringCharacters) ([4b43cc1](https://github.com/kubb-project/kubb/commit/4b43cc169de5173eec8a760148fb4ab33d2a4eab))
* remove of `types` exports field ([1c07fd7](https://github.com/kubb-project/kubb/commit/1c07fd72424db47e3a717d99ea5019bb7744f3c0))
* remove rimraf + use of correct order for params ([03180e3](https://github.com/kubb-project/kubb/commit/03180e3d33c5dd96bb101be691ae56a2edd3f0b9))
* revert `patch` refactor ([f3596e9](https://github.com/kubb-project/kubb/commit/f3596e9fd782f30fdaabd292c173778d1f34c32c))
* skipBy improvements ([b6fd85e](https://github.com/kubb-project/kubb/commit/b6fd85eac66b3a6ecbd7d8099f374a37b17937a8))
* support for PATCH ([c326d7c](https://github.com/kubb-project/kubb/commit/c326d7cafaa2ddf258579f889f061bbdf51a96fd))
* types fix `exports` based on `https://arethetypeswrong.github.io/` ([f942def](https://github.com/kubb-project/kubb/commit/f942defb40584fdfddc94852bf751a6acf10476a))
* upgrade `oas` + custom patch for `typesVersions` ([e9e26ae](https://github.com/kubb-project/kubb/commit/e9e26ae204a2eb3b6dc1e3a391c17a5d9d64f86c))
* use of pluginsOptions and small cleanup ([15d50a5](https://github.com/kubb-project/kubb/commit/15d50a5d56f1ca8b44ef70be56fefc489eaf6d93))


### 📚 Documentation

* add tip for `module` import ([5b7e24a](https://github.com/kubb-project/kubb/commit/5b7e24a7171e644d35e6f9a49fc2e6543868ba64))
* readme update + typo's ([a1bb145](https://github.com/kubb-project/kubb/commit/a1bb14550c7d6d73832da612275ef66f65d32a02))
* swagger-msw plugin ([b8f14c1](https://github.com/kubb-project/kubb/commit/b8f14c1690bc66160936c92144a2e2b0ce227d88))
* update docs with examples ([9087387](https://github.com/kubb-project/kubb/commit/908738795b2c1a3612dbc556b957f41c62465dc2))


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

## [1.14.3](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.14.0...@kubb/swagger-zodios-v1.14.3) (2023-10-23)


### 📦 Miscellaneous Chores

* release 1.14.2 ([91e61ac](https://github.com/kubb-project/kubb/commit/91e61acde1c3824c40f291e1142363eaa95fb1cf))
* release 1.14.3 ([695f324](https://github.com/kubb-project/kubb/commit/695f3242d61ac13f4284f3bdf529a3bc0e353244))

## [1.14.0](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.13.0...@kubb/swagger-zodios-v1.14.0) (2023-10-20)


### 📚 Documentation

* update docs with examples ([9087387](https://github.com/kubb-project/kubb/commit/908738795b2c1a3612dbc556b957f41c62465dc2))

## [1.13.0](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.12.0...@kubb/swagger-zodios-v1.13.0) (2023-10-18)


### 📦 Miscellaneous Chores

* **@kubb/swagger-zodios:** Synchronize undefined versions

## [1.12.0](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.11.6...@kubb/swagger-zodios-v1.12.0) (2023-10-18)


### 📦 Miscellaneous Chores

* **@kubb/swagger-zodios:** Synchronize undefined versions

## [1.11.6](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.11.5...@kubb/swagger-zodios-v1.11.6) (2023-10-16)


### 📦 Miscellaneous Chores

* release 1.11.6 ([70826b2](https://github.com/kubb-project/kubb/commit/70826b2d52d970b16a7f00a8c63f95354699df7c))

## [1.11.5](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.11.4...@kubb/swagger-zodios-v1.11.5) (2023-10-16)


### 📦 Miscellaneous Chores

* **@kubb/swagger-zodios:** Synchronize undefined versions

## [1.11.4](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.11.3...@kubb/swagger-zodios-v1.11.4) (2023-10-16)


### 🐞 Bug Fixes

* multiple body parameters in endpoint ([67e9be8](https://github.com/kubb-project/kubb/commit/67e9be81c58eb07490f1c6042a8c0bc9be81640b))

## [1.11.3](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.11.2...@kubb/swagger-zodios-v1.11.3) (2023-10-14)


### 🐞 Bug Fixes

* correct parameters schema for `Zodios`(use of .shape and .schema.shape) ([b162622](https://github.com/kubb-project/kubb/commit/b162622ac30a2f2f74a8e98a20c8630a52073ca7))

## [1.11.2](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.11.1...@kubb/swagger-zodios-v1.11.2) (2023-10-13)


### 🐞 Bug Fixes

* remove of `types` exports field ([1c07fd7](https://github.com/kubb-project/kubb/commit/1c07fd72424db47e3a717d99ea5019bb7744f3c0))

## [1.11.1](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.11.0...@kubb/swagger-zodios-v1.11.1) (2023-10-12)


### 📦 Miscellaneous Chores

* **@kubb/swagger-zodios:** Synchronize undefined versions

## [1.11.0](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.10.4...@kubb/swagger-zodios-v1.11.0) (2023-10-11)


### 🐞 Bug Fixes

* upgrade `oas` + custom patch for `typesVersions` ([e9e26ae](https://github.com/kubb-project/kubb/commit/e9e26ae204a2eb3b6dc1e3a391c17a5d9d64f86c))


### ✨ Features

* use of `jsxImportSource` for a custom react-runtime being used by `@kubb/react-template` ([db8f351](https://github.com/kubb-project/kubb/commit/db8f3519ffa8dc2ede5309f0c4c8acb30bc6757e))

## [1.10.4](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.10.3...@kubb/swagger-zodios-v1.10.4) (2023-10-10)


### 📦 Miscellaneous Chores

* release 1.10.4 ([e2607b3](https://github.com/kubb-project/kubb/commit/e2607b3499ea9c810b508456b4e0ad5841a27347))

## [1.10.3](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.10.2...@kubb/swagger-zodios-v1.10.3) (2023-10-10)


### 📦 Miscellaneous Chores

* **@kubb/swagger-zodios:** Synchronize undefined versions

## [1.10.2](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.10.1...@kubb/swagger-zodios-v1.10.2) (2023-10-10)


### 📦 Miscellaneous Chores

* **@kubb/swagger-zodios:** Synchronize undefined versions

## [1.10.1](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.10.0...@kubb/swagger-zodios-v1.10.1) (2023-10-10)


### 📦 Miscellaneous Chores

* **@kubb/swagger-zodios:** Synchronize undefined versions

## [1.10.0](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.9.5...@kubb/swagger-zodios-v1.10.0) (2023-10-08)


### ✨ Features

* `ClientFunction` with React for creating an axios get/post/put call ([7ef6819](https://github.com/kubb-project/kubb/commit/7ef68198c85888d76bf2949d9cc99993c1dd7fc7))

## [1.9.5](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.9.4...@kubb/swagger-zodios-v1.9.5) (2023-10-06)


### 📦 Miscellaneous Chores

* **@kubb/swagger-zodios:** Synchronize undefined versions

## [1.9.4](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.9.3...@kubb/swagger-zodios-v1.9.4) (2023-09-29)


### 📦 Miscellaneous Chores

* **@kubb/swagger-zodios:** Synchronize undefined versions

## [1.9.3](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.9.2...@kubb/swagger-zodios-v1.9.3) (2023-09-28)


### 📦 Miscellaneous Chores

* **@kubb/swagger-zodios:** Synchronize undefined versions

## [1.9.2](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.9.1...@kubb/swagger-zodios-v1.9.2) (2023-09-27)


### 🐞 Bug Fixes

* proper escape Regex(Escape all characters not included in SingleStringCharacters and DoubleStringCharacters) ([4b43cc1](https://github.com/kubb-project/kubb/commit/4b43cc169de5173eec8a760148fb4ab33d2a4eab))

## [1.9.1](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.9.0...@kubb/swagger-zodios-v1.9.1) (2023-09-22)


### 🐞 Bug Fixes

* remove rimraf + use of correct order for params ([03180e3](https://github.com/kubb-project/kubb/commit/03180e3d33c5dd96bb101be691ae56a2edd3f0b9))

## [1.9.0](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.8.5...@kubb/swagger-zodios-v1.9.0) (2023-09-22)


### 📦 Miscellaneous Chores

* **@kubb/swagger-zodios:** Synchronize undefined versions

## [1.8.5](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.8.4...@kubb/swagger-zodios-v1.8.5) (2023-09-13)


### 📦 Miscellaneous Chores

* **@kubb/swagger-zodios:** Synchronize undefined versions

## [1.8.4](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.8.3...@kubb/swagger-zodios-v1.8.4) (2023-09-13)


### 🐞 Bug Fixes

* revert `patch` refactor ([f3596e9](https://github.com/kubb-project/kubb/commit/f3596e9fd782f30fdaabd292c173778d1f34c32c))

## [1.8.3](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.8.2...@kubb/swagger-zodios-v1.8.3) (2023-09-12)


### 📚 Documentation

* readme update + typo's ([a1bb145](https://github.com/kubb-project/kubb/commit/a1bb14550c7d6d73832da612275ef66f65d32a02))

## [1.8.2](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.8.1...@kubb/swagger-zodios-v1.8.2) (2023-09-11)


### 🐞 Bug Fixes

* use of pluginsOptions and small cleanup ([15d50a5](https://github.com/kubb-project/kubb/commit/15d50a5d56f1ca8b44ef70be56fefc489eaf6d93))

## [1.8.1](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.8.0...@kubb/swagger-zodios-v1.8.1) (2023-09-10)


### 🐞 Bug Fixes

* skipBy improvements ([b6fd85e](https://github.com/kubb-project/kubb/commit/b6fd85eac66b3a6ecbd7d8099f374a37b17937a8))

## [1.8.0](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.7.3...@kubb/swagger-zodios-v1.8.0) (2023-09-10)


### 📚 Documentation

* swagger-msw plugin ([b8f14c1](https://github.com/kubb-project/kubb/commit/b8f14c1690bc66160936c92144a2e2b0ce227d88))


### 📦 Miscellaneous Chores

* release 1.8.0 ([218b7f0](https://github.com/kubb-project/kubb/commit/218b7f0e8ec1cbc8b6db504ec6e06d8dbeb1109e))

## [1.7.3](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.7.2...@kubb/swagger-zodios-v1.7.3) (2023-09-09)


### 📦 Miscellaneous Chores

* **@kubb/swagger-zodios:** Synchronize undefined versions

## [1.7.2](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.7.1...@kubb/swagger-zodios-v1.7.2) (2023-09-08)


### 📦 Miscellaneous Chores

* **@kubb/swagger-zodios:** Synchronize undefined versions

## [1.7.1](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.7.0...@kubb/swagger-zodios-v1.7.1) (2023-09-06)


### 📦 Miscellaneous Chores

* **@kubb/swagger-zodios:** Synchronize undefined versions

## [1.7.0](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.6.3...@kubb/swagger-zodios-v1.7.0) (2023-09-05)


### 📦 Miscellaneous Chores

* **@kubb/swagger-zodios:** Synchronize undefined versions

## [1.6.3](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.6.2...@kubb/swagger-zodios-v1.6.3) (2023-09-03)


### 📦 Miscellaneous Chores

* **@kubb/swagger-zodios:** Synchronize undefined versions

## [1.6.2](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.6.1...@kubb/swagger-zodios-v1.6.2) (2023-09-02)


### 🐞 Bug Fixes

* support for PATCH ([c326d7c](https://github.com/kubb-project/kubb/commit/c326d7cafaa2ddf258579f889f061bbdf51a96fd))

## [1.6.1](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.6.0...@kubb/swagger-zodios-v1.6.1) (2023-08-29)


### 📦 Miscellaneous Chores

* **@kubb/swagger-zodios:** Synchronize undefined versions

## [1.6.0](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.5.5...@kubb/swagger-zodios-v1.6.0) (2023-08-25)


### ✨ Features

* use of a tranformer function to override the name of the hook/type/client ([f405183](https://github.com/kubb-project/kubb/commit/f405183b198e47e732873108956f639d94d94937))

## [1.5.5](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.5.4...@kubb/swagger-zodios-v1.5.5) (2023-08-11)


### 📚 Documentation

* add tip for `module` import ([5b7e24a](https://github.com/kubb-project/kubb/commit/5b7e24a7171e644d35e6f9a49fc2e6543868ba64))

## [1.5.4](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.5.3...@kubb/swagger-zodios-v1.5.4) (2023-07-28)


### 📦 Miscellaneous Chores

* **@kubb/swagger-zodios:** Synchronize undefined versions

## [1.5.3](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.5.2...@kubb/swagger-zodios-v1.5.3) (2023-07-27)


### 📦 Miscellaneous Chores

* **@kubb/swagger-zodios:** Synchronize undefined versions

## [1.5.2](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.5.1...@kubb/swagger-zodios-v1.5.2) (2023-07-08)


### 📦 Miscellaneous Chores

* release 1.5.2 ([2f49c97](https://github.com/kubb-project/kubb/commit/2f49c97863b3dcee1a6158d97a5ca66848d52261))

## [1.5.1](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.5.0...@kubb/swagger-zodios-v1.5.1) (2023-07-08)


### 📦 Miscellaneous Chores

* **@kubb/swagger-zodios:** Synchronize undefined versions

## [1.5.0](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.4.2...@kubb/swagger-zodios-v1.5.0) (2023-07-05)


### ✨ Features

* ✨ skipBy to exclude `tags`, `names`, `paths`, ... out of the generation ([44be77b](https://github.com/kubb-project/kubb/commit/44be77bb8748ae0188481716ef19dc6a39f1e538))

## [1.4.2](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.4.1...@kubb/swagger-zodios-v1.4.2) (2023-06-28)


### 🐞 Bug Fixes

* types fix `exports` based on `https://arethetypeswrong.github.io/` ([f942def](https://github.com/kubb-project/kubb/commit/f942defb40584fdfddc94852bf751a6acf10476a))

## [1.4.1](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.4.0...@kubb/swagger-zodios-v1.4.1) (2023-06-27)


### 📦 Miscellaneous Chores

* release 1.4.1 ([9805506](https://github.com/kubb-project/kubb/commit/98055065a6931b96dc1038890eb56ebb0342818f))

## [1.4.0](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.4.0...@kubb/swagger-zodios-v1.4.0) (2023-06-27)


### 📚 Documentation

* documentation for client and globals ([8f2b478](https://github.com/kubb-project/kubb/commit/8f2b478f91f307d7b322466bf623f9f8d192b876))


### 🐞 Bug Fixes

* drop of node 16 in favour of node 18 as minimum version ([f4112ef](https://github.com/kubb-project/kubb/commit/f4112efc4abc3a95e50b58a3fa925c7425d911dd))
* init cli ([2f79cb0](https://github.com/kubb-project/kubb/commit/2f79cb08141f924b3c3834183fbe97b197acef20))
* no fileManager needed for OperationGenerator + this.addFile change with multiParams ([cde8225](https://github.com/kubb-project/kubb/commit/cde8225a5207360bd17f4ede66ce2a07d5dfd53d))
* pluginManager with `api` config will now be an function so the `core` functionality is accessible when using `this` ([4306318](https://github.com/kubb-project/kubb/commit/43063189a1a18ed2aca23b0505d3163aeddbc2ef))
* remove propdrilling of directory ([99b8016](https://github.com/kubb-project/kubb/commit/99b801658a514a223e590d14f7d7729e85391ffc))
* resolvePath and resolveName sync ([935ca2a](https://github.com/kubb-project/kubb/commit/935ca2a137006d9a59ef276e16f54770391b0a42))
* use of camelCaseTransformMerge for every camelcase transform ([69f77ec](https://github.com/kubb-project/kubb/commit/69f77ecb45d62c14cb5ec7724cc64c9fe63a2365))
* use of transformReservedWord and better naming for req, res and params ([5574dd1](https://github.com/kubb-project/kubb/commit/5574dd1fa597c84d03d65547cab0b819049380a3))


### ✨ Features

* `client.ts` with the use of `process.env` override to set options for `axios` ([89c0d08](https://github.com/kubb-project/kubb/commit/89c0d08986255fd554f1d6df661b0a9a2a83847a))
* ✨ add `reset.d.ts` to the `@kubb/ts-config` that can be used to override default TypeScrip types ([ae47aa5](https://github.com/kubb-project/kubb/commit/ae47aa5bbffc0f24d878e917eda3047856ca3fc7))
* use of `cac` instead of `commander` ([3814acb](https://github.com/kubb-project/kubb/commit/3814acb392f882ded2a75ef987ccdd79227a9238))
* use of `exports` for the fileManager ([e0582ee](https://github.com/kubb-project/kubb/commit/e0582eef921d10d3fc35af8a802ef2d81f790639))


### 📦 Miscellaneous Chores

* release 1.0.0 ([4009e28](https://github.com/kubb-project/kubb/commit/4009e283a93be87ff21562c6b59299ca3cfa73f8))
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

## [1.4.0](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.4.0...@kubb/swagger-zodios-v1.4.0) (2023-06-27)


### 📚 Documentation

* documentation for client and globals ([8f2b478](https://github.com/kubb-project/kubb/commit/8f2b478f91f307d7b322466bf623f9f8d192b876))


### 🐞 Bug Fixes

* drop of node 16 in favour of node 18 as minimum version ([f4112ef](https://github.com/kubb-project/kubb/commit/f4112efc4abc3a95e50b58a3fa925c7425d911dd))
* init cli ([2f79cb0](https://github.com/kubb-project/kubb/commit/2f79cb08141f924b3c3834183fbe97b197acef20))
* no fileManager needed for OperationGenerator + this.addFile change with multiParams ([cde8225](https://github.com/kubb-project/kubb/commit/cde8225a5207360bd17f4ede66ce2a07d5dfd53d))
* pluginManager with `api` config will now be an function so the `core` functionality is accessible when using `this` ([4306318](https://github.com/kubb-project/kubb/commit/43063189a1a18ed2aca23b0505d3163aeddbc2ef))
* remove propdrilling of directory ([99b8016](https://github.com/kubb-project/kubb/commit/99b801658a514a223e590d14f7d7729e85391ffc))
* resolvePath and resolveName sync ([935ca2a](https://github.com/kubb-project/kubb/commit/935ca2a137006d9a59ef276e16f54770391b0a42))
* use of camelCaseTransformMerge for every camelcase transform ([69f77ec](https://github.com/kubb-project/kubb/commit/69f77ecb45d62c14cb5ec7724cc64c9fe63a2365))
* use of transformReservedWord and better naming for req, res and params ([5574dd1](https://github.com/kubb-project/kubb/commit/5574dd1fa597c84d03d65547cab0b819049380a3))


### ✨ Features

* `client.ts` with the use of `process.env` override to set options for `axios` ([89c0d08](https://github.com/kubb-project/kubb/commit/89c0d08986255fd554f1d6df661b0a9a2a83847a))
* ✨ add `reset.d.ts` to the `@kubb/ts-config` that can be used to override default TypeScrip types ([ae47aa5](https://github.com/kubb-project/kubb/commit/ae47aa5bbffc0f24d878e917eda3047856ca3fc7))
* use of `cac` instead of `commander` ([3814acb](https://github.com/kubb-project/kubb/commit/3814acb392f882ded2a75ef987ccdd79227a9238))
* use of `exports` for the fileManager ([e0582ee](https://github.com/kubb-project/kubb/commit/e0582eef921d10d3fc35af8a802ef2d81f790639))


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

* **@kubb/swagger-zodios:** Synchronize undefined versions

## [1.3.3](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.3.2...@kubb/swagger-zodios-v1.3.3) (2023-06-27)


### 📦 Miscellaneous Chores

* **@kubb/swagger-zodios:** Synchronize undefined versions

## [1.3.2](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.3.1...@kubb/swagger-zodios-v1.3.2) (2023-06-25)


### Miscellaneous Chores

* **@kubb/swagger-zodios:** Synchronize undefined versions

## [1.3.1](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.3.0...@kubb/swagger-zodios-v1.3.1) (2023-06-24)


### Miscellaneous Chores

* release 1.3.1 ([fc869d9](https://github.com/kubb-project/kubb/commit/fc869d9c1429f3b513e3ba5a8854e1bf1d1f2122))

## [1.3.0](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.2.4...@kubb/swagger-zodios-v1.3.0) (2023-06-23)


### Miscellaneous Chores

* **@kubb/swagger-zodios:** Synchronize undefined versions

## [1.2.4](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.2.3...@kubb/swagger-zodios-v1.2.4) (2023-06-17)


### Miscellaneous Chores

* **@kubb/swagger-zodios:** Synchronize undefined versions

## [1.2.3](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.2.2...@kubb/swagger-zodios-v1.2.3) (2023-06-17)


### Miscellaneous Chores

* **@kubb/swagger-zodios:** Synchronize undefined versions

## [1.2.2](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.2.1...@kubb/swagger-zodios-v1.2.2) (2023-06-16)


### Features

* use of `cac` instead of `commander` ([3814acb](https://github.com/kubb-project/kubb/commit/3814acb392f882ded2a75ef987ccdd79227a9238))


### Miscellaneous Chores

* release 1.2.2 ([9489c97](https://github.com/kubb-project/kubb/commit/9489c97159a0f0e755b4257cd330e11d4d648b88))

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
