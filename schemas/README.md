# Extension Metadata Schemas

This directory contains the JSON schema and registry schemas for the Kubb extension system.

## Overview

Every Kubb extension — plugin, adapter, middleware, or parser — ships an `extension.yaml` file at its package root. This file is a self-contained manifest describing the extension's kind, options, examples, and resources.

The metadata system enables:

- **Distributed maintenance**: each package owns its manifest
- **Auto-generated documentation**: pages generated from structured data
- **Tooling discovery**: extension capabilities exposed for AI tools and registries

## Schemas

### `extension.json`

Unified schema for all extension kinds. Reference this URL in `extension.yaml` files:

```yaml
$schema: 'https://kubb.dev/schemas/extension.json'
```

The `kind` field is the discriminator:

| `kind` | Description |
|--------|-------------|
| `plugin` | Walks the AST and emits `FileNode`s |
| `adapter` | Converts an input spec into the AST |
| `middleware` | Post-processes `FileNode`s after all plugins complete |
| `parser` | Converts `FileNode`s into final source strings |

### `plugins.json` / `adapters.json` / `parsers.json` / `middlewares.json`

Registry schemas for the aggregated extension lists maintained in kubb.dev.

## Extension Manifest Structure

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `kind` | `string` | `plugin`, `adapter`, `middleware`, or `parser` |
| `id` | `string` | Unique identifier (e.g., `plugin-react-query`) |
| `name` | `string` | Display name |
| `description` | `string` | Short description |
| `type` | `string` | `official`, `community`, or `3rd-party` (authorship) |
| `npmPackage` | `string` | NPM package name |
| `category` | `string` | Category — required for plugin, adapter, parser; optional for middleware |

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `compatibility` | `object` | Kubb and Node.js version constraints |
| `maintainers` | `array` | Maintainers with GitHub info |
| `repo` | `string` | Source repository URL |
| `docsPath` | `string` | Documentation path on kubb.dev |
| `resources` | `object` | Related URLs (docs, issues, changelog, codesandbox) |
| `icon` | `object` | Light/dark icon URLs |
| `featured` | `boolean` | Feature prominently on homepage |
| `tags` | `array` | Discovery tags |
| `dependencies` | `array` | Required Kubb extension IDs |
| `options` | `array` | Configuration options for auto-generated reference docs |
| `examples` | `array` | Example tabs rendered as the page-level Example section |
| `intro` | `string` | Free-form markdown rendered between header and installation |
| `notes` | `array` | Page-level callouts |

## Third-Party Extension Template

```yaml
$schema: 'https://kubb.dev/schemas/extension.json'
kind: plugin
type: 3rd-party
id: plugin-my-thing
name: My Thing
description: What this extension generates.
npmPackage: '@my-org/plugin-my-thing'
category: client
repo: https://github.com/my-org/plugin-my-thing
maintainers:
  - name: Your Name
    github: your-github-handle
compatibility:
  kubb: '>=5.0.0'
  node: '>=22'
```

Add `extension.yaml` to the `files` array in `package.json` so it publishes with the package.
