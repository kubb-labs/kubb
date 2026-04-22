# Parser Metadata Schemas

This directory contains JSON schemas for Kubb parser metadata, mirroring the plugin and adapter metadata schemas.

## Overview

Parsers turn Kubb's internal AST into source files in a target language (TypeScript, JSON, etc.). They are configured globally via `defineConfig` and consumed by every plugin that emits files.

The parser metadata system enables:

- **Distributed maintenance**: Each parser maintains its own metadata
- **Auto-generated documentation**: Pages generated from structured data
- **Skill discovery**: Parser capabilities exposed for AI tools

## Schemas

### `parser.json`

Schema for individual parser metadata files. Each parser package should include a `parser.json` (or YAML equivalent) with this structure.

**Schema URL**: `https://kubb.dev/schemas/parser.json`

### `parsers.json`

Schema for the aggregated parser registry. This is maintained in the kubb.dev repository.

**Schema URL**: `https://kubb.dev/schemas/parsers.json`

## Parser Metadata Structure

### Required Fields

| Field | Type | Description |
| ----- | ---- | ----------- |
| `id` | `string` | Unique identifier (e.g., `parser-ts`) |
| `name` | `string` | Display name |
| `description` | `string` | Short description |
| `category` | `string` | Parser category (output language family) |
| `type` | `string` | `official`, `community`, or `3rd-party` |
| `npmPackage` | `string` | NPM package name |

See `parser.json` for the full set of optional fields (compatibility, maintainers, resources, options, examples, etc.).
