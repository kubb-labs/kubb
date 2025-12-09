# AGENTS.md

This document provides essential guidelines for AI coding assistants (Cursor, GitHub Copilot) working on Kubb documentation. Repository docs are located in the `docs/` folder and use Markdown (MD or MDX) with VitePress.

## When to update documentation

See root `AGENTS.md` for general guidance on when to update documentation. This section covers documentation-specific details.

## Folder structure

```
docs/
├── .vitepress/           # VitePress configuration
├── migration-guide.md    # Updated after major releases
├── changelog.md          # Updated with every PR (via changeset)
├── getting-started/      # Getting started guides
├── blog/                 # Blog posts (after major releases)
├── helpers/              # Extra packages (CLI, OAS core)
├── knowledge-base/       # Feature deep-dives and how-tos
│   ├── debugging.md
│   ├── fetch.md
│   ├── multipart-form-data.md
│   └── ...
├── plugins/              # Plugin documentation
│   ├── core/             # Shared plugin options
│   └── plugin-*/         # Individual plugin docs
├── tutorials/            # Step-by-step tutorials
├── examples/             # Playground and examples
└── builders/             # Builder integrations (unplugin, etc.)
```

## File naming conventions

- **Use kebab-case**: `how-to-do-thing.md`
- **Be descriptive**: `multipart-form-data.md` not `form.md`
- **Match URL structure**: File name becomes the URL path

## Frontmatter

Every documentation file must include YAML frontmatter. Required fields:

```yaml
---
layout: doc          # Always use 'doc' for documentation pages
title: Page Title     # Displayed in browser tab and page header
outline: deep        # Enables deep table of contents
---
```

### Plugin documentation frontmatter

```yaml
---
layout: doc
title: \@kubb/plugin-name  # Escape @ symbol
outline: deep
---
```

## Documentation structure

### Plugin documentation template

All plugin docs follow this structure:

1. **Title and description**
2. **Installation** (code-group with package managers)
3. **Options** (with tables and descriptions)
4. **Examples** (at the bottom)
5. **Links** (if applicable, at the very end)

### Options documentation format

For each option, use this table format:

```markdown
### optionName

Brief description of what this option does.

> [!TIP]
> Optional tip or important note

|           |             |
|----------:|:------------|
|     Type: | `string`    |
| Required: | `true`      |
|  Default: | `'default'` |
```

**Rules:**
- Use right-aligned column headers (`|----------:|`)
- Type should be formatted as code (backticks)
- Include `Required` field (true/false)
- Include `Default` if there's a default value
- Add tips using `> [!TIP]`, `> [!WARNING]`, `> [!NOTE]`, `> [!IMPORTANT]`, `> [!WARNING]`, `> [!CAUTION]` blocks and don't use the Vitepress syntax (`::: tip``).
```md
> [!TIP]
> Use the outline navigation (right sidebar) to quickly jump to specific versions.
```

### Code examples

**Always include working examples** at the bottom of plugin docs:

```typescript [kubb.config.ts]
import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginName } from '@kubb/plugin-name'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    pluginOas(),
    pluginTs(),
    pluginName({
      // Show relevant options
    }),
  ],
})
```

**Code example guidelines:**
- Use `twoslash` annotation for TypeScript examples (enables type checking)
- Show realistic, complete configurations
- Include all required plugins
- Use `petStore.yaml` as the standard example input
- Place examples at the bottom of the page

### Including shared content

Use VitePress `@include` directive to reuse shared content:

```markdown
### contentType
<!--@include: ../core/contentType.md-->
```

**Common includes:**
- `../core/contentType.md` - Content type option
- `../core/barrelTypes.md` - Barrel type explanations
- `../core/group.md` - Grouping options
- `../core/groupTypes.md` - Group type options

**Location**: `docs/plugins/core/`

## Documenting new features

When adding a new feature:

1. **Create or update relevant docs**:
   - New plugin → Create `docs/plugins/plugin-name/index.md`
   - New option → Add to existing plugin doc
   - New concept → Add to `knowledge-base/` or appropriate section

2. **Follow the template**:
   - Use existing plugin docs as reference
   - Include installation, options, and examples
   - Link to related plugins/concepts

