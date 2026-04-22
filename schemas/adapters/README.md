# Adapter Metadata Schemas

This directory contains JSON schemas for Kubb adapter metadata, mirroring the plugin metadata schemas.

## Overview

Adapters parse and convert input specifications (OpenAPI, GraphQL, gRPC, AsyncAPI, JSON) into Kubb's universal AST that downstream plugins consume.

The adapter metadata system enables:

- **Distributed maintenance**: Each adapter maintains its own metadata
- **Auto-generated documentation**: Pages generated from structured data
- **Skill discovery**: Adapter capabilities exposed for AI tools

## Schemas

### `adapter.json`

Schema for individual adapter metadata files. Each adapter package should include an `adapter.json` (or YAML equivalent) with this structure.

**Schema URL**: `https://kubb.dev/schemas/adapter.json`

### `adapters.json`

Schema for the aggregated adapter registry. This is maintained in the kubb.dev repository.

**Schema URL**: `https://kubb.dev/schemas/adapters.json`

## Adapter Metadata Structure

### Required Fields

| Field | Type | Description |
| ----- | ---- | ----------- |
| `id` | `string` | Unique identifier (e.g., `adapter-oas`) |
| `name` | `string` | Display name |
| `description` | `string` | Short description |
| `category` | `string` | Adapter category (input spec family) |
| `type` | `string` | `official`, `community`, or `3rd-party` |
| `npmPackage` | `string` | NPM package name |

### Optional Fields

| Field | Type | Description |
| ----- | ---- | ----------- |
| `compatibility` | `object` | Kubb and Node.js version constraints |
| `maintainers` | `array` | Adapter maintainers with GitHub info |
| `repo` | `string` | Source repository URL |
| `docsPath` | `string` | Documentation path on kubb.dev |
| `resources` | `object` | Related URLs (docs, issues, changelog) |
| `icon` | `object` | Light/dark icon URLs |
| `featured` | `boolean` | Feature prominently on homepage |
| `tags` | `array` | Discovery tags |
| `dependencies` | `array` | Required Kubb adapter IDs |
| `options` | `array` | Adapter configuration options for auto-generated reference docs |
| `examples` | `array` | Example tabs rendered as the page-level Example section |
| `intro` | `string` | Free-form markdown rendered between header and installation |
| `notes` | `array` | Page-level callouts |

## Categories

| ID | Name |
| -- | ---- |
| `openapi` | OpenAPI |
| `graphql` | GraphQL |
| `grpc` | gRPC |
| `asyncapi` | AsyncAPI |
| `json` | JSON |

## Example

```yaml
$schema: 'https://kubb.dev/schemas/adapters/adapter.json'
id: adapter-oas
name: OpenAPI
description: Parse and convert OpenAPI 2.0, 3.0, and 3.1 specifications into Kubb's universal AST.
category: openapi
type: official
npmPackage: '@kubb/adapter-oas'
docsPath: /adapters/adapter-oas
repo: https://github.com/kubb-labs/kubb
maintainers:
  - name: Stijn Van Hulle
    github: stijnvanhulle
compatibility:
  kubb: '>=5.0.0'
  node: '>=22'
tags:
  - openapi
  - swagger
  - parser
featured: true
```

## Usage

### Validating Adapter Metadata

Use the schema URL in your YAML frontmatter:

```yaml
$schema: 'https://kubb.dev/schemas/adapter.json'
id: my-adapter
# ...
```
