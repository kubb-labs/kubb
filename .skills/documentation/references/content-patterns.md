# Content Patterns

Blog post structure, frontmatter, and component patterns for the Kubb ecosystem documentation.

## Default

### Default Frontmatter

Every documentation file must include YAML frontmatter:

```yaml
---
layout: doc          # Always use 'doc' for documentation pages
title: Page Title     # Displayed in browser tab and page header
outline: deep        # Enables deep table of contents
---
```

## Package Documentation

### Package Documentation Frontmatter

For packages documentation:

```yaml
---
layout: doc
title: \@kubb/name  # Escape @ symbol
outline: deep
---
```

### Package Documentation Structure

Structure for package documentation pages:

1. **Opening** (1-2 paragraphs) - Title and one-sentence description
2. **Installation**
  - Use code groups (start with `::: code-group` and end with `:::`) for multiple package managers (always include `bun`, `pnpm`, `npm`, `yarn` in that order):

```shell [bun]
bun add -d @kubb/name
```

3. **Options** (one section per option, in logical order)
  - **Always include Required**: `true` or `false`, never omit
  - **Always include Default**: If there's a default, specify it. If no default, omit this row
  - Use following pattern:

```md
### optionName

Brief one-sentence description of what this option does.

> [!TIP]
>  Additional context: when to use it, performance implications, or helpful notes

|           |             |
|----------:|:------------|
|     Type: | `string`    |
| Required: | `false`     |
|  Default: | `'default'` |

**Example:**

```typescript
// Show minimal usage example
```
```
4. **Code examples**
  - With file path labels
  - All required imports
  - Minimal but complete configuration
5. **Resources** - Links to docs, repo if relevant


## Blog Post pattens

### Blog Post Frontmatter

Blog specific Frontmatter rules:

```yaml
---
title: Post Title
description: Brief description for SEO and previews (under 160 chars)
navigation: false
image: /assets/blog/slug.png
authors:
  - name: Author Name
    avatar:
      src: https://github.com/username.png
date: 2025-11-05T10:00:00.000Z
category: Release
---
```

**Categories**: `Release` (version announcements), `Article` (tutorials, guides)

### Blog Post Structure

1. **Opening** (1-2 paragraphs) - Announce what's new, why it matters
2. **Key callout** - `> [!NOTE]`  with requirements/prerequisites
3. **Feature sections** - `## Emoji Feature Name` headers
4. **Code examples** - With file path labels
5. **Breaking changes** - If release post
6. **Thank you** - Credit contributors
7. **Resources** - Links to docs, repo
8. **Release link** - Link to full changelog

## Component Patterns

Use the right component for the right purpose:

| Need             | Component                            | When                       |
| ---------------- |--------------------------------------| -------------------------- |
| Background info  | `> [!NOTE]`                          | Supplementary context      |
| Best practice    | `> [!TIP]`                           | Recommendations            |
| Potential issue  | `> [!WARNING]`                       | Things that could go wrong |
| Must-know        | `> [!IMPORTANT]`                     | Required actions           |
| Danger           | `> [!CAUTION]`                       | Destructive operations     |
| Package managers | `::: code-group` and ends with `:::` | `bun`, `pnpm`, `npm`, `yarn` variants     |

## Usage Section
- **Minimal, generic snippet** showing basic syntax
- Shows core functionality only
- Uses placeholder/simple values
- Always includes `::: code-group` with input and output
- First example users see - keep it simple

## Examples Section
- **Realistic, concrete snippets** showing real-world scenarios
- Demonstrates actual use cases
- Uses meaningful variable names and realistic data
- Multiple examples for different scenarios

## Props/Options/Parameters Structure

All props, options, and parameters must use this exact table format:

### propName

[One-sentence description of what this prop/option does]

|           |          |
|----------:|:---------|
|     Type: | `string` |
| Required: | `true`   |
|  Default: | `value`  |  // Only if a default exists

**Table rules:**
- **Required rows**:
  - `Type:` - Always present, show the TypeScript type
  - `Required:` - Always present, use `true` or `false`
- **Optional rows**:
  - `Default:` - Only include if a default value exists
  - Do not include Default row if there's no default


## Prefer table Pattern

Prefer using table pattern when listing options or multiple items:

```md
| Skill                                   | Use For           |
|-----------------------------------------|-------------------|
| **[../../changelog/SKILL.md](../../changelog/SKILL.md)** | Update changelogs |
```


## Including Shared Content

Use VitePress `@include` directive to reuse shared content:

```md
### contentType
<!--@include: ../core/contentType.md-->
```

## Code Block Labels

Always include file path:

Use `twoslash` annotation for TypeScript: enables type checking

````md
```ts twoslash [kubb.config.ts]
export default defineConfig({
})
```
```ts [kubb.config.ts]
export default defineConfig({
})
```

```typescript [./types.ts]
type Test = {
    name: string;
}
```

```bash
pnpm add @kubb/core
```
````
