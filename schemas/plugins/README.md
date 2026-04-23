# Plugin Metadata Schemas

This directory contains JSON schemas for Kubb plugin metadata, inspired by the [Nuxt Modules](https://github.com/nuxt/modules) registry pattern.

## Overview

The plugin metadata system enables:

- **Distributed maintenance**: Each plugin maintains its own metadata
- **Auto-generated documentation**: Pages generated from structured data
- **Skill discovery**: Plugin capabilities exposed for AI tools

## Schemas

### `plugin.json`

Schema for individual plugin metadata files. Each plugin package should include a `plugin.json` file with this structure.

**Schema URL**: `https://kubb.dev/schemas/plugin.json`

### `plugins.json`

Schema for the aggregated plugin registry. This is maintained in the kubb.dev repository.

**Schema URL**: `https://kubb.dev/schemas/plugins.json`

## Plugin Metadata Structure

### Required Fields

| Field | Type | Description |
| ----- | ---- | ----------- |
| `id` | `string` | Unique identifier (e.g., `plugin-react-query`) |
| `name` | `string` | Display name |
| `description` | `string` | Short description |
| `category` | `string` | Plugin category |
| `type` | `string` | `official`, `community`, or `3rd-party` |
| `npmPackage` | `string` | NPM package name |

### Optional Fields

| Field | Type | Description |
| ----- | ---- | ----------- |
| `compatibility` | `object` | Kubb and Node.js version constraints |
| `maintainers` | `array` | Plugin maintainers with GitHub info |
| `repo` | `string` | Source repository URL |
| `docsPath` | `string` | Documentation path on kubb.dev |
| `resources` | `object` | Related URLs (docs, issues, changelog, codesandbox) |
| `icon` | `object` | Light/dark icon URLs |
| `featured` | `boolean` | Feature prominently on homepage |
| `tags` | `array` | Discovery tags |
| `dependencies` | `array` | Required Kubb plugin IDs |
| `options` | `array` | Plugin configuration options for auto-generated reference docs |
| `examples` | `array` | Example tabs rendered as the page-level Example section |
| `intro` | `string` | Free-form markdown rendered between header and installation |
| `notes` | `array` | Page-level callouts |

## Categories

| ID | Name |
| -- | ---- |
| `ai` | AI |
| `client` | Client |
| `documentation` | Documentation |
| `framework` | Framework |
| `mocks` | Mocks |
| `testing` | Testing |
| `types` | Types |
| `validation` | Validation |

## Example

```yaml
$schema: 'https://kubb.dev/schemas/plugin.json'
id: plugin-react-query
name: React Query
description: Generate React Query hooks from API specifications.
category: framework
type: official
npmPackage: '@kubb/plugin-react-query'
docsPath: /plugins/plugin-react-query
repo: https://github.com/kubb-labs/kubb
maintainers:
  - name: Stijn Van Hulle
    github: stijnvanhulle
compatibility:
  kubb: '>=5.0.0'
  node: '>=22'
tags:
  - react
  - hooks
  - tanstack-query
dependencies:
  - plugin-oas
  - plugin-ts
featured: true
```

## Usage

### Validating Plugin Metadata

Use the schema URL in your YAML frontmatter:

```yaml
$schema: 'https://kubb.dev/schemas/plugin.json'
id: my-plugin
# ...
```
