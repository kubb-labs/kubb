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
| `version` | `string` | Semantic version |
| `npmPackage` | `string` | NPM package name |

### Optional Fields

| Field | Type | Description |
| ----- | ---- | ----------- |
| `compatibility` | `object` | Kubb and Node.js version constraints |
| `maintainers` | `array` | Plugin maintainers with GitHub info |
| `repo` | `string` | Source repository URL |
| `docsPath` | `string` | Documentation path on kubb.dev |
| `resources` | `object` | Related URLs (docs, issues, changelog) |
| `icon` | `string` | Emoji identifier |
| `featured` | `boolean` | Feature prominently on homepage |
| `tags` | `array` | Discovery tags |
| `dependencies` | `array` | Required Kubb plugin IDs |
| `skills` | `array` | Plugin capabilities for AI tools |
| `options` | `array` | Plugin configuration options for auto-generated reference docs |
| `fullExample` | `string` | Complete `kubb.config.ts` snippet used as the Example section on the reference page |

## Skills

Skills represent plugin capabilities that can be discovered by AI tools. Each skill includes:

- `name`: Skill identifier
- `description`: What the skill does
- `tags`: Categorization tags
- `dependencies`: Required packages
- `apiParameters`: Configuration options
- `examples`: Usage examples with code

## Example

```json
{
  "$schema": "https://kubb.dev/schemas/plugins/plugin.json",
  "id": "plugin-react-query",
  "name": "React Query Plugin",
  "description": "Generate React Query hooks from API specifications",
  "category": "framework",
  "type": "official",
  "version": "5.0.0",
  "npmPackage": "@kubb/plugin-react-query",
  "compatibility": {
    "kubb": ">=5.0.0",
    "node": ">=18.0.0"
  },
  "icon": "⚛️",
  "featured": true,
  "tags": ["react", "hooks", "tanstack-query"],
  "dependencies": ["plugin-oas", "plugin-ts"],
  "skills": [
    {
      "name": "generate-react-query-hooks",
      "description": "Generate React Query hooks for API endpoints",
      "tags": ["react", "hooks"],
      "examples": [
        {
          "title": "Basic usage",
          "code": "pluginReactQuery({ output: { path: './hooks' } })"
        }
      ]
    }
  ]
}
```

## Usage

### Validating Plugin Metadata

Use the schema URL in your `plugin.json`:

```json
{
  "$schema": "https://kubb.dev/schemas/plugin.json",
  "id": "my-plugin",
  ...
}
```
## Categories

| ID | Name | Description |
| -- | ---- | ----------- |
| `specification` | Specification | Core OpenAPI parsing plugins |
| `framework` | Framework | Framework-specific code generation |
| `testing` | Testing | Test utilities and mock data |
| `utility` | Utility | Validation, types, and clients |
| `documentation` | Documentation | API documentation generation |
| `ai` | AI Integration | AI and MCP integration |
