# AGENTS.md

This document provides guidelines for AI coding assistants working on Kubb documentation.

**Scope**: Documentation in the `docs/` folder (Markdown/MDX with VitePress)

**Goal**: Create clear, concise, practical documentation optimized for developer experience

## When to Update Documentation

**Always update docs when:**
- Adding a new plugin, feature, or option
- Changing plugin behavior or API signatures
- Fixing bugs that affect user-facing behavior

**See root `AGENTS.md` for:**
- General PR requirements
- Changelog update process
- Testing requirements

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

## Documentation Structure by Section

### Plugin Documentation Template

Every plugin doc follows this order:

1. **Title and one-sentence description**
   ```markdown
   # @kubb/plugin-name
   
   Generate TypeScript types from OpenAPI schemas.
   ```

2. **Installation** (with code-group for all package managers)

3. **Options** (one section per option, in logical order)
   - Start with `output` options (path, barrelType, etc.)
   - Then feature-specific options
   - End with advanced/rare options

4. **Examples** (complete working configurations)

5. **Links** (optional, if relevant)

### Getting Started Documentation

Focus on speed to productivity:
- **Quick Start**: Get user running in <5 minutes
- **Configure**: Reference for all config options
- **At Glance**: Overview and value proposition
- **Troubleshooting**: Common issues and solutions

### Knowledge Base Documentation

Deep-dives into specific topics:
- Start with concrete use case or problem
- Explain how it works
- Provide working examples
- Link to related plugins/concepts

## Options Documentation Format

For each option, use this structure:

```markdown
### optionName

Brief one-sentence description of what this option does.

> [!TIP]
> Additional context: when to use it, performance implications, or helpful notes

|           |             |
|----------:|:------------|
|     Type: | `string`    |
| Required: | `false`     |
|  Default: | `'default'` |

**Example:**

\`\`\`typescript
// Show minimal usage example
\`\`\`
```

**Rules:**
- **One sentence description**: Start with what it does, not why
- **Type accuracy**: Use exact TypeScript types from the code
- **Always include Required**: `true` or `false`, never omit
- **Always include Default**: If there's a default, specify it. If no default, omit this row
- **Use callouts correctly**: `> [!TIP]`, `> [!WARNING]`, `> [!NOTE]`, `> [!IMPORTANT]`, `> [!CAUTION]` (not VitePress `:::` syntax)
- **Add examples**: For complex options, show a working example

### Code examples

**Structure**: Place examples at the bottom of each page, after all options are documented.

**Always include:**
- All required imports
- Minimal but complete configuration
- Standard example file: `petStore.yaml`
- All prerequisite plugins (e.g., `pluginOas()`)

**Example structure:**

```typescript [kubb.config.ts]
import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginTs } from '@kubb/plugin-ts'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    pluginOas(),
    pluginTs({
      // Show the relevant options being documented
      output: { path: 'models' },
      enumType: 'asConst',
    }),
  ],
})
```

**Guidelines:**
- Use `twoslash` annotation for TypeScript: enables type checking
- Show only relevant options, omit unrelated configuration
- Use code groups for multiple package managers (installation examples)
- Include expected output when helpful (for CLI commands, generated code samples)

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

## Documenting New Features

### New Plugin
1. Create `docs/plugins/plugin-name/index.md`
2. Use existing plugin docs as template
3. Include: installation, all options, working examples
4. Update `.vitepress/config.ts` sidebar
5. Link from relevant getting-started or knowledge-base pages

### New Option
1. Add to existing plugin doc in the Options section
2. Follow the standard option format
3. Update examples if the new option is commonly used
4. Note any dependencies or prerequisites

### New Concept/Feature
1. Add to `docs/knowledge-base/` if it's a deep-dive
2. Add to `docs/getting-started/` if it's foundational
3. Use clear section headers (What, Why, How)
4. Include complete working examples
5. Link from related docs

### New Tutorial
1. Create in `docs/tutorials/`
2. Step-by-step format with clear objectives
3. Each step should be runnable and verifiable
4. Include complete code samples
5. Link from getting-started or README

## Documenting Bug Fixes

When fixing bugs that affect user-facing behavior:

1. **Update relevant documentation**
   - Fix incorrect examples
   - Clarify ambiguous descriptions
   - Update troubleshooting guide if applicable

2. **Add to changelog** (via `pnpm changeset`)
   - Explain what was broken
   - Show correct usage
   - Link to relevant docs

3. **Consider migration notes**
   - If fix changes expected behavior
   - Add to migration guide with before/after examples

**Example:**

```markdown
## Fixed incorrect enum type output

**Issue**: `enumType: 'asConst'` generated invalid TypeScript

**Fixed**: Now correctly generates:

\`\`\`typescript
const petType = {
  Dog: 'dog',
  Cat: 'cat',
} as const
\`\`\`
```

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

## Writing Style Guidelines

### Clarity Over Marketing
- **Direct and technical**: Avoid marketing language like "powerful", "amazing", "seamless"
- **Concrete over abstract**: Prefer "Generates TypeScript types from OpenAPI schemas" over "Transforms your API into typed code"
- **Short paragraphs**: 1-3 sentences per paragraph
- **Active voice**: "The plugin generates types" not "Types are generated"

### Structure: What → Why → When → How
1. **What**: Brief description of the feature/option
2. **Why**: Use case or problem it solves (optional, if not obvious)
3. **When**: When to use it vs alternatives (optional)
4. **How**: Example showing usage

