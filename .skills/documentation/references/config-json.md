# Config.json Reference

Configuration structure for Kubb documentation navigation and routing.

## Overview

The `docs/config.json` file uses a custom Kubb.dev schema (not standard VitePress) to define navigation, sidebars, and routing for documentation.

**Schema location**: `https://kubb.dev/schemas/config/schema.json`

## Why config.json?

- **Separation of concerns** — Documentation config separate from VitePress build tooling
- **Schema validation** — JSON schema validates structure
- **Centralization** — Single source of truth for navigation
- **Platform agnostic** — Can transform to VitePress, Docusaurus, or other formats
- **No build dependencies** — Main repo stays clean of documentation tooling

## Structure

```json
{
  "$schema": "https://kubb.dev/schemas/config/schema.json",
  "sidebars": [/* named sidebar definitions */],
  "nav": [/* navigation items */],
  "sidebar": {/* route-to-sidebar mapping */}
}
```

## Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `sidebars` | `array` | Named sidebar definitions |
| `sidebar` | `object` | Maps route prefixes to sidebar names |

## Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `$schema` | `string` | JSON Schema reference for validation |
| `nav` | `array` | Top navigation bar items |

## Sidebars

Named sidebar definitions that can be reused across multiple routes.

```json
{
  "sidebars": [
    {
      "name": "gettingStarted",
      "value": [
        {
          "text": "Getting Started",
          "collapsed": false,
          "items": [
            {
              "text": "Introduction",
              "link": "/getting-started/introduction/"
            }
          ]
        }
      ]
    }
  ]
}
```

### Sidebar Item Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `text` | `string` | Yes | Label shown in sidebar |
| `link` | `string` | No | Target page (omit for group labels) |
| `collapsed` | `boolean` | No | Whether group is collapsed by default |
| `items` | `array` | No | Nested sidebar items |
| `target` | `string` | No | Link target (`_blank`, `_self`) |
| `activeMatch` | `string` | No | Regex for active state |

## Navigation

Top navigation bar configuration.

```json
{
  "nav": [
    {
      "text": "Docs",
      "items": [
        {
          "text": "Getting Started",
          "link": "/getting-started/introduction/"
        }
      ]
    },
    {
      "text": "GitHub",
      "link": "https://github.com/kubb-labs/fabric",
      "target": "_blank"
    }
  ]
}
```

### Nav Item Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `text` | `string` | Yes | Navigation label |
| `link` | `string` | No | Navigation target (omit for dropdown) |
| `items` | `array` | No | Dropdown menu items |
| `target` | `string` | No | Link target (`_blank`, `_self`) |
| `activeMatch` | `string` | No | Regex for active state |

## Sidebar Mapping

Maps route prefixes to named sidebars.

```json
{
  "sidebar": {
    "/getting-started": "gettingStarted",
    "/api": "api",
    "/guide": "guides",
    "/tutorials": "tutorials"
  }
}
```

**Rules**:
- Route prefix must start with `/`
- Value must match a sidebar `name` defined in `sidebars`
- VitePress selects sidebar based on current route

## Link Conventions

### Internal Links

Use absolute paths with trailing slash:

```json
{
  "text": "Introduction",
  "link": "/getting-started/introduction/"
}
```

### External Links

Include full URL and set target:

```json
{
  "text": "GitHub",
  "link": "https://github.com/kubb-labs/fabric",
  "target": "_blank"
}
```

## Best Practices

### Sidebar Organization

1. **Group related items** — Use `items` for logical grouping
2. **Start expanded** — Set `collapsed: false` for important sections
3. **Clear labels** — Use descriptive `text` values
4. **Consistent depth** — Keep nesting to 2-3 levels max

### Navigation Structure

1. **Primary actions first** — Getting Started, API, Guides
2. **Dropdown for sections** — Use `items` to group related links
3. **External links last** — GitHub, social links at end
4. **Clear hierarchy** — Use nested items for subsections

### Route Mapping

1. **Match URL structure** — `/getting-started` maps to `gettingStarted` sidebar
2. **Consistent naming** — Use camelCase for sidebar names
3. **Complete coverage** — Map all top-level routes

## Example: Adding New Section

To add a new "Examples" section:

1. **Create sidebar definition**:

```json
{
  "sidebars": [
    {
      "name": "examples",
      "value": [
        {
          "text": "Examples",
          "items": [
            {
              "text": "Basic Usage",
              "link": "/examples/basic/"
            }
          ]
        }
      ]
    }
  ]
}
```

2. **Add to navigation**:

```json
{
  "nav": [
    {
      "text": "Examples",
      "link": "/examples/basic/"
    }
  ]
}
```

3. **Map route to sidebar**:

```json
{
  "sidebar": {
    "/examples": "examples"
  }
}
```

## Validation

Validate config.json against schema:

```bash
jsonschema -i docs/config.json https://kubb.dev/schemas/config/schema.json
```

## Integration with Build System

The config.json integrates with `kubb.dev`:

1. **Edit** `config.json` in this repo
2. **Commit** changes with markdown files
3. **Sync** — Kubb.dev build system syncs repo
4. **Parse** — Reads config.json schema
5. **Generate** — Transforms to VitePress config
6. **Deploy** — Builds and publishes docs

## Common Patterns

### Collapsible Sections

```json
{
  "text": "Advanced Topics",
  "collapsed": true,
  "items": [/* nested items */]
}
```

### Dropdown Navigation

```json
{
  "text": "API",
  "items": [
    {
      "text": "Core",
      "link": "/api/core/create-fabric/"
    },
    {
      "text": "Plugins",
      "link": "/api/plugins/fs-plugin/"
    }
  ]
}
```

### External Resources

```json
{
  "text": "Resources",
  "items": [
    {
      "text": "GitHub",
      "link": "https://github.com/kubb-labs/fabric",
      "target": "_blank"
    }
  ]
}
```

## See Also

- [Schema Definition](https://kubb.dev/schemas/config/schema.json)
- [Example Config](https://github.com/kubb-labs/kubb.dev/blob/main/schemas/config/example.json)
