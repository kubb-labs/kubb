---
name: plugin-architecture
description: Explains plugin lifecycle, generator types, and common utilities used by plugins in the Kubb ecosystem.
---

# Plugin Architecture Skill

This skill instructs agents on how plugins are defined, registered, and how generators interact with the plugin lifecycle.

## When to Use

- When users ask how to create a plugin or resolve names/paths
- When explaining generator lifecycles and utility helpers

## What It Does

- Describes PluginManager and plugin hooks (`pre`, `post`, `resolvePath`, `resolveName`, `install`)
- Shows a typical plugin factory shape
- Lists common helper utilities used within generators and components

## Example Plugin Shape

```ts
export const definePlugin = createPlugin<PluginOptions>((options) => ({
  name: pluginName,
  options,
  pre: [],
  post: [],
  resolvePath(baseName, mode, options) { /* ... */ },
  resolveName(name, type) { /* ... */ },
  async install() { /* ... */ },
}))
```

## Utilities to Reference

- `getFile(operation, { pluginKey })`
- `getName(operation, { type, prefix })`
- `getSchemas(operation, { pluginKey, type })`

## Related Skills

| Skill                                                              | Use For                                       |
|--------------------------------------------------------------------|-----------------------------------------------|
| **[../components-generators/SKILL.md](../documentation/SKILL.md)** | Guidance for writing `@kubb/react-fabric` components and generators |