3. **Update navigation**:
   - Check `.vitepress/config.ts` for sidebar structure
   - Add new items to appropriate sections

4. **Add examples**:
   - Ensure examples work with `petStore.yaml`
   - Test examples locally before committing

## Documenting bug fixes

See root `AGENTS.md` for general guidance on documenting bug fixes. Focus on documentation-specific details here.

## Code groups

Use code groups for multiple package managers:

```markdown
::: code-group

```shell [bun]
bun add -d @kubb/plugin-name
```

```shell [pnpm]
pnpm add -D @kubb/plugin-name
```

```shell [npm]
npm install --save-dev @kubb/plugin-name
```

```shell [yarn]
yarn add -D @kubb/plugin-name
```
:::
```

**Always include**: bun, pnpm, npm, yarn (in that order)

## Images and assets

- **Location**: `docs/public/`
- **Reference**: Use relative paths from markdown files
- **Formats**: Use optimized formats (`webp`/`png`/`jpg`)
- **Sizing**: Keep file sizes reasonable
- **Naming**: Use descriptive names: `plugin-react-query-example.png`

## Links and cross-references

- **Internal links**: Use relative paths: `/plugins/plugin-ts/`
- **Anchor links**: Link to specific sections: `/plugins/plugin-ts/#output-path`
- **External links**: Use full URLs with descriptive text
- **Placement**: Add links section at the very end of the document

**Example:**

```markdown
## Links

- [Plugin OAS](/plugins/plugin-oas/)
- [Getting Started](/getting-started/at-glance/)
```

## Writing style

- **Be concise**: Short paragraphs, clear sentences
- **Be actionable**: Use imperative mood ("Set the option to...")
- **Use examples**: Show, don't just tell
- **Include outputs**: Show expected results for commands
- **Be consistent**: Follow existing documentation patterns

## Testing documentation

Before submitting docs changes:

1. **Preview locally**: Run `pnpm start` in `docs/` folder (see root `AGENTS.md` for general testing)
2. **Check links**: Verify all internal/external links work
3. **Verify examples**: Ensure code examples are correct
4. **Check formatting**: Tables, code blocks render correctly
5. **Test navigation**: Verify sidebar navigation works

## PR checklist for documentation

- [ ] Documentation updated for all code changes
- [ ] Frontmatter is correct (`layout: doc`, `title`, `outline: deep`)
- [ ] Options documented with proper table format
- [ ] Examples included and tested
- [ ] Links verified (internal and external)
- [ ] Images optimized and properly referenced
- [ ] Code groups include all package managers
- [ ] Shared content uses `@include` where appropriate
- [ ] Navigation updated if needed (`.vitepress/config.ts`)
- [ ] Changelog updated via `pnpm changeset`

## Common patterns

### Documenting a new plugin option

```markdown
### newOption

Description of what this option does and when to use it.

> [!TIP]
> Optional helpful tip

|           |             |
|----------:|:------------|
|     Type: | `string \| boolean` |
| Required: | `false`     |
|  Default: | `'default'` |
```

### Documenting breaking changes

Add to `migration-guide.md`:

```markdown
## Breaking changes in vX.Y.Z

### Plugin Name

**Before:**
```typescript
pluginName({ oldOption: true })
```

**After:**
```typescript
pluginName({ newOption: true })
```
```

### Adding a new tutorial

1. Create file in `docs/tutorials/`
2. Use step-by-step format
3. Include complete working examples
4. Link from getting-started or relevant plugin docs

## Review guidance for agent-created docs

See root `AGENTS.md` for general review checklist. Documentation-specific checks:

- **No hallucinations**: Check that examples and code actually work
- **Navigation**: Confirm frontmatter and file placement are correct
- **Links**: Ensure all links resolve correctly
- **VitePress formatting**: Verify frontmatter, code groups, and includes work correctly

## Getting help

- **Reference existing docs**: Use similar plugins as templates
- **Check `.vitepress/config.ts`**: Understand navigation structure
- **Review `docs/plugins/core/`**: See shared option documentation
- **Test locally**: Always preview changes before committing
