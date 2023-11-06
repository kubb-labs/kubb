# Changelog

## [2.1.0-alpha.4](https://github.com/kubb-project/kubb/compare/@kubb/core-v2.0.0-alpha.4...@kubb/core-v2.1.0-alpha.4) (2023-11-06)


### 🐞 Bug Fixes

* add `/index` to folders ([f887146](https://github.com/kubb-project/kubb/commit/f88714633e71266b51781729cf4c617145e54798))
* better logger + `writeTimeout` ([29badba](https://github.com/kubb-project/kubb/commit/29badba4c0b08dcc403d3c4f796f513821e29881))
* do not use the queue for writing to the file-system + check if a plugin is already writing ([2edce86](https://github.com/kubb-project/kubb/commit/2edce86e27787a809b0473426e3054ad3bb9aab5))
* remove JSON format for plugins with that it was not in use anymore(no docs were added) ([cdc5bec](https://github.com/kubb-project/kubb/commit/cdc5bec5371bede1d974f3ee30b9d02fa7b0008a))


### 📦 Miscellaneous Chores

* release 1.14.2 ([91e61ac](https://github.com/kubb-project/kubb/commit/91e61acde1c3824c40f291e1142363eaa95fb1cf))
* release 1.14.3 ([695f324](https://github.com/kubb-project/kubb/commit/695f3242d61ac13f4284f3bdf529a3bc0e353244))
* release 2.0.0-alpha.1 ([925bf68](https://github.com/kubb-project/kubb/commit/925bf686956804aad82ba6480152427aaa6ad4f8))
* release 2.0.0-alpha.2 ([c0abf54](https://github.com/kubb-project/kubb/commit/c0abf54220849007e354f594267cd69086c38b07))
* release 2.0.0-alpha.3 ([3175248](https://github.com/kubb-project/kubb/commit/3175248895d3def0e32fbf87a7ffa45c0c859b68))
* release 2.0.0-alpha.4 ([36f790a](https://github.com/kubb-project/kubb/commit/36f790a8260ce0842ca64852590e59f2c661367c))


### ✨ Features

* `@kubb/types` package ([1d11f32](https://github.com/kubb-project/kubb/commit/1d11f32d846c2da3c74471cb40e76955ae45cb44))
* multiple `KubbUserConfig`s for `defineConfig` instead of need to use multiple `kubb.config.js` files ([9316c9d](https://github.com/kubb-project/kubb/commit/9316c9da0eb344b0bb58b4efadf859ae89993a46))

## [2.0.0-alpha.4](https://github.com/kubb-project/kubb/compare/@kubb/core-v2.0.0-alpha.3...@kubb/core-v2.0.0-alpha.4) (2023-11-05)


### ✨ Features

* make it possible to use multiple of the same plugins ([91e5f76](https://github.com/kubb-project/kubb/commit/91e5f76ecd70d82be1d2855046a9cc97fcf9d7e9))
* multiple `KubbUserConfig`s for `defineConfig` instead of need to use multiple `kubb.config.js` files ([9316c9d](https://github.com/kubb-project/kubb/commit/9316c9da0eb344b0bb58b4efadf859ae89993a46))


### 🐞 Bug Fixes

* add `/index` to folders ([f887146](https://github.com/kubb-project/kubb/commit/f88714633e71266b51781729cf4c617145e54798))
* better logger + `writeTimeout` ([29badba](https://github.com/kubb-project/kubb/commit/29badba4c0b08dcc403d3c4f796f513821e29881))
* better types for plugin `api` ([a4303b7](https://github.com/kubb-project/kubb/commit/a4303b7b102d871f514649f2edb4fb9058d6564d))
* better types for PluginFactoryOptions and `KubbPlugin` ([3fb7bdd](https://github.com/kubb-project/kubb/commit/3fb7bdd7b612373c55597705037eab9fdc8202ee))
* do not use the queue for writing to the file-system + check if a plugin is already writing ([2edce86](https://github.com/kubb-project/kubb/commit/2edce86e27787a809b0473426e3054ad3bb9aab5))
* remove JSON format for plugins with that it was not in use anymore(no docs were added) ([cdc5bec](https://github.com/kubb-project/kubb/commit/cdc5bec5371bede1d974f3ee30b9d02fa7b0008a))
* use of `fileManager.addIndexes` and `URLPath` without static functions ([9bc291d](https://github.com/kubb-project/kubb/commit/9bc291d5b9126b1d3f26803e6a1c54a3b008f634))


### 📦 Miscellaneous Chores

* release 1.14.2 ([91e61ac](https://github.com/kubb-project/kubb/commit/91e61acde1c3824c40f291e1142363eaa95fb1cf))
* release 1.14.3 ([695f324](https://github.com/kubb-project/kubb/commit/695f3242d61ac13f4284f3bdf529a3bc0e353244))
* release 2.0.0-alpha.1 ([925bf68](https://github.com/kubb-project/kubb/commit/925bf686956804aad82ba6480152427aaa6ad4f8))
* release 2.0.0-alpha.2 ([c0abf54](https://github.com/kubb-project/kubb/commit/c0abf54220849007e354f594267cd69086c38b07))
* release 2.0.0-alpha.3 ([3175248](https://github.com/kubb-project/kubb/commit/3175248895d3def0e32fbf87a7ffa45c0c859b68))
* release 2.0.0-alpha.4 ([36f790a](https://github.com/kubb-project/kubb/commit/36f790a8260ce0842ca64852590e59f2c661367c))

## [2.0.0-alpha.3](https://github.com/kubb-project/kubb/compare/@kubb/core-v2.0.0-alpha.2...@kubb/core-v2.0.0-alpha.3) (2023-11-02)


### ✨ Features

* make it possible to use multiple of the same plugins ([91e5f76](https://github.com/kubb-project/kubb/commit/91e5f76ecd70d82be1d2855046a9cc97fcf9d7e9))
* multiple `KubbUserConfig`s for `defineConfig` instead of need to use multiple `kubb.config.js` files ([9316c9d](https://github.com/kubb-project/kubb/commit/9316c9da0eb344b0bb58b4efadf859ae89993a46))


### 🐞 Bug Fixes

* better logger + `writeTimeout` ([29badba](https://github.com/kubb-project/kubb/commit/29badba4c0b08dcc403d3c4f796f513821e29881))
* better types for plugin `api` ([a4303b7](https://github.com/kubb-project/kubb/commit/a4303b7b102d871f514649f2edb4fb9058d6564d))
* better types for PluginFactoryOptions and `KubbPlugin` ([3fb7bdd](https://github.com/kubb-project/kubb/commit/3fb7bdd7b612373c55597705037eab9fdc8202ee))
* do not use the queue for writing to the file-system + check if a plugin is already writing ([2edce86](https://github.com/kubb-project/kubb/commit/2edce86e27787a809b0473426e3054ad3bb9aab5))
* remove JSON format for plugins with that it was not in use anymore(no docs were added) ([cdc5bec](https://github.com/kubb-project/kubb/commit/cdc5bec5371bede1d974f3ee30b9d02fa7b0008a))
* use of `fileManager.addIndexes` and `URLPath` without static functions ([9bc291d](https://github.com/kubb-project/kubb/commit/9bc291d5b9126b1d3f26803e6a1c54a3b008f634))


### 📦 Miscellaneous Chores

* release 1.14.2 ([91e61ac](https://github.com/kubb-project/kubb/commit/91e61acde1c3824c40f291e1142363eaa95fb1cf))
* release 1.14.3 ([695f324](https://github.com/kubb-project/kubb/commit/695f3242d61ac13f4284f3bdf529a3bc0e353244))
* release 2.0.0-alpha.1 ([925bf68](https://github.com/kubb-project/kubb/commit/925bf686956804aad82ba6480152427aaa6ad4f8))
* release 2.0.0-alpha.2 ([c0abf54](https://github.com/kubb-project/kubb/commit/c0abf54220849007e354f594267cd69086c38b07))
* release 2.0.0-alpha.3 ([3175248](https://github.com/kubb-project/kubb/commit/3175248895d3def0e32fbf87a7ffa45c0c859b68))

## [2.0.0-alpha.2](https://github.com/kubb-project/kubb/compare/@kubb/core-v2.0.0-alpha.1...@kubb/core-v2.0.0-alpha.2) (2023-10-30)


### 📦 Miscellaneous Chores

* release 2.0.0-alpha.2 ([c0abf54](https://github.com/kubb-project/kubb/commit/c0abf54220849007e354f594267cd69086c38b07))

## [2.0.0-alpha.1](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.14.5...@kubb/core-v2.0.0-alpha.1) (2023-10-27)


### 📚 Documentation

* better docs with examples ([fb42958](https://github.com/kubb-project/kubb/commit/fb429588f213a0ec7973fd64aa24eea17529747a))
* update docs with examples ([9087387](https://github.com/kubb-project/kubb/commit/908738795b2c1a3612dbc556b957f41c62465dc2))


### ✨ Features

* make it possible to use multiple of the same plugins ([91e5f76](https://github.com/kubb-project/kubb/commit/91e5f76ecd70d82be1d2855046a9cc97fcf9d7e9))
* multiple `KubbUserConfig`s for `defineConfig` instead of need to use multiple `kubb.config.js` files ([9316c9d](https://github.com/kubb-project/kubb/commit/9316c9da0eb344b0bb58b4efadf859ae89993a46))


### 🐞 Bug Fixes

* better logger + `writeTimeout` ([29badba](https://github.com/kubb-project/kubb/commit/29badba4c0b08dcc403d3c4f796f513821e29881))
* better types for plugin `api` ([a4303b7](https://github.com/kubb-project/kubb/commit/a4303b7b102d871f514649f2edb4fb9058d6564d))
* better types for PluginFactoryOptions and `KubbPlugin` ([3fb7bdd](https://github.com/kubb-project/kubb/commit/3fb7bdd7b612373c55597705037eab9fdc8202ee))
* do not use the queue for writing to the file-system + check if a plugin is already writing ([2edce86](https://github.com/kubb-project/kubb/commit/2edce86e27787a809b0473426e3054ad3bb9aab5))
* remove JSON format for plugins with that it was not in use anymore(no docs were added) ([cdc5bec](https://github.com/kubb-project/kubb/commit/cdc5bec5371bede1d974f3ee30b9d02fa7b0008a))
* use of `fileManager.addIndexes` and `URLPath` without static functions ([9bc291d](https://github.com/kubb-project/kubb/commit/9bc291d5b9126b1d3f26803e6a1c54a3b008f634))


### 📦 Miscellaneous Chores

* release 1.14.2 ([91e61ac](https://github.com/kubb-project/kubb/commit/91e61acde1c3824c40f291e1142363eaa95fb1cf))
* release 1.14.3 ([695f324](https://github.com/kubb-project/kubb/commit/695f3242d61ac13f4284f3bdf529a3bc0e353244))
* release 2.0.0-alpha.1 ([925bf68](https://github.com/kubb-project/kubb/commit/925bf686956804aad82ba6480152427aaa6ad4f8))
