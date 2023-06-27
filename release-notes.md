:robot: I have created a release *beep* *boop*
---


<details><summary>kubb: 1.3.1</summary>

## [1.3.1](https://github.com/kubb-project/kubb/compare/kubb-v1.3.3...kubb-v1.3.1) (2023-06-27)


### ( Features

* use of `cac` instead of `commander` ([3814acb](https://github.com/kubb-project/kubb/commit/3814acb392f882ded2a75ef987ccdd79227a9238))


### =æ Miscellaneous Chores

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


### = Bug Fixes

* update packages ([8b5a483](https://github.com/kubb-project/kubb/commit/8b5a4836d13009138d94f2af236a9fa0bec50c6d))
</details>

<details><summary>@kubb/core: 1.3.1</summary>

## [1.3.1](https://github.com/kubb-project/kubb/compare/@kubb/core-v1.3.3...@kubb/core-v1.3.1) (2023-06-27)


### = Bug Fixes

* `EMFILE: too many open files` for Windows ([8c9dbce](https://github.com/kubb-project/kubb/commit/8c9dbce410430df669156b211ecae32fe17c88de))
* `path.resolve` with correct format for `Windows` ([ea7ff93](https://github.com/kubb-project/kubb/commit/ea7ff935f9be35c1899d82c1e9d2495eb92c8bcf))
* = fix: `fileManager` memory loop ([acc58dc](https://github.com/kubb-project/kubb/commit/acc58dcb40e4c320da2ceb09b3d8a1a32abed515))
* add `QueryBuilder` for Tanstack/query generators ([3c4ea57](https://github.com/kubb-project/kubb/commit/3c4ea57077a0d1c131a2f692e9f2a55c6bcec468))
* advanced queue ([e8e90b9](https://github.com/kubb-project/kubb/commit/e8e90b9cbeadad793b759a174641874dc39c2c01))
* better operationGeneration + schemas.request could be optional ([cf10b02](https://github.com/kubb-project/kubb/commit/cf10b0242761847133ebf01bae64d0bfed1334ab))
* **core:** only read in file when input is not a URL ([6ad51e0](https://github.com/kubb-project/kubb/commit/6ad51e0f5107cb7d05c07d7870a730a7258cc788))
* correct use of logging(added `stacktrace` option) ([6c89e3d](https://github.com/kubb-project/kubb/commit/6c89e3dae8b318625e3f484b1dbb259f9b14d378))
* do not include initialFile(input) in the FileManager ([0ff037d](https://github.com/kubb-project/kubb/commit/0ff037d2646a3b01fc3332048e1e70e2423bd896))
* drop of node 16 in favour of node 18 as minimum version ([f4112ef](https://github.com/kubb-project/kubb/commit/f4112efc4abc3a95e50b58a3fa925c7425d911dd))
* duplicate import names ([7a8e6fa](https://github.com/kubb-project/kubb/commit/7a8e6fa3f00e37c771b15fb0287adc1dd166acb7))
* duplocated queryParams(coming from the pathParams) ([714281f](https://github.com/kubb-project/kubb/commit/714281f5d511c02c130a66b75e774f231ee06e9b))
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
* use of codegen for imports and exports ([aeccdbd](https://github.com/kubb-project/kubb/commit/aeccdbdc0068ef6e99902243958f4982e8b27223))
* use of transformReservedWord and better naming for req, res and params ([5574dd1](https://github.com/kubb-project/kubb/commit/5574dd1fa597c84d03d65547cab0b819049380a3))
* warning with correct cli message(validate for swagger) ([b091e28](https://github.com/kubb-project/kubb/commit/b091e282f079e7694bf04a35ea6a0ebfd3aa06da))
* writeIndexes without write, use of the filemanager instead ([5359521](https://github.com/kubb-project/kubb/commit/53595216451a21f25a8687e564c16f4d13d1f594))


### =æ Miscellaneous Chores

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


### ( Features

* `client.ts` globals(declare const) can override the options set for `axios` ([b9dc851](https://github.com/kubb-project/kubb/commit/b9dc851896a5509cbf0e2f1910e4939631efa337))
* `client.ts` with the use of `process.env` override to set options for `axios` ([89c0d08](https://github.com/kubb-project/kubb/commit/89c0d08986255fd554f1d6df661b0a9a2a83847a))
* `groupBy.exportAs` to make it possible go group all import with `export * as groupBy.exportAs from "./x"` ([214ff25](https://github.com/kubb-project/kubb/commit/214ff250e8ecf23d754a456c1b9289c6475099e0))
* ( `swagger-form` FormGenerator and FormParser ([6424e5f](https://github.com/kubb-project/kubb/commit/6424e5f48960a24313e4ce2c115fd58af3cde814))
* ( add `reset.d.ts` to the `@kubb/ts-config` that can be used to override default TypeScrip types ([ae47aa5](https://github.com/kubb-project/kubb/commit/ae47aa5bbffc0f24d878e917eda3047856ca3fc7))
* ( useInfiniteQuery for `React`, `Solid`, `Svelte` and `Vue` ([d683cc7](https://github.com/kubb-project/kubb/commit/d683cc7909818757f62560bc1936b79bd0a79bfe))
* **swagger-cli:** option input to override input.path of `kubb.config.js` ([76443b9](https://github.com/kubb-project/kubb/commit/76443b9956d1579c88b21699505de77e3a737f19))
* use of `cac` instead of `commander` ([3814acb](https://github.com/kubb-project/kubb/commit/3814acb392f882ded2a75ef987ccdd79227a9238))
* use of `exports` for the fileManager ([e0582ee](https://github.com/kubb-project/kubb/commit/e0582eef921d10d3fc35af8a802ef2d81f790639))


### =Ú Documentation

* documentation for client and globals ([8f2b478](https://github.com/kubb-project/kubb/commit/8f2b478f91f307d7b322466bf623f9f8d192b876))
* react-hook-form + data-driven-forms example ([df538f9](https://github.com/kubb-project/kubb/commit/df538f95763976c2fe544c761b13288b62b182ef))
* update docs ([a246bb1](https://github.com/kubb-project/kubb/commit/a246bb1171a95ba9d639468c5f8214573bd33513))
</details>

<details><summary>@kubb/cli: 1.3.1</summary>

## [1.3.1](https://github.com/kubb-project/kubb/compare/@kubb/cli-v1.3.3...@kubb/cli-v1.3.1) (2023-06-27)


### =Ú Documentation

* documentation for client and globals ([8f2b478](https://github.com/kubb-project/kubb/commit/8f2b478f91f307d7b322466bf623f9f8d192b876))


### ( Features

* `client.ts` with the use of `process.env` override to set options for `axios` ([89c0d08](https://github.com/kubb-project/kubb/commit/89c0d08986255fd554f1d6df661b0a9a2a83847a))
* ( add `reset.d.ts` to the `@kubb/ts-config` that can be used to override default TypeScrip types ([ae47aa5](https://github.com/kubb-project/kubb/commit/ae47aa5bbffc0f24d878e917eda3047856ca3fc7))
* **swagger-cli:** option input to override input.path of `kubb.config.js` ([76443b9](https://github.com/kubb-project/kubb/commit/76443b9956d1579c88b21699505de77e3a737f19))
* use of `cac` instead of `commander` ([3814acb](https://github.com/kubb-project/kubb/commit/3814acb392f882ded2a75ef987ccdd79227a9238))


### =æ Miscellaneous Chores

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


### = Bug Fixes

* `EMFILE: too many open files` for Windows ([8c9dbce](https://github.com/kubb-project/kubb/commit/8c9dbce410430df669156b211ecae32fe17c88de))
* `path.resolve` with correct format for `Windows` ([ea7ff93](https://github.com/kubb-project/kubb/commit/ea7ff935f9be35c1899d82c1e9d2495eb92c8bcf))
* = fix: `fileManager` memory loop ([acc58dc](https://github.com/kubb-project/kubb/commit/acc58dcb40e4c320da2ceb09b3d8a1a32abed515))
* correct use of logging(added `stacktrace` option) ([6c89e3d](https://github.com/kubb-project/kubb/commit/6c89e3dae8b318625e3f484b1dbb259f9b14d378))
* drop of node 16 in favour of node 18 as minimum version ([f4112ef](https://github.com/kubb-project/kubb/commit/f4112efc4abc3a95e50b58a3fa925c7425d911dd))
* duplocated queryParams(coming from the pathParams) ([714281f](https://github.com/kubb-project/kubb/commit/714281f5d511c02c130a66b75e774f231ee06e9b))
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
</details>

<details><summary>@kubb/ts-codegen: 1.3.1</summary>

## [1.3.1](https://github.com/kubb-project/kubb/compare/@kubb/ts-codegen-v1.3.3...@kubb/ts-codegen-v1.3.1) (2023-06-27)


### ( Features

* `groupBy.exportAs` to make it possible go group all import with `export * as groupBy.exportAs from "./x"` ([214ff25](https://github.com/kubb-project/kubb/commit/214ff250e8ecf23d754a456c1b9289c6475099e0))
* ( add `reset.d.ts` to the `@kubb/ts-config` that can be used to override default TypeScrip types ([ae47aa5](https://github.com/kubb-project/kubb/commit/ae47aa5bbffc0f24d878e917eda3047856ca3fc7))
* enumType to use an `Enum` or use `* as const` ([29b396f](https://github.com/kubb-project/kubb/commit/29b396f6980f1119502a0f40e5bb4f7e43346480))
* **swagger-ts:** enumType `asPascalConst`to also include PascalCase naming. `asConst` will use camelcase ([f63a1b5](https://github.com/kubb-project/kubb/commit/f63a1b5765f4ad27986f5e5bc18de6e929a1a017))
* **swagger-ts:** use of prefixItems to create a TypeScript union ([e5ec395](https://github.com/kubb-project/kubb/commit/e5ec39503c14f14baec1c666fd115b8c0b55fe1e))
* use of `cac` instead of `commander` ([3814acb](https://github.com/kubb-project/kubb/commit/3814acb392f882ded2a75ef987ccdd79227a9238))
* use of `exports` for the fileManager ([e0582ee](https://github.com/kubb-project/kubb/commit/e0582eef921d10d3fc35af8a802ef2d81f790639))


### = Bug Fixes

* `EMFILE: too many open files` for Windows ([8c9dbce](https://github.com/kubb-project/kubb/commit/8c9dbce410430df669156b211ecae32fe17c88de))
* add types to mocks based on `@kubb/swagger-ts` ([5b51fe0](https://github.com/kubb-project/kubb/commit/5b51fe01b237f99b801bb76d9bb71578dba70113))
* asType should have a default of false instead of true ([2b5d842](https://github.com/kubb-project/kubb/commit/2b5d8427d24e0443678250ba73119c449dacd194))
* drop of node 16 in favour of node 18 as minimum version ([f4112ef](https://github.com/kubb-project/kubb/commit/f4112efc4abc3a95e50b58a3fa925c7425d911dd))
* duplicate import names ([7a8e6fa](https://github.com/kubb-project/kubb/commit/7a8e6fa3f00e37c771b15fb0287adc1dd166acb7))
* init cli ([2f79cb0](https://github.com/kubb-project/kubb/commit/2f79cb08141f924b3c3834183fbe97b197acef20))
* use of codegen for imports and exports ([aeccdbd](https://github.com/kubb-project/kubb/commit/aeccdbdc0068ef6e99902243958f4982e8b27223))
* when alias starts with a number, exclude and replace by _ ([10962ff](https://github.com/kubb-project/kubb/commit/10962ff755f61208d88f36d0c8bd87823d5e8410))
* writeIndexes without write, use of the filemanager instead ([5359521](https://github.com/kubb-project/kubb/commit/53595216451a21f25a8687e564c16f4d13d1f594))


### =æ Miscellaneous Chores

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
</details>

<details><summary>@kubb/swagger: 1.3.1</summary>

## [1.3.1](https://github.com/kubb-project/kubb/compare/@kubb/swagger-v1.3.3...@kubb/swagger-v1.3.1) (2023-06-27)


### ( Features

* `client.ts` with the use of `process.env` override to set options for `axios` ([89c0d08](https://github.com/kubb-project/kubb/commit/89c0d08986255fd554f1d6df661b0a9a2a83847a))
* ( add `reset.d.ts` to the `@kubb/ts-config` that can be used to override default TypeScrip types ([ae47aa5](https://github.com/kubb-project/kubb/commit/ae47aa5bbffc0f24d878e917eda3047856ca3fc7))
* use of `cac` instead of `commander` ([3814acb](https://github.com/kubb-project/kubb/commit/3814acb392f882ded2a75ef987ccdd79227a9238))


### =æ Miscellaneous Chores

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


### =Ú Documentation

* documentation for client and globals ([8f2b478](https://github.com/kubb-project/kubb/commit/8f2b478f91f307d7b322466bf623f9f8d192b876))
* react-hook-form + data-driven-forms example ([df538f9](https://github.com/kubb-project/kubb/commit/df538f95763976c2fe544c761b13288b62b182ef))


### = Bug Fixes

* = fix: `fileManager` memory loop ([acc58dc](https://github.com/kubb-project/kubb/commit/acc58dcb40e4c320da2ceb09b3d8a1a32abed515))
* add types to mocks based on `@kubb/swagger-ts` ([5b51fe0](https://github.com/kubb-project/kubb/commit/5b51fe01b237f99b801bb76d9bb71578dba70113))
* better operationGeneration + schemas.request could be optional ([cf10b02](https://github.com/kubb-project/kubb/commit/cf10b0242761847133ebf01bae64d0bfed1334ab))
* default for Zod and TypeScript ([6602116](https://github.com/kubb-project/kubb/commit/660211670f9f4ea9e76ec482629844801050dc92))
* drop of node 16 in favour of node 18 as minimum version ([f4112ef](https://github.com/kubb-project/kubb/commit/f4112efc4abc3a95e50b58a3fa925c7425d911dd))
* duplocated queryParams(coming from the pathParams) ([714281f](https://github.com/kubb-project/kubb/commit/714281f5d511c02c130a66b75e774f231ee06e9b))
* get requestSchema based on `operation.getRequestBody` or `operation.getRequestBody(requestBodyTypes.at(0)` ([85e3e78](https://github.com/kubb-project/kubb/commit/85e3e786786f1b4c57cec1605d5fb96aeac1ab83))
* improvements for logger used in our CLI ([9c648da](https://github.com/kubb-project/kubb/commit/9c648daef4a23c8eec3f5d2529e933cbf7d2e3d3))
* include errors in Typescript and Zod ([5885041](https://github.com/kubb-project/kubb/commit/588504121b1aae9498218284a41ab43a8c78f861))
* init cli ([2f79cb0](https://github.com/kubb-project/kubb/commit/2f79cb08141f924b3c3834183fbe97b197acef20))
* no fileManager needed for OperationGenerator + this.addFile change with multiParams ([cde8225](https://github.com/kubb-project/kubb/commit/cde8225a5207360bd17f4ede66ce2a07d5dfd53d))
* Path and objectToParameters with paramterName in camelCase ([a446b18](https://github.com/kubb-project/kubb/commit/a446b188e5001b3597125bcfed61e454e9ed06c0))
* pluginManager with `api` config will now be an function so the `core` functionality is accessible when using `this` ([4306318](https://github.com/kubb-project/kubb/commit/43063189a1a18ed2aca23b0505d3163aeddbc2ef))
* remove `lodash` dependency ([8729ef8](https://github.com/kubb-project/kubb/commit/8729ef8f3f3d487b7c239f015e8321aabe17bd3b))
* remove propdrilling of directory ([99b8016](https://github.com/kubb-project/kubb/commit/99b801658a514a223e590d14f7d7729e85391ffc))
* resolvePath and resolveName sync ([935ca2a](https://github.com/kubb-project/kubb/commit/935ca2a137006d9a59ef276e16f54770391b0a42))
* update packages ([8b5a483](https://github.com/kubb-project/kubb/commit/8b5a4836d13009138d94f2af236a9fa0bec50c6d))
* use methods of path instead of all methods + removal of `getOperation`(no check needed on `operationId`) ([2978ad7](https://github.com/kubb-project/kubb/commit/2978ad7e42b3ccb6c52088bec949afa32192a883))
* use of camelCaseTransformMerge for every camelcase transform ([69f77ec](https://github.com/kubb-project/kubb/commit/69f77ecb45d62c14cb5ec7724cc64c9fe63a2365))
* use of express style for jsdoc [@link](https://github.com/link) ([7c38ee0](https://github.com/kubb-project/kubb/commit/7c38ee020f5b54ff2cfec807315c1450119025d0))
* use of transformReservedWord and better naming for req, res and params ([5574dd1](https://github.com/kubb-project/kubb/commit/5574dd1fa597c84d03d65547cab0b819049380a3))
* warning with correct cli message(validate for swagger) ([b091e28](https://github.com/kubb-project/kubb/commit/b091e282f079e7694bf04a35ea6a0ebfd3aa06da))
</details>

<details><summary>@kubb/swagger-ts: 1.3.1</summary>

## [1.3.1](https://github.com/kubb-project/kubb/compare/@kubb/swagger-ts-v1.3.3...@kubb/swagger-ts-v1.3.1) (2023-06-27)


### =Ú Documentation

* documentation for client and globals ([8f2b478](https://github.com/kubb-project/kubb/commit/8f2b478f91f307d7b322466bf623f9f8d192b876))


### = Bug Fixes

* add types to mocks based on `@kubb/swagger-ts` ([5b51fe0](https://github.com/kubb-project/kubb/commit/5b51fe01b237f99b801bb76d9bb71578dba70113))
* advanced queue ([e8e90b9](https://github.com/kubb-project/kubb/commit/e8e90b9cbeadad793b759a174641874dc39c2c01))
* correct use of params ([2352c51](https://github.com/kubb-project/kubb/commit/2352c511fc7fd76adfed1260773c3f6fdee3b23a))
* default for Zod and TypeScript ([6602116](https://github.com/kubb-project/kubb/commit/660211670f9f4ea9e76ec482629844801050dc92))
* drop of node 16 in favour of node 18 as minimum version ([f4112ef](https://github.com/kubb-project/kubb/commit/f4112efc4abc3a95e50b58a3fa925c7425d911dd))
* duplicate import names ([7a8e6fa](https://github.com/kubb-project/kubb/commit/7a8e6fa3f00e37c771b15fb0287adc1dd166acb7))
* duplocated queryParams(coming from the pathParams) ([714281f](https://github.com/kubb-project/kubb/commit/714281f5d511c02c130a66b75e774f231ee06e9b))
* include errors in Typescript and Zod ([5885041](https://github.com/kubb-project/kubb/commit/588504121b1aae9498218284a41ab43a8c78f861))
* init cli ([2f79cb0](https://github.com/kubb-project/kubb/commit/2f79cb08141f924b3c3834183fbe97b197acef20))
* no fileManager needed for OperationGenerator + this.addFile change with multiParams ([cde8225](https://github.com/kubb-project/kubb/commit/cde8225a5207360bd17f4ede66ce2a07d5dfd53d))
* oneOf and allOf should check if properties exists(else we have a z.any/any) ([1914b6a](https://github.com/kubb-project/kubb/commit/1914b6a25e8266eb635459c4e9354b33df4fc4ad))
* pluginManager with `api` config will now be an function so the `core` functionality is accessible when using `this` ([4306318](https://github.com/kubb-project/kubb/commit/43063189a1a18ed2aca23b0505d3163aeddbc2ef))
* ref.name ?? ref.propertyName so unique names can be used ([4df0984](https://github.com/kubb-project/kubb/commit/4df0984f3131b85146edda0c10ab7d4e1fec87d1))
* remove `lodash` dependency ([8729ef8](https://github.com/kubb-project/kubb/commit/8729ef8f3f3d487b7c239f015e8321aabe17bd3b))
* remove propdrilling of directory ([99b8016](https://github.com/kubb-project/kubb/commit/99b801658a514a223e590d14f7d7729e85391ffc))
* resolvePath and resolveName sync ([935ca2a](https://github.com/kubb-project/kubb/commit/935ca2a137006d9a59ef276e16f54770391b0a42))
* use of camelCaseTransformMerge for every camelcase transform ([69f77ec](https://github.com/kubb-project/kubb/commit/69f77ecb45d62c14cb5ec7724cc64c9fe63a2365))
* use of transformReservedWord and better naming for req, res and params ([5574dd1](https://github.com/kubb-project/kubb/commit/5574dd1fa597c84d03d65547cab0b819049380a3))
* warning with correct cli message(validate for swagger) ([b091e28](https://github.com/kubb-project/kubb/commit/b091e282f079e7694bf04a35ea6a0ebfd3aa06da))
* writeIndexes without write, use of the filemanager instead ([5359521](https://github.com/kubb-project/kubb/commit/53595216451a21f25a8687e564c16f4d13d1f594))


### =æ Miscellaneous Chores

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


### ( Features

* `client.ts` with the use of `process.env` override to set options for `axios` ([89c0d08](https://github.com/kubb-project/kubb/commit/89c0d08986255fd554f1d6df661b0a9a2a83847a))
* `groupBy.exportAs` to make it possible go group all import with `export * as groupBy.exportAs from "./x"` ([214ff25](https://github.com/kubb-project/kubb/commit/214ff250e8ecf23d754a456c1b9289c6475099e0))
* ( `swagger-form` FormGenerator and FormParser ([6424e5f](https://github.com/kubb-project/kubb/commit/6424e5f48960a24313e4ce2c115fd58af3cde814))
* ( add `reset.d.ts` to the `@kubb/ts-config` that can be used to override default TypeScrip types ([ae47aa5](https://github.com/kubb-project/kubb/commit/ae47aa5bbffc0f24d878e917eda3047856ca3fc7))
* ( useInfiniteQuery for `React`, `Solid`, `Svelte` and `Vue` ([d683cc7](https://github.com/kubb-project/kubb/commit/d683cc7909818757f62560bc1936b79bd0a79bfe))
* enumType to use an `Enum` or use `* as const` ([29b396f](https://github.com/kubb-project/kubb/commit/29b396f6980f1119502a0f40e5bb4f7e43346480))
* groupby as object with `type` and `output` which can be customised with a handlebar like syntax ([c687864](https://github.com/kubb-project/kubb/commit/c687864b2ac82643757ef7b2f6158410144a73fe))
* **swagger-ts:** enumType `asPascalConst`to also include PascalCase naming. `asConst` will use camelcase ([f63a1b5](https://github.com/kubb-project/kubb/commit/f63a1b5765f4ad27986f5e5bc18de6e929a1a017))
* **swagger-ts:** use of prefixItems to create a TypeScript union ([e5ec395](https://github.com/kubb-project/kubb/commit/e5ec39503c14f14baec1c666fd115b8c0b55fe1e))
* use of `cac` instead of `commander` ([3814acb](https://github.com/kubb-project/kubb/commit/3814acb392f882ded2a75ef987ccdd79227a9238))
* use of `exports` for the fileManager ([e0582ee](https://github.com/kubb-project/kubb/commit/e0582eef921d10d3fc35af8a802ef2d81f790639))
</details>

<details><summary>@kubb/swagger-client: 1.3.1</summary>

## [1.3.1](https://github.com/kubb-project/kubb/compare/@kubb/swagger-client-v1.3.3...@kubb/swagger-client-v1.3.1) (2023-06-27)


### =Ú Documentation

* documentation for client and globals ([8f2b478](https://github.com/kubb-project/kubb/commit/8f2b478f91f307d7b322466bf623f9f8d192b876))


### ( Features

* `client.ts` with the use of `process.env` override to set options for `axios` ([89c0d08](https://github.com/kubb-project/kubb/commit/89c0d08986255fd554f1d6df661b0a9a2a83847a))
* `groupBy.exportAs` to make it possible go group all import with `export * as groupBy.exportAs from "./x"` ([214ff25](https://github.com/kubb-project/kubb/commit/214ff250e8ecf23d754a456c1b9289c6475099e0))
* ( add `reset.d.ts` to the `@kubb/ts-config` that can be used to override default TypeScrip types ([ae47aa5](https://github.com/kubb-project/kubb/commit/ae47aa5bbffc0f24d878e917eda3047856ca3fc7))
* groupby as object with `type` and `output` which can be customised with a handlebar like syntax ([c687864](https://github.com/kubb-project/kubb/commit/c687864b2ac82643757ef7b2f6158410144a73fe))
* use of `cac` instead of `commander` ([3814acb](https://github.com/kubb-project/kubb/commit/3814acb392f882ded2a75ef987ccdd79227a9238))
* use of `exports` for the fileManager ([e0582ee](https://github.com/kubb-project/kubb/commit/e0582eef921d10d3fc35af8a802ef2d81f790639))


### =æ Miscellaneous Chores

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


### = Bug Fixes

* add `ClientBuilder` for our client generator + ReturnType ([21de173](https://github.com/kubb-project/kubb/commit/21de1738d24d6a6dbae516ef60bbcc4b67fec6ea))
* advanced queue ([e8e90b9](https://github.com/kubb-project/kubb/commit/e8e90b9cbeadad793b759a174641874dc39c2c01))
* better operationGeneration + schemas.request could be optional ([cf10b02](https://github.com/kubb-project/kubb/commit/cf10b0242761847133ebf01bae64d0bfed1334ab))
* correct use of `path.resolve` so windows can transform / to \ ([a4052e2](https://github.com/kubb-project/kubb/commit/a4052e24ec57e3920a6285d1b4bee9570f2e4e9f))
* correct use of params ([2352c51](https://github.com/kubb-project/kubb/commit/2352c511fc7fd76adfed1260773c3f6fdee3b23a))
* drop of node 16 in favour of node 18 as minimum version ([f4112ef](https://github.com/kubb-project/kubb/commit/f4112efc4abc3a95e50b58a3fa925c7425d911dd))
* duplicate import names ([7a8e6fa](https://github.com/kubb-project/kubb/commit/7a8e6fa3f00e37c771b15fb0287adc1dd166acb7))
* duplocated queryParams(coming from the pathParams) ([714281f](https://github.com/kubb-project/kubb/commit/714281f5d511c02c130a66b75e774f231ee06e9b))
* exclude queryParams for method DELETE ([71b2478](https://github.com/kubb-project/kubb/commit/71b2478bd02bf77e6d0d2277e3dce6e9546c32d2))
* init cli ([2f79cb0](https://github.com/kubb-project/kubb/commit/2f79cb08141f924b3c3834183fbe97b197acef20))
* no banner for subpackage client ([a0a6627](https://github.com/kubb-project/kubb/commit/a0a6627a0e3215884fdde191a9a153a309516e57))
* no fileManager needed for OperationGenerator + this.addFile change with multiParams ([cde8225](https://github.com/kubb-project/kubb/commit/cde8225a5207360bd17f4ede66ce2a07d5dfd53d))
* pluginManager with `api` config will now be an function so the `core` functionality is accessible when using `this` ([4306318](https://github.com/kubb-project/kubb/commit/43063189a1a18ed2aca23b0505d3163aeddbc2ef))
* remove propdrilling of directory ([99b8016](https://github.com/kubb-project/kubb/commit/99b801658a514a223e590d14f7d7729e85391ffc))
* resolvePath and resolveName sync ([935ca2a](https://github.com/kubb-project/kubb/commit/935ca2a137006d9a59ef276e16f54770391b0a42))
* use methods of path instead of all methods + removal of `getOperation`(no check needed on `operationId`) ([2978ad7](https://github.com/kubb-project/kubb/commit/2978ad7e42b3ccb6c52088bec949afa32192a883))
* use of camelCaseTransformMerge for every camelcase transform ([69f77ec](https://github.com/kubb-project/kubb/commit/69f77ecb45d62c14cb5ec7724cc64c9fe63a2365))
* warning with correct cli message(validate for swagger) ([b091e28](https://github.com/kubb-project/kubb/commit/b091e282f079e7694bf04a35ea6a0ebfd3aa06da))
</details>

<details><summary>@kubb/swagger-tanstack-query: 1.3.1</summary>

## [1.3.1](https://github.com/kubb-project/kubb/compare/@kubb/swagger-tanstack-query-v1.3.3...@kubb/swagger-tanstack-query-v1.3.1) (2023-06-27)


### =Ú Documentation

* documentation for client and globals ([8f2b478](https://github.com/kubb-project/kubb/commit/8f2b478f91f307d7b322466bf623f9f8d192b876))


### ( Features

* `client.ts` with the use of `process.env` override to set options for `axios` ([89c0d08](https://github.com/kubb-project/kubb/commit/89c0d08986255fd554f1d6df661b0a9a2a83847a))
* `groupBy.exportAs` to make it possible go group all import with `export * as groupBy.exportAs from "./x"` ([214ff25](https://github.com/kubb-project/kubb/commit/214ff250e8ecf23d754a456c1b9289c6475099e0))
* ( add `reset.d.ts` to the `@kubb/ts-config` that can be used to override default TypeScrip types ([ae47aa5](https://github.com/kubb-project/kubb/commit/ae47aa5bbffc0f24d878e917eda3047856ca3fc7))
* ( useInfiniteQuery for `React`, `Solid`, `Svelte` and `Vue` ([d683cc7](https://github.com/kubb-project/kubb/commit/d683cc7909818757f62560bc1936b79bd0a79bfe))
* error type for swr and tanstack-query ([7c71f72](https://github.com/kubb-project/kubb/commit/7c71f7216ef22f3a87fbac7fc10920aac69704ed))
* groupby as object with `type` and `output` which can be customised with a handlebar like syntax ([c687864](https://github.com/kubb-project/kubb/commit/c687864b2ac82643757ef7b2f6158410144a73fe))
* use of `cac` instead of `commander` ([3814acb](https://github.com/kubb-project/kubb/commit/3814acb392f882ded2a75ef987ccdd79227a9238))
* use of `exports` for the fileManager ([e0582ee](https://github.com/kubb-project/kubb/commit/e0582eef921d10d3fc35af8a802ef2d81f790639))
* useInfiniteQuery for `React` ([effe453](https://github.com/kubb-project/kubb/commit/effe4535c51cf20b42a6f112bb757e1bbfbd8dcc))


### = Bug Fixes

* add `QueryBuilder` for Tanstack/query generators ([3c4ea57](https://github.com/kubb-project/kubb/commit/3c4ea57077a0d1c131a2f692e9f2a55c6bcec468))
* add TError on more places ([7668d6a](https://github.com/kubb-project/kubb/commit/7668d6a7403d257580aae50bad7a85e288a37715))
* advanced queue ([e8e90b9](https://github.com/kubb-project/kubb/commit/e8e90b9cbeadad793b759a174641874dc39c2c01))
* better operationGeneration + schemas.request could be optional ([cf10b02](https://github.com/kubb-project/kubb/commit/cf10b0242761847133ebf01bae64d0bfed1334ab))
* correct use of `path.resolve` so windows can transform / to \ ([a4052e2](https://github.com/kubb-project/kubb/commit/a4052e24ec57e3920a6285d1b4bee9570f2e4e9f))
* correct use of params ([2352c51](https://github.com/kubb-project/kubb/commit/2352c511fc7fd76adfed1260773c3f6fdee3b23a))
* drop of node 16 in favour of node 18 as minimum version ([f4112ef](https://github.com/kubb-project/kubb/commit/f4112efc4abc3a95e50b58a3fa925c7425d911dd))
* duplicate import names ([7a8e6fa](https://github.com/kubb-project/kubb/commit/7a8e6fa3f00e37c771b15fb0287adc1dd166acb7))
* exclude queryParams for method DELETE ([71b2478](https://github.com/kubb-project/kubb/commit/71b2478bd02bf77e6d0d2277e3dce6e9546c32d2))
* init cli ([2f79cb0](https://github.com/kubb-project/kubb/commit/2f79cb08141f924b3c3834183fbe97b197acef20))
* no fileManager needed for OperationGenerator + this.addFile change with multiParams ([cde8225](https://github.com/kubb-project/kubb/commit/cde8225a5207360bd17f4ede66ce2a07d5dfd53d))
* pluginManager with `api` config will now be an function so the `core` functionality is accessible when using `this` ([4306318](https://github.com/kubb-project/kubb/commit/43063189a1a18ed2aca23b0505d3163aeddbc2ef))
* remove propdrilling of directory ([99b8016](https://github.com/kubb-project/kubb/commit/99b801658a514a223e590d14f7d7729e85391ffc))
* resolvePath and resolveName sync ([935ca2a](https://github.com/kubb-project/kubb/commit/935ca2a137006d9a59ef276e16f54770391b0a42))
* TError should use | instead of & when using multiple error types ([e5a7849](https://github.com/kubb-project/kubb/commit/e5a78499c666d7cdec815a47ae29b96b0a06ece4))
* use of camelCaseTransformMerge for every camelcase transform ([69f77ec](https://github.com/kubb-project/kubb/commit/69f77ecb45d62c14cb5ec7724cc64c9fe63a2365))
* warning with correct cli message(validate for swagger) ([b091e28](https://github.com/kubb-project/kubb/commit/b091e282f079e7694bf04a35ea6a0ebfd3aa06da))


### =æ Miscellaneous Chores

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
</details>

<details><summary>@kubb/swagger-faker: 1.3.1</summary>

## [1.3.1](https://github.com/kubb-project/kubb/compare/@kubb/swagger-faker-v1.3.3...@kubb/swagger-faker-v1.3.1) (2023-06-27)


### =æ Miscellaneous Chores

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


### ( Features

* `client.ts` with the use of `process.env` override to set options for `axios` ([89c0d08](https://github.com/kubb-project/kubb/commit/89c0d08986255fd554f1d6df661b0a9a2a83847a))
* ( `swagger-form` FormGenerator and FormParser ([6424e5f](https://github.com/kubb-project/kubb/commit/6424e5f48960a24313e4ce2c115fd58af3cde814))
* ( add `reset.d.ts` to the `@kubb/ts-config` that can be used to override default TypeScrip types ([ae47aa5](https://github.com/kubb-project/kubb/commit/ae47aa5bbffc0f24d878e917eda3047856ca3fc7))
* **swagger-faker:** <‰ swagger-faker package ([8e45eb4](https://github.com/kubb-project/kubb/commit/8e45eb4b61a280403c0904aebc8a8dbc6ce9e7bc))
* use of `cac` instead of `commander` ([3814acb](https://github.com/kubb-project/kubb/commit/3814acb392f882ded2a75ef987ccdd79227a9238))


### = Bug Fixes

* `fakerParser`, `formParser` and `zodParser` with custom mapper ([77151ba](https://github.com/kubb-project/kubb/commit/77151ba528759a032d8b86db98694c28a232be16))
* add types to mocks based on `@kubb/swagger-ts` ([5b51fe0](https://github.com/kubb-project/kubb/commit/5b51fe01b237f99b801bb76d9bb71578dba70113))
* advanced queue ([e8e90b9](https://github.com/kubb-project/kubb/commit/e8e90b9cbeadad793b759a174641874dc39c2c01))
* date, uri, and uui support for `faker.js` ([203f701](https://github.com/kubb-project/kubb/commit/203f7016d6e9f353e31655b908a62af7eb8e8965))
* default for Zod and TypeScript ([6602116](https://github.com/kubb-project/kubb/commit/660211670f9f4ea9e76ec482629844801050dc92))
* drop of node 16 in favour of node 18 as minimum version ([f4112ef](https://github.com/kubb-project/kubb/commit/f4112efc4abc3a95e50b58a3fa925c7425d911dd))
* init cli ([2f79cb0](https://github.com/kubb-project/kubb/commit/2f79cb08141f924b3c3834183fbe97b197acef20))
* oneOf and allOf should check if properties exists(else we have a z.any/any) ([1914b6a](https://github.com/kubb-project/kubb/commit/1914b6a25e8266eb635459c4e9354b33df4fc4ad))
* pluginManager with `api` config will now be an function so the `core` functionality is accessible when using `this` ([4306318](https://github.com/kubb-project/kubb/commit/43063189a1a18ed2aca23b0505d3163aeddbc2ef))
* remove `lodash` dependency ([8729ef8](https://github.com/kubb-project/kubb/commit/8729ef8f3f3d487b7c239f015e8321aabe17bd3b))


### =Ú Documentation

* documentation for client and globals ([8f2b478](https://github.com/kubb-project/kubb/commit/8f2b478f91f307d7b322466bf623f9f8d192b876))
* react-hook-form + data-driven-forms example ([df538f9](https://github.com/kubb-project/kubb/commit/df538f95763976c2fe544c761b13288b62b182ef))
</details>

<details><summary>@kubb/swagger-zod: 1.3.1</summary>

## [1.3.1](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zod-v1.3.3...@kubb/swagger-zod-v1.3.1) (2023-06-27)


### =æ Miscellaneous Chores

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


### ( Features

* `client.ts` with the use of `process.env` override to set options for `axios` ([89c0d08](https://github.com/kubb-project/kubb/commit/89c0d08986255fd554f1d6df661b0a9a2a83847a))
* `groupBy.exportAs` to make it possible go group all import with `export * as groupBy.exportAs from "./x"` ([214ff25](https://github.com/kubb-project/kubb/commit/214ff250e8ecf23d754a456c1b9289c6475099e0))
* ( `swagger-form` FormGenerator and FormParser ([6424e5f](https://github.com/kubb-project/kubb/commit/6424e5f48960a24313e4ce2c115fd58af3cde814))
* ( add `reset.d.ts` to the `@kubb/ts-config` that can be used to override default TypeScrip types ([ae47aa5](https://github.com/kubb-project/kubb/commit/ae47aa5bbffc0f24d878e917eda3047856ca3fc7))
* enumType to use an `Enum` or use `* as const` ([29b396f](https://github.com/kubb-project/kubb/commit/29b396f6980f1119502a0f40e5bb4f7e43346480))
* groupby as object with `type` and `output` which can be customised with a handlebar like syntax ([c687864](https://github.com/kubb-project/kubb/commit/c687864b2ac82643757ef7b2f6158410144a73fe))
* **swagger-faker:** <‰ swagger-faker package ([8e45eb4](https://github.com/kubb-project/kubb/commit/8e45eb4b61a280403c0904aebc8a8dbc6ce9e7bc))
* **swagger-zod:** use of prefixItems to create a Zod tuple ([5c5625c](https://github.com/kubb-project/kubb/commit/5c5625c75d020790d125e386d6222fcdddcf85e5))
* use of `cac` instead of `commander` ([3814acb](https://github.com/kubb-project/kubb/commit/3814acb392f882ded2a75ef987ccdd79227a9238))
* use of `exports` for the fileManager ([e0582ee](https://github.com/kubb-project/kubb/commit/e0582eef921d10d3fc35af8a802ef2d81f790639))


### = Bug Fixes

* `fakerParser`, `formParser` and `zodParser` with custom mapper ([77151ba](https://github.com/kubb-project/kubb/commit/77151ba528759a032d8b86db98694c28a232be16))
* `z.union` does not work on a single element ([a646a5c](https://github.com/kubb-project/kubb/commit/a646a5c96854d8d8395e26758c3cf4fad35633f5))
* add types to mocks based on `@kubb/swagger-ts` ([5b51fe0](https://github.com/kubb-project/kubb/commit/5b51fe01b237f99b801bb76d9bb71578dba70113))
* advanced queue ([e8e90b9](https://github.com/kubb-project/kubb/commit/e8e90b9cbeadad793b759a174641874dc39c2c01))
* correct use of `path.resolve` so windows can transform / to \ ([a4052e2](https://github.com/kubb-project/kubb/commit/a4052e24ec57e3920a6285d1b4bee9570f2e4e9f))
* correct use of params ([2352c51](https://github.com/kubb-project/kubb/commit/2352c511fc7fd76adfed1260773c3f6fdee3b23a))
* date, email uri, nullish and uui support for `zod` ([63bb669](https://github.com/kubb-project/kubb/commit/63bb669fc7f1fc58095fe620c612cceef7404592))
* default for Zod and TypeScript ([6602116](https://github.com/kubb-project/kubb/commit/660211670f9f4ea9e76ec482629844801050dc92))
* drop of node 16 in favour of node 18 as minimum version ([f4112ef](https://github.com/kubb-project/kubb/commit/f4112efc4abc3a95e50b58a3fa925c7425d911dd))
* duplicate import names ([7a8e6fa](https://github.com/kubb-project/kubb/commit/7a8e6fa3f00e37c771b15fb0287adc1dd166acb7))
* duplocated queryParams(coming from the pathParams) ([714281f](https://github.com/kubb-project/kubb/commit/714281f5d511c02c130a66b75e774f231ee06e9b))
* enums for `Zod` cannot have min/max ([79b8374](https://github.com/kubb-project/kubb/commit/79b8374d76063bf89e3a48fdef7ebea0aa84c808))
* include errors in Typescript and Zod ([5885041](https://github.com/kubb-project/kubb/commit/588504121b1aae9498218284a41ab43a8c78f861))
* init cli ([2f79cb0](https://github.com/kubb-project/kubb/commit/2f79cb08141f924b3c3834183fbe97b197acef20))
* no fileManager needed for OperationGenerator + this.addFile change with multiParams ([cde8225](https://github.com/kubb-project/kubb/commit/cde8225a5207360bd17f4ede66ce2a07d5dfd53d))
* oneOf and allOf should check if properties exists(else we have a z.any/any) ([1914b6a](https://github.com/kubb-project/kubb/commit/1914b6a25e8266eb635459c4e9354b33df4fc4ad))
* pluginManager with `api` config will now be an function so the `core` functionality is accessible when using `this` ([4306318](https://github.com/kubb-project/kubb/commit/43063189a1a18ed2aca23b0505d3163aeddbc2ef))
* ref.name ?? ref.propertyName so unique names can be used ([4df0984](https://github.com/kubb-project/kubb/commit/4df0984f3131b85146edda0c10ab7d4e1fec87d1))
* remove `lodash` dependency ([8729ef8](https://github.com/kubb-project/kubb/commit/8729ef8f3f3d487b7c239f015e8321aabe17bd3b))
* remove propdrilling of directory ([99b8016](https://github.com/kubb-project/kubb/commit/99b801658a514a223e590d14f7d7729e85391ffc))
* resolvePath and resolveName sync ([935ca2a](https://github.com/kubb-project/kubb/commit/935ca2a137006d9a59ef276e16f54770391b0a42))
* use of camelCaseTransformMerge for every camelcase transform ([69f77ec](https://github.com/kubb-project/kubb/commit/69f77ecb45d62c14cb5ec7724cc64c9fe63a2365))
* writeIndexes without write, use of the filemanager instead ([5359521](https://github.com/kubb-project/kubb/commit/53595216451a21f25a8687e564c16f4d13d1f594))
* zod import without 'default export' ([c703153](https://github.com/kubb-project/kubb/commit/c7031534279ebe99ab5b9926eb2d57b2458ad4ab))


### =Ú Documentation

* documentation for client and globals ([8f2b478](https://github.com/kubb-project/kubb/commit/8f2b478f91f307d7b322466bf623f9f8d192b876))
* react-hook-form + data-driven-forms example ([df538f9](https://github.com/kubb-project/kubb/commit/df538f95763976c2fe544c761b13288b62b182ef))
</details>

<details><summary>@kubb/swagger-zodios: 1.3.1</summary>

## [1.3.1](https://github.com/kubb-project/kubb/compare/@kubb/swagger-zodios-v1.3.3...@kubb/swagger-zodios-v1.3.1) (2023-06-27)


### =Ú Documentation

* documentation for client and globals ([8f2b478](https://github.com/kubb-project/kubb/commit/8f2b478f91f307d7b322466bf623f9f8d192b876))


### = Bug Fixes

* drop of node 16 in favour of node 18 as minimum version ([f4112ef](https://github.com/kubb-project/kubb/commit/f4112efc4abc3a95e50b58a3fa925c7425d911dd))
* duplocated queryParams(coming from the pathParams) ([714281f](https://github.com/kubb-project/kubb/commit/714281f5d511c02c130a66b75e774f231ee06e9b))
* init cli ([2f79cb0](https://github.com/kubb-project/kubb/commit/2f79cb08141f924b3c3834183fbe97b197acef20))
* no fileManager needed for OperationGenerator + this.addFile change with multiParams ([cde8225](https://github.com/kubb-project/kubb/commit/cde8225a5207360bd17f4ede66ce2a07d5dfd53d))
* pluginManager with `api` config will now be an function so the `core` functionality is accessible when using `this` ([4306318](https://github.com/kubb-project/kubb/commit/43063189a1a18ed2aca23b0505d3163aeddbc2ef))
* remove propdrilling of directory ([99b8016](https://github.com/kubb-project/kubb/commit/99b801658a514a223e590d14f7d7729e85391ffc))
* resolvePath and resolveName sync ([935ca2a](https://github.com/kubb-project/kubb/commit/935ca2a137006d9a59ef276e16f54770391b0a42))
* use of camelCaseTransformMerge for every camelcase transform ([69f77ec](https://github.com/kubb-project/kubb/commit/69f77ecb45d62c14cb5ec7724cc64c9fe63a2365))
* use of transformReservedWord and better naming for req, res and params ([5574dd1](https://github.com/kubb-project/kubb/commit/5574dd1fa597c84d03d65547cab0b819049380a3))


### ( Features

* `client.ts` with the use of `process.env` override to set options for `axios` ([89c0d08](https://github.com/kubb-project/kubb/commit/89c0d08986255fd554f1d6df661b0a9a2a83847a))
* ( add `reset.d.ts` to the `@kubb/ts-config` that can be used to override default TypeScrip types ([ae47aa5](https://github.com/kubb-project/kubb/commit/ae47aa5bbffc0f24d878e917eda3047856ca3fc7))
* error type for swr and tanstack-query ([7c71f72](https://github.com/kubb-project/kubb/commit/7c71f7216ef22f3a87fbac7fc10920aac69704ed))
* use of `cac` instead of `commander` ([3814acb](https://github.com/kubb-project/kubb/commit/3814acb392f882ded2a75ef987ccdd79227a9238))
* use of `exports` for the fileManager ([e0582ee](https://github.com/kubb-project/kubb/commit/e0582eef921d10d3fc35af8a802ef2d81f790639))
* zodios with errors ([3470b6d](https://github.com/kubb-project/kubb/commit/3470b6d6828a35cbac4785c24e7e06344c9df8ac))


### =æ Miscellaneous Chores

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
</details>

<details><summary>@kubb/swagger-swr: 1.3.1</summary>

## [1.3.1](https://github.com/kubb-project/kubb/compare/@kubb/swagger-swr-v1.3.3...@kubb/swagger-swr-v1.3.1) (2023-06-27)


### =Ú Documentation

* documentation for client and globals ([8f2b478](https://github.com/kubb-project/kubb/commit/8f2b478f91f307d7b322466bf623f9f8d192b876))


### ( Features

* `client.ts` with the use of `process.env` override to set options for `axios` ([89c0d08](https://github.com/kubb-project/kubb/commit/89c0d08986255fd554f1d6df661b0a9a2a83847a))
* `groupBy.exportAs` to make it possible go group all import with `export * as groupBy.exportAs from "./x"` ([214ff25](https://github.com/kubb-project/kubb/commit/214ff250e8ecf23d754a456c1b9289c6475099e0))
* ( add `reset.d.ts` to the `@kubb/ts-config` that can be used to override default TypeScrip types ([ae47aa5](https://github.com/kubb-project/kubb/commit/ae47aa5bbffc0f24d878e917eda3047856ca3fc7))
* enumType to use an `Enum` or use `* as const` ([29b396f](https://github.com/kubb-project/kubb/commit/29b396f6980f1119502a0f40e5bb4f7e43346480))
* error type for swr and tanstack-query ([7c71f72](https://github.com/kubb-project/kubb/commit/7c71f7216ef22f3a87fbac7fc10920aac69704ed))
* groupby as object with `type` and `output` which can be customised with a handlebar like syntax ([c687864](https://github.com/kubb-project/kubb/commit/c687864b2ac82643757ef7b2f6158410144a73fe))
* use of `cac` instead of `commander` ([3814acb](https://github.com/kubb-project/kubb/commit/3814acb392f882ded2a75ef987ccdd79227a9238))
* use of `exports` for the fileManager ([e0582ee](https://github.com/kubb-project/kubb/commit/e0582eef921d10d3fc35af8a802ef2d81f790639))


### = Bug Fixes

* add `QueryBuilder` for our SWR generator + ReturnType ([5bfc99c](https://github.com/kubb-project/kubb/commit/5bfc99c364143acb10bf8c457ed53562b579b180))
* advanced queue ([e8e90b9](https://github.com/kubb-project/kubb/commit/e8e90b9cbeadad793b759a174641874dc39c2c01))
* better operationGeneration + schemas.request could be optional ([cf10b02](https://github.com/kubb-project/kubb/commit/cf10b0242761847133ebf01bae64d0bfed1334ab))
* correct use of `path.resolve` so windows can transform / to \ ([a4052e2](https://github.com/kubb-project/kubb/commit/a4052e24ec57e3920a6285d1b4bee9570f2e4e9f))
* correct use of params ([2352c51](https://github.com/kubb-project/kubb/commit/2352c511fc7fd76adfed1260773c3f6fdee3b23a))
* drop of node 16 in favour of node 18 as minimum version ([f4112ef](https://github.com/kubb-project/kubb/commit/f4112efc4abc3a95e50b58a3fa925c7425d911dd))
* duplicate import names ([7a8e6fa](https://github.com/kubb-project/kubb/commit/7a8e6fa3f00e37c771b15fb0287adc1dd166acb7))
* exclude queryParams for method DELETE ([71b2478](https://github.com/kubb-project/kubb/commit/71b2478bd02bf77e6d0d2277e3dce6e9546c32d2))
* init cli ([2f79cb0](https://github.com/kubb-project/kubb/commit/2f79cb08141f924b3c3834183fbe97b197acef20))
* no fileManager needed for OperationGenerator + this.addFile change with multiParams ([cde8225](https://github.com/kubb-project/kubb/commit/cde8225a5207360bd17f4ede66ce2a07d5dfd53d))
* pluginManager with `api` config will now be an function so the `core` functionality is accessible when using `this` ([4306318](https://github.com/kubb-project/kubb/commit/43063189a1a18ed2aca23b0505d3163aeddbc2ef))
* remove propdrilling of directory ([99b8016](https://github.com/kubb-project/kubb/commit/99b801658a514a223e590d14f7d7729e85391ffc))
* resolvePath and resolveName sync ([935ca2a](https://github.com/kubb-project/kubb/commit/935ca2a137006d9a59ef276e16f54770391b0a42))
* TError should use | instead of & when using multiple error types ([e5a7849](https://github.com/kubb-project/kubb/commit/e5a78499c666d7cdec815a47ae29b96b0a06ece4))
* type update for `SWR@2.2.0` ([6358699](https://github.com/kubb-project/kubb/commit/6358699e5f32846dcc889322f834c679438def16))
* use of camelCaseTransformMerge for every camelcase transform ([69f77ec](https://github.com/kubb-project/kubb/commit/69f77ecb45d62c14cb5ec7724cc64c9fe63a2365))
* warning with correct cli message(validate for swagger) ([b091e28](https://github.com/kubb-project/kubb/commit/b091e282f079e7694bf04a35ea6a0ebfd3aa06da))


### =æ Miscellaneous Chores

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
</details>

<details><summary>@kubb/swagger-form: 1.3.1</summary>

## 1.3.1 (2023-06-27)


### =æ Miscellaneous Chores

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


### = Bug Fixes

* `fakerParser`, `formParser` and `zodParser` with custom mapper ([77151ba](https://github.com/kubb-project/kubb/commit/77151ba528759a032d8b86db98694c28a232be16))
* paths to include multiLevel objects(`fullName`) ([918482d](https://github.com/kubb-project/kubb/commit/918482d59ac82fe9812a563333de71d78db4e079))


### ( Features

* ( `mapper` and `extraImports` to override default mapper ([9b8c6e2](https://github.com/kubb-project/kubb/commit/9b8c6e21e891ec8f4d5d6a581ec8a18fbb616462))
* ( `swagger-form` FormGenerator and FormParser ([6424e5f](https://github.com/kubb-project/kubb/commit/6424e5f48960a24313e4ce2c115fd58af3cde814))
* ( `swagger-form` package for `react-hook-form` ([567e33c](https://github.com/kubb-project/kubb/commit/567e33c8cb11f50562f60039166a55264282bbb9))


### =Ú Documentation

* react-hook-form + data-driven-forms example ([df538f9](https://github.com/kubb-project/kubb/commit/df538f95763976c2fe544c761b13288b62b182ef))
* swagger-form ([2aab49c](https://github.com/kubb-project/kubb/commit/2aab49cc24edbc90529421cb4edc300139046ee9))
* update docs ([a246bb1](https://github.com/kubb-project/kubb/commit/a246bb1171a95ba9d639468c5f8214573bd33513))
</details>

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).