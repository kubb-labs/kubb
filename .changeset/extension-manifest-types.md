---
'@kubb/core': patch
'@kubb/kit': patch
'@kubb/studio': patch
---

Add the `ExtensionManifest` and `ExtensionManifestOption` types for the `kubb-extension.json` file an extension package ships, plus the `RegistryEntry`, `RegistryIndex`, and `RegistryDetail` types of the Kubb extension registry. `@kubb/core` also exports `isExtensionManifest`, `manifestProblems`, `isRegistryEntry`, `isPackageName`, `checkCompatibility`, and `readInstalledPackages`, which reads the version and manifest of each installed dependency, and `ExtensionMeta` takes `media`.

The manifest types and checks are also available from `@kubb/core/manifest`, which has no Node.js dependencies, so browsers and other tools can validate manifests without the rest of `@kubb/core`. The package ships the manifest JSON Schema at `@kubb/core/schemas/kubb-extension.json`, served at `https://kubb.dev/schemas/kubb-extension.json`.

The Studio agent reports the installed extensions that ship a `kubb-extension.json` in `config.extensions` when it connects. Studio can run third-party plugins installed in the project that ship a `kubb-extension.json`, and loads them through the manifest's `export`. `@kubb/studio` exports `writeConfigEdits`.
