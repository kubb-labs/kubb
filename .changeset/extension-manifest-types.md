---
'@kubb/core': patch
'@kubb/kit': patch
'@kubb/studio': patch
---

Add the `ExtensionManifest` and `ExtensionManifestOption` types for the `kubb-extension.json` file an extension package ships, plus the `RegistryEntry` and `RegistryDetail` types of the kubb.dev registry. `@kubb/core` also exports `isExtensionManifest`, `isPackageName`, and `checkCompatibility`, and `ExtensionMeta` takes `media`.

The Studio agent reports the installed extensions that ship a `kubb-extension.json` in `config.extensions` when it connects. Studio can run third-party plugins installed in the project that ship a `kubb-extension.json`, and loads them through the manifest's `export`. `@kubb/studio` exports `applyConfigEdits`, `writeConfigEdits`, and `discoverExtensions`.
