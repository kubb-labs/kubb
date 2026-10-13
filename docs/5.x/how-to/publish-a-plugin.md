---
layout: doc
title: Publish a plugin
description: Build a Kubb plugin as an npm package with a kubb-extension.json
  manifest and a docs folder, publish it, and submit it to the Kubb registry.
outline: [2, 3]
order: 7
navigation:
  title: Publish a plugin
  icon: i-iconoir-upload
---

# Publish a plugin

Publish a plugin to npm, then list it in the Kubb registry so users can install it with `kubb add` and find it in Studio. Start from a working plugin with tests, such as the one from [Create and extend a plugin](/docs/5.x/tutorials/creating-plugins). Adapters and parsers follow the same steps.

::steps{level="2"}

## Build the package

Export the factory from a package entrypoint. Use a `.js` extension for the relative import so the compiled ESM works in Node:

```typescript [src/index.ts]
export { pluginExample } from './plugin.js'
```

Create a TypeScript build config:

```json [tsconfig.json]
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "declaration": true,
    "skipLibCheck": true,
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src/index.ts", "src/plugin.ts"]
}
```

Add the following fields to your existing `package.json`, keeping the development dependencies installed earlier. Replace the package name with an available name you own before publishing:

```json [package.json fields]
{
  "name": "kubb-plugin-example",
  "version": "1.0.0",
  "type": "module",
  "files": ["dist", "kubb-extension.json", "docs"],
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "test": "vitest run src/plugin.test.ts",
    "prepack": "npm run build && npm test"
  },
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./kubb-extension.json": "./kubb-extension.json",
    "./package.json": "./package.json"
  },
  "peerDependencies": { "kubb": "^5.0.0" }
}
```

`files` ships the manifest and the docs folder you add next. The `exports` entries keep `kubb-extension.json` and `package.json` importable, because an `exports` map hides every path it does not list.

Keep `kubb` as a development dependency so you can build and test locally. The peer dependency asks users for a compatible Kubb version.

## Add the manifest

Create `kubb-extension.json` at the package root. It tells the registry, `kubb add`, and Studio what the package is and which factory to call:

```json [kubb-extension.json]
{
  "$schema": "https://kubb.dev/schemas/kubb-extension.json",
  "kind": "plugin",
  "name": "plugin-example",
  "export": "pluginExample",
  "displayName": "Example",
  "description": "Writes a comment with the HTTP method and path of every operation.",
  "maintainers": [{ "name": "Acme", "github": "acme" }],
  "compatibility": { "kubb": ">=5.8.3", "node": ">=22" },
  "options": [
    {
      "key": "prefix",
      "path": ["prefix"],
      "label": "Prefix",
      "description": "Text written at the start of every comment.",
      "type": "text"
    }
  ]
}
```

Set `name` to the plugin's `meta.name` and `export` to the factory that `src/index.ts` exports. Add an `options` entry for each option users should edit in Studio.

Give `meta.compatibility` in `src/plugin.ts` the same ranges, `{ kubb: '>=5.8.3', node: '>=22' }`, so Kubb checks them at runtime too. With a bundler, [import `compatibility` from the manifest](/docs/5.x/reference/kit/manifest#import-compatibility-into-meta) instead. [Extension manifest](/docs/5.x/reference/kit/manifest) lists every field, including `maintainers` and `dependencies`.

## Write the docs {#write-the-docs}

Create a `docs/` folder next to the manifest. kubb.dev renders it as the extension's page, and Studio shows the overview as its summary:

```text [docs/]
docs/
├── overview.md        required
├── options.md         optional
└── guides/
    └── <id>.md        optional, one file per how-to guide
```

Start each file with a `#` title and a one-paragraph description. [Extension docs](/docs/5.x/reference/kit/extension-docs) lists the naming rules and the Markdown that renders.

In `overview.md`, say what the extension does, how it works when that is not obvious, the setup it needs, and the options and limits worth knowing. Put the full option reference in `options.md` and each task in its own guide.

Leave out install commands, because the page already shows how to install.

Keep a README with installation and a Kubb config example, and include a license file.

## Check the tarball

Build, inspect the files npm would include, and create a local tarball:

```shell [Terminal]
npm run build
npm pack --dry-run
npm pack
```

The dry run should list the `dist/` files, `kubb-extension.json`, the `docs/` files, and `package.json`, but no fixture, tests, or generated client files. `prepack` runs the build and both tests first.

## Publish to npm

When the tarball looks right and the package name and version are correct, sign in to npm and publish:

```shell [Terminal]
npm login
npm publish --access public
```

## Submit to the registry {#submit-to-the-registry}

Submit the package so users can install it with `kubb add`. [Submit to the registry](/docs/5.x/how-to/submit-to-the-registry) covers the submission issue, the review, how new versions reach users, and publishing from a GitHub release instead of npm.

::