### Examples Must Be:
- **Realistic**: Use actual OpenAPI schema snippets, not placeholders
- **Complete**: Include all required configuration
- **Tested**: Verify examples work before committing
- **Minimal**: Show only what's necessary to understand the feature

### Defaults and Behavior
- **Always document defaults**: Never leave default values unspecified
- **Explain omission**: What happens if a config option is omitted?
- **Call out side effects**: Does this option affect performance, file size, or other plugins?
- **Note requirements**: List any prerequisites or dependencies

### Common Mistakes to Avoid
- **Don't invent features**: Only document what exists in the code
- **Don't reference internals**: Unless they're part of the public API
- **Don't assume knowledge**: Explain acronyms and concepts on first use
- **Don't hide gotchas**: Call out edge cases and limitations explicitly

## Testing Documentation Changes

**Before committing documentation:**

1. **Preview locally**
   ```shell
   cd docs
   pnpm start
   ```

2. **Verify all changes**
   - [ ] Frontmatter is correct (`layout: doc`, `title`, `outline: deep`)
   - [ ] Tables render properly
   - [ ] Code blocks have correct syntax highlighting
   - [ ] Links work (internal and external)
   - [ ] Images load and display correctly
   - [ ] Navigation sidebar shows the page

3. **Test examples**
   - Copy example code into a test project
   - Verify it runs without errors
   - Ensure imports resolve correctly

4. **Check for common mistakes**
   - No broken internal links (`/path/to/page/` not `/path/to/page`)
   - No invented features or options
   - No references to code internals unless part of public API
   - Defaults match the actual code behavior

## PR Checklist for Documentation

**Before submitting:**

- [ ] All code changes have corresponding documentation updates
- [ ] Frontmatter is complete and correct
- [ ] Options follow the standard format (table with Type, Required, Default)
- [ ] Examples are complete, tested, and use `petStore.yaml`
- [ ] All links verified (end with `/` for internal links)
- [ ] No marketing language or vague descriptions
- [ ] Defaults explicitly stated or marked as optional
- [ ] Edge cases and limitations documented
- [ ] Code groups include all package managers (bun, pnpm, npm, yarn)
- [ ] Shared content uses `@include` where appropriate
- [ ] Callouts use `> [!TYPE]` syntax (not `:::`)
- [ ] Navigation updated in `.vitepress/config.ts` if needed
- [ ] Changelog updated via `pnpm changeset` (for code changes)
- [ ] Previewed locally with `pnpm start` in docs folder

**Review for quality:**
- [ ] Clear: No ambiguity, technical jargon explained
- [ ] Concise: Short paragraphs, no redundancy
- [ ] Correct: Examples work, defaults match code
- [ ] Complete: Edge cases documented, gotchas called out
- [ ] Consistent: Follows existing patterns and terminology

## Common Documentation Patterns

### Documenting a new plugin option

```markdown
### newOption

Description of what this option does (one sentence, technical).

> [!TIP]
> When to use this: [specific use case]. Default behavior is [X].

|           |             |
|----------:|:------------|
|     Type: | `string \| boolean` |
| Required: | `false`     |
|  Default: | `true`      |

**Example:**

\`\`\`typescript
pluginName({
  newOption: false,
})
\`\`\`
```

### Documenting breaking changes

Add to `migration-guide.md`:

```markdown
## Breaking changes in vX.Y.Z

### Plugin Name

**Changed**: `oldOption` renamed to `newOption`

::: code-group

\`\`\`typescript [Before]
pluginName({ oldOption: true })
\`\`\`

\`\`\`typescript [After]
pluginName({ newOption: true })
\`\`\`

:::

**Migration**: Update all references to `oldOption` in your config.
```

### Adding a code example with output

```markdown
**Example:**

\`\`\`typescript [kubb.config.ts]
export default defineConfig({
  // config
})
\`\`\`

**Generated output:**

\`\`\`typescript [models/Pet.ts]
export type Pet = {
  id: number
  name: string
}
\`\`\`
```

### Documenting monorepo behavior

```markdown
> [!NOTE]
> In monorepos: Run `kubb generate` from the workspace root, or use separate configs per package. See [Best Practices](/knowledge-base/best-practices/) for details.
```

## Quality Standards for AI-Generated Documentation

When reviewing AI-generated documentation, verify:

### Accuracy
- [ ] No invented features or options
- [ ] Types match actual TypeScript types in code
- [ ] Defaults match actual code behavior
- [ ] Examples run without errors
- [ ] Links point to existing pages

### Clarity
- [ ] One clear idea per paragraph
- [ ] Technical terms defined on first use
- [ ] No marketing fluff ("powerful", "seamless", etc.)
- [ ] Concrete examples over abstract descriptions

### Completeness
- [ ] All options documented
- [ ] Defaults explicitly stated
- [ ] Side effects called out
- [ ] Prerequisites listed
- [ ] Edge cases and limitations noted

### Consistency
- [ ] Terminology matches rest of docs
- [ ] Format matches existing plugin docs
- [ ] Code style matches repository conventions
- [ ] File naming follows kebab-case pattern

### Helpful Context
- [ ] When to use this vs alternatives
- [ ] Performance implications if relevant
- [ ] Monorepo/CI considerations if applicable
- [ ] Common mistakes section if relevant

**Red flags:**
- Vague descriptions without examples
- Missing default values
- References to "internal implementation"
- Broken or placeholder links
- Examples that don't match documented behavior

## Getting help

- **Reference existing docs**: Use similar plugins as templates
- **Check `.vitepress/config.ts`**: Understand navigation structure
- **Review `docs/plugins/core/`**: See shared option documentation
- **Test locally**: Always preview changes before committing
