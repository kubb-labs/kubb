# Changelog

## [1.14.3](https://github.com/kubb-project/kubb/compare/kubb_monorepo-v1.14.5...kubb_monorepo-v1.14.3) (2023-10-27)


### ⚠ BREAKING CHANGES

* prepare 2.0.0 beta

### 🐞 Bug Fixes

* add `as QueryKey` cast for `@tanstack/react-query` v5 ([67a3073](https://github.com/kubb-project/kubb/commit/67a30731713b2f1a047f0cd72f728db752322305))
* better logger + `writeTimeout` ([29badba](https://github.com/kubb-project/kubb/commit/29badba4c0b08dcc403d3c4f796f513821e29881))
* better types for plugin `api` ([a4303b7](https://github.com/kubb-project/kubb/commit/a4303b7b102d871f514649f2edb4fb9058d6564d))
* better types for PluginFactoryOptions and `KubbPlugin` ([3fb7bdd](https://github.com/kubb-project/kubb/commit/3fb7bdd7b612373c55597705037eab9fdc8202ee))
* do not use the queue for writing to the file-system + check if a plugin is already writing ([2edce86](https://github.com/kubb-project/kubb/commit/2edce86e27787a809b0473426e3054ad3bb9aab5))
* remove JSON format for plugins with that it was not in use anymore(no docs were added) ([cdc5bec](https://github.com/kubb-project/kubb/commit/cdc5bec5371bede1d974f3ee30b9d02fa7b0008a))
* replace 'importModule' by 'PackageManager' ([f66065a](https://github.com/kubb-project/kubb/commit/f66065af900041eae6c26f301abaeef25d69157b))
* use of `fileManager.addIndexes` and `URLPath` without static functions ([9bc291d](https://github.com/kubb-project/kubb/commit/9bc291d5b9126b1d3f26803e6a1c54a3b008f634))


### 📦 Miscellaneous Chores

* release 1.14.2 ([91e61ac](https://github.com/kubb-project/kubb/commit/91e61acde1c3824c40f291e1142363eaa95fb1cf))
* release 1.14.3 ([695f324](https://github.com/kubb-project/kubb/commit/695f3242d61ac13f4284f3bdf529a3bc0e353244))


### 📚 Documentation

* add documentation for `name` ([c043531](https://github.com/kubb-project/kubb/commit/c0435315263ef0ba63e05504e2aa82e7a34d212d))
* add helt as a contributor for code ([#560](https://github.com/kubb-project/kubb/issues/560)) ([6f88169](https://github.com/kubb-project/kubb/commit/6f88169e464ffa7caa12d92514c989754b4df9f4))
* add installation page with environments for node and typescript ([2aef090](https://github.com/kubb-project/kubb/commit/2aef090477d529b04c868f595cb5796f6a51b39a))
* add sponsor ([1d5c31a](https://github.com/kubb-project/kubb/commit/1d5c31a63bbec5ae1eede9f597421b3f3e345e56))
* better docs with examples ([fb42958](https://github.com/kubb-project/kubb/commit/fb429588f213a0ec7973fd64aa24eea17529747a))
* swagger-msw docs update ([562c5b1](https://github.com/kubb-project/kubb/commit/562c5b10fda5ea8e8cb2605b0942f49150c5b577))
* update docs ([97bbf62](https://github.com/kubb-project/kubb/commit/97bbf62331103f1c5fd8c90372e42b8a3d78dc8b))
* update docs with example for multiple plugins ([853d154](https://github.com/kubb-project/kubb/commit/853d1548979d1ebf82393ee0bafa37292d65b767))
* update docs with examples ([9087387](https://github.com/kubb-project/kubb/commit/908738795b2c1a3612dbc556b957f41c62465dc2))
* update docs with extra examples ([76117ff](https://github.com/kubb-project/kubb/commit/76117ff13abc16ff981fc0184206735063d922be))
* update tanstack labels ([03a0ea9](https://github.com/kubb-project/kubb/commit/03a0ea90f63d1e45723d4d2c7072bcccd45be7e9))


### ✨ Features

* `overrideBy` to specify different options per `operationId | tag | path | method` ([ebb3db1](https://github.com/kubb-project/kubb/commit/ebb3db14c3796ea5211a49ccded5544ee54ad66c))
* make it possible to use multiple of the same plugins ([91e5f76](https://github.com/kubb-project/kubb/commit/91e5f76ecd70d82be1d2855046a9cc97fcf9d7e9))
* multiple `KubbUserConfig`s for `defineConfig` instead of need to use multiple `kubb.config.js` files ([9316c9d](https://github.com/kubb-project/kubb/commit/9316c9da0eb344b0bb58b4efadf859ae89993a46))
* prepare 2.0.0 beta ([6896e75](https://github.com/kubb-project/kubb/commit/6896e756f83114e9d87602bd6f776bb47232a8f2))
* support for `msw` v2 ([#543](https://github.com/kubb-project/kubb/issues/543)) ([89043da](https://github.com/kubb-project/kubb/commit/89043dac2acd5a2ec03563bd889c595e75cd538e))
