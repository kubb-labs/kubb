# Changelog

## [1.5.0](https://github.com/kubb-project/kubb/compare/@kubb/cli-v1.4.2...@kubb/cli-v1.5.0) (2023-07-05)


### ✨ Features

* ✨ skipBy to exclude `tags`, `names`, `paths`, ... out of the generation ([44be77b](https://github.com/kubb-project/kubb/commit/44be77bb8748ae0188481716ef19dc6a39f1e538))
* support for `bun` with read/write ([4c4283b](https://github.com/kubb-project/kubb/commit/4c4283bb92995d369c65ba8087f81771ffb36086))

## [1.4.2](https://github.com/kubb-project/kubb/compare/@kubb/cli-v1.4.1...@kubb/cli-v1.4.2) (2023-06-28)


### 📦 Miscellaneous Chores

* **@kubb/cli:** Synchronize undefined versions

## [1.4.1](https://github.com/kubb-project/kubb/compare/@kubb/cli-v1.4.0...@kubb/cli-v1.4.1) (2023-06-27)


### 📦 Miscellaneous Chores

* release 1.4.1 ([9805506](https://github.com/kubb-project/kubb/commit/98055065a6931b96dc1038890eb56ebb0342818f))

## [1.4.0](https://github.com/kubb-project/kubb/compare/@kubb/cli-v1.4.0...@kubb/cli-v1.4.0) (2023-06-27)


### 📚 Documentation

* documentation for client and globals ([8f2b478](https://github.com/kubb-project/kubb/commit/8f2b478f91f307d7b322466bf623f9f8d192b876))


### ✨ Features

* `client.ts` with the use of `process.env` override to set options for `axios` ([89c0d08](https://github.com/kubb-project/kubb/commit/89c0d08986255fd554f1d6df661b0a9a2a83847a))
* ✨ add `reset.d.ts` to the `@kubb/ts-config` that can be used to override default TypeScrip types ([ae47aa5](https://github.com/kubb-project/kubb/commit/ae47aa5bbffc0f24d878e917eda3047856ca3fc7))
* **swagger-cli:** option input to override input.path of `kubb.config.js` ([76443b9](https://github.com/kubb-project/kubb/commit/76443b9956d1579c88b21699505de77e3a737f19))
* use of `cac` instead of `commander` ([3814acb](https://github.com/kubb-project/kubb/commit/3814acb392f882ded2a75ef987ccdd79227a9238))


### 🐞 Bug Fixes

* `EMFILE: too many open files` for Windows ([8c9dbce](https://github.com/kubb-project/kubb/commit/8c9dbce410430df669156b211ecae32fe17c88de))
* `path.resolve` with correct format for `Windows` ([ea7ff93](https://github.com/kubb-project/kubb/commit/ea7ff935f9be35c1899d82c1e9d2495eb92c8bcf))
* 🐛 fix: `fileManager` memory loop ([acc58dc](https://github.com/kubb-project/kubb/commit/acc58dcb40e4c320da2ceb09b3d8a1a32abed515))
* correct use of logging(added `stacktrace` option) ([6c89e3d](https://github.com/kubb-project/kubb/commit/6c89e3dae8b318625e3f484b1dbb259f9b14d378))
* drop of node 16 in favour of node 18 as minimum version ([f4112ef](https://github.com/kubb-project/kubb/commit/f4112efc4abc3a95e50b58a3fa925c7425d911dd))
* exit code 1 with correct error handling + use of pretty-error(debug mode) ([9cbe630](https://github.com/kubb-project/kubb/commit/9cbe6303377f31cca06df6ce29a74a68cc153194))
* full debug mode for fileManager, build, pluginManager and update for Queue to include `node.js` performance ([839d636](https://github.com/kubb-project/kubb/commit/839d6362e5ab19eb893e0ac1b6b1eb82d9c6de58))
* hide meta data when `logLevel` is silent and possibility to override `logLevel` with the CLI ([d5ba5f3](https://github.com/kubb-project/kubb/commit/d5ba5f3433dc41db03f93154110e55369273be0f))
* improvements for logger used in our CLI ([9c648da](https://github.com/kubb-project/kubb/commit/9c648daef4a23c8eec3f5d2529e933cbf7d2e3d3))
* init cli ([2f79cb0](https://github.com/kubb-project/kubb/commit/2f79cb08141f924b3c3834183fbe97b197acef20))
* log stdout of hooks when logLevel is `info` ([ca885e0](https://github.com/kubb-project/kubb/commit/ca885e0393bdd1cb93bd68b8067eabf758d413d2))
* npm init when calling kubb --init ([7f6f9d9](https://github.com/kubb-project/kubb/commit/7f6f9d9796f114e02ee9fc916d2aa79d3b2805c8))
* OraWritable to create a direct stream for hooks(`execa.pipeStdout`) ([0e95549](https://github.com/kubb-project/kubb/commit/0e955496e4e64e0091951eabca5849b719b60329))
* ParallelPluginError with promise.allSettled ([b1c0585](https://github.com/kubb-project/kubb/commit/b1c0585d8e650d9b5fbe105ead0040677b2546e4))
* pluginManager with `api` config will now be an function so the `core` functionality is accessible when using `this` ([4306318](https://github.com/kubb-project/kubb/commit/43063189a1a18ed2aca23b0505d3163aeddbc2ef))
* run with a timeout and every executation will be done with our `queue` ([60e00cf](https://github.com/kubb-project/kubb/commit/60e00cf4f1dfd1628681f39959d544d8e3843a7d))
* update packages ([8b5a483](https://github.com/kubb-project/kubb/commit/8b5a4836d13009138d94f2af236a9fa0bec50c6d))
* warning with correct cli message(validate for swagger) ([b091e28](https://github.com/kubb-project/kubb/commit/b091e282f079e7694bf04a35ea6a0ebfd3aa06da))


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

## [1.3.3](https://github.com/kubb-project/kubb/compare/@kubb/cli-v1.3.2...@kubb/cli-v1.3.3) (2023-06-27)

### 🐞 Bug Fixes

* update packages ([8b5a483](https://github.com/kubb-project/kubb/commit/8b5a4836d13009138d94f2af236a9fa0bec50c6d))

## [1.3.2](https://github.com/kubb-project/kubb/compare/@kubb/cli-v1.3.1...@kubb/cli-v1.3.2) (2023-06-25)


### Miscellaneous Chores

* **@kubb/cli:** Synchronize undefined versions

## [1.3.1](https://github.com/kubb-project/kubb/compare/@kubb/cli-v1.3.0...@kubb/cli-v1.3.1) (2023-06-24)


### Miscellaneous Chores

* release 1.3.1 ([fc869d9](https://github.com/kubb-project/kubb/commit/fc869d9c1429f3b513e3ba5a8854e1bf1d1f2122))

## [1.3.0](https://github.com/kubb-project/kubb/compare/@kubb/cli-v1.2.4...@kubb/cli-v1.3.0) (2023-06-23)


### Miscellaneous Chores

* **@kubb/cli:** Synchronize undefined versions

## [1.2.4](https://github.com/kubb-project/kubb/compare/@kubb/cli-v1.2.3...@kubb/cli-v1.2.4) (2023-06-17)


### Miscellaneous Chores

* **@kubb/cli:** Synchronize undefined versions

## [1.2.3](https://github.com/kubb-project/kubb/compare/@kubb/cli-v1.2.2...@kubb/cli-v1.2.3) (2023-06-17)


### Miscellaneous Chores

* **@kubb/cli:** Synchronize undefined versions

## [1.2.2](https://github.com/kubb-project/kubb/compare/@kubb/cli-v1.2.1...@kubb/cli-v1.2.2) (2023-06-16)


### Features

* use of `cac` instead of `commander` ([3814acb](https://github.com/kubb-project/kubb/commit/3814acb392f882ded2a75ef987ccdd79227a9238))


### Miscellaneous Chores

* release 1.2.2 ([9489c97](https://github.com/kubb-project/kubb/commit/9489c97159a0f0e755b4257cd330e11d4d648b88))

## [1.2.1](https://github.com/kubb-project/kubb/compare/@kubb/cli-v1.2.0...@kubb/cli-v1.2.1) (2023-06-15)


### Bug Fixes

* 🐛 fix: `fileManager` memory loop ([acc58dc](https://github.com/kubb-project/kubb/commit/acc58dcb40e4c320da2ceb09b3d8a1a32abed515))
* correct use of logging(added `stacktrace` option) ([6c89e3d](https://github.com/kubb-project/kubb/commit/6c89e3dae8b318625e3f484b1dbb259f9b14d378))
* full debug mode for fileManager, build, pluginManager and update for Queue to include `node.js` performance ([839d636](https://github.com/kubb-project/kubb/commit/839d6362e5ab19eb893e0ac1b6b1eb82d9c6de58))
* pluginManager with `api` config will now be an function so the `core` functionality is accessible when using `this` ([4306318](https://github.com/kubb-project/kubb/commit/43063189a1a18ed2aca23b0505d3163aeddbc2ef))
* run with a timeout and every executation will be done with our `queue` ([60e00cf](https://github.com/kubb-project/kubb/commit/60e00cf4f1dfd1628681f39959d544d8e3843a7d))

## [1.2.0](https://github.com/kubb-project/kubb/compare/@kubb/cli-v1.1.13...@kubb/cli-v1.2.0) (2023-06-14)


### Features

* ✨ add `reset.d.ts` to the `@kubb/ts-config` that can be used to override default TypeScrip types ([ae47aa5](https://github.com/kubb-project/kubb/commit/ae47aa5bbffc0f24d878e917eda3047856ca3fc7))


### Bug Fixes

* improvements for logger used in our CLI ([9c648da](https://github.com/kubb-project/kubb/commit/9c648daef4a23c8eec3f5d2529e933cbf7d2e3d3))
* warning with correct cli message(validate for swagger) ([b091e28](https://github.com/kubb-project/kubb/commit/b091e282f079e7694bf04a35ea6a0ebfd3aa06da))

## [1.1.13](https://github.com/kubb-project/kubb/compare/@kubb/cli-v1.1.12...@kubb/cli-v1.1.13) (2023-06-13)


### Miscellaneous Chores

* **@kubb/cli:** Synchronize undefined versions

## [1.1.12](https://github.com/kubb-project/kubb/compare/@kubb/cli-v1.1.11...@kubb/cli-v1.1.12) (2023-06-13)


### Miscellaneous Chores

* **@kubb/cli:** Synchronize undefined versions

## [1.1.11](https://github.com/kubb-project/kubb/compare/@kubb/cli-v1.1.10...@kubb/cli-v1.1.11) (2023-06-12)


### Bug Fixes

* OraWritable to create a direct stream for hooks(`execa.pipeStdout`) ([0e95549](https://github.com/kubb-project/kubb/commit/0e955496e4e64e0091951eabca5849b719b60329))

## [1.1.10](https://github.com/kubb-project/kubb/compare/@kubb/cli-v1.1.9...@kubb/cli-v1.1.10) (2023-06-12)


### Miscellaneous Chores

* **@kubb/cli:** Synchronize undefined versions

## [1.1.9](https://github.com/kubb-project/kubb/compare/@kubb/cli-v1.1.8...@kubb/cli-v1.1.9) (2023-06-11)


### Bug Fixes

* `EMFILE: too many open files` for Windows ([8c9dbce](https://github.com/kubb-project/kubb/commit/8c9dbce410430df669156b211ecae32fe17c88de))
* `path.resolve` with correct format for `Windows` ([ea7ff93](https://github.com/kubb-project/kubb/commit/ea7ff935f9be35c1899d82c1e9d2495eb92c8bcf))

## [1.1.8](https://github.com/kubb-project/kubb/compare/@kubb/cli-v1.1.7...@kubb/cli-v1.1.8) (2023-06-10)


### Miscellaneous Chores

* **@kubb/cli:** Synchronize undefined versions

## [1.1.7](https://github.com/kubb-project/kubb/compare/@kubb/cli-v1.1.6...@kubb/cli-v1.1.7) (2023-06-08)


### Miscellaneous Chores

* **@kubb/cli:** Synchronize undefined versions

## [1.1.6](https://github.com/kubb-project/kubb/compare/@kubb/cli-v1.1.5...@kubb/cli-v1.1.6) (2023-06-08)


### Bug Fixes

* drop of node 16 in favour of node 18 as minimum version ([f4112ef](https://github.com/kubb-project/kubb/commit/f4112efc4abc3a95e50b58a3fa925c7425d911dd))

## [1.1.5](https://github.com/kubb-project/kubb/compare/@kubb/cli-v1.1.4...@kubb/cli-v1.1.5) (2023-06-07)


### Bug Fixes

* npm init when calling kubb --init ([7f6f9d9](https://github.com/kubb-project/kubb/commit/7f6f9d9796f114e02ee9fc916d2aa79d3b2805c8))

## [1.1.4](https://github.com/kubb-project/kubb/compare/@kubb/cli-v1.1.3...@kubb/cli-v1.1.4) (2023-06-07)


### Bug Fixes

* init cli ([2f79cb0](https://github.com/kubb-project/kubb/commit/2f79cb08141f924b3c3834183fbe97b197acef20))

## [1.1.3](https://github.com/kubb-project/kubb/compare/@kubb/cli-v1.1.2...@kubb/cli-v1.1.3) (2023-06-06)


### Bug Fixes

* hide meta data when `logLevel` is silent and possibility to override `logLevel` with the CLI ([d5ba5f3](https://github.com/kubb-project/kubb/commit/d5ba5f3433dc41db03f93154110e55369273be0f))

## [1.1.2](https://github.com/kubb-project/kubb/compare/@kubb/cli-v1.1.1...@kubb/cli-v1.1.2) (2023-06-06)


### Miscellaneous Chores

* **@kubb/cli:** Synchronize undefined versions

## [1.1.1](https://github.com/kubb-project/kubb/compare/@kubb/cli-v1.1.0...@kubb/cli-v1.1.1) (2023-06-06)


### Miscellaneous Chores

* **@kubb/cli:** Synchronize undefined versions

## [1.1.0](https://github.com/kubb-project/kubb/compare/@kubb/cli-v1.0.3...@kubb/cli-v1.1.0) (2023-06-05)


### Miscellaneous Chores

* release 1.1.0 ([93ebdf1](https://github.com/kubb-project/kubb/commit/93ebdf116d63f022cacb8276de30d778df225ce5))

## [1.0.3](https://github.com/kubb-project/kubb/compare/@kubb/cli-v1.0.2...@kubb/cli-v1.0.3) (2023-06-05)


### Bug Fixes

* log stdout of hooks when logLevel is `info` ([ca885e0](https://github.com/kubb-project/kubb/commit/ca885e0393bdd1cb93bd68b8067eabf758d413d2))

## [1.0.2](https://github.com/kubb-project/kubb/compare/@kubb/cli-v1.0.1...@kubb/cli-v1.0.2) (2023-06-05)


### Miscellaneous Chores

* **@kubb/cli:** Synchronize undefined versions

## [1.0.1](https://github.com/kubb-project/kubb/compare/@kubb/cli-v1.0.0...@kubb/cli-v1.0.1) (2023-06-05)


### Features

* **swagger-cli:** option input to override input.path of `kubb.config.js` ([76443b9](https://github.com/kubb-project/kubb/commit/76443b9956d1579c88b21699505de77e3a737f19))


### Bug Fixes

* exit code 1 with correct error handling + use of pretty-error(debug mode) ([9cbe630](https://github.com/kubb-project/kubb/commit/9cbe6303377f31cca06df6ce29a74a68cc153194))
* ParallelPluginError with promise.allSettled ([b1c0585](https://github.com/kubb-project/kubb/commit/b1c0585d8e650d9b5fbe105ead0040677b2546e4))


### Miscellaneous Chores

* release 1.0.1 ([8d62c91](https://github.com/kubb-project/kubb/commit/8d62c9117643b5cce9a75978a698adc6d76e1cf8))

## [1.0.0](https://github.com/kubb-project/kubb/compare/@kubb/cli-v1.0.0-beta.19...@kubb/cli-v1.0.0) (2023-06-02)


### Miscellaneous Chores

* release 1.0.0 ([4009e28](https://github.com/kubb-project/kubb/commit/4009e283a93be87ff21562c6b59299ca3cfa73f8))
