---
name: documentation
description: Use when writing blog posts or documentation markdown files - provides writing style guide (active voice, present tense), content structure patterns, and SEO optimization. Overrides brevity rules for proper grammar.
---

# Documentation Skill

This skill provides comprehensive guidelines for AI coding assistants working on Kubb documentation.

## When to Use

- Adding a new plugin, feature, or option
- Changing plugin behavior or API signatures
- Fixing bugs that affect code generation
- Writing or updating functionalities/component/composable documentation
- Optimizing documentation for search engines

## What It Does

- Create clear, concise, practical documentation optimized for developer experience
- Optimize content for search engines and developer intent
- Structure content for maximum scannability and engagement

## Writing Standard

**Override**: When writing documentation, maintain proper grammar and complete sentences. The "sacrifice grammar for brevity" rule does NOT apply here.

Documentation must be:

- Grammatically correct
- Clear and unambiguous
- Properly punctuated
- Complete sentences (not fragments)

Brevity is still valued, but never at the cost of clarity or correctness.

## Available References

| Reference                                                                                              | Purpose                                         |
|--------------------------------------------------------------------------------------------------------| ----------------------------------------------- |
| **[../documentation/references/writing-style.md](./../documentation/references/writing-style.md)**     | Voice, tone, sentence structure                 |
| **[../documentation/references/content-patterns.md](../documentation/references/content-patterns.md)** | Usage patterns, props structure, component patterns |
| **[../documentation/references/config-json.md](../documentation/references/config-json.md)**           | Navigation and sidebar configuration schema     |
| **[../documentation/references/seo-optimization.md](../documentation/references/seo-optimization.md)** | SEO best practices, titles, descriptions, keywords, FAQs |

**Load based on context:**

- Writing prose → [../documentation/references/writing-style.md](../documentation/references/writing-style.md)
- Props, options, usage patterns → [../documentation/references/content-patterns.md](../documentation/references/content-patterns.md)
- Adding navigation or sections → [../documentation/references/config-json.md](../documentation/references/config-json.md)
- Optimizing for search → [../documentation/references/seo-optimization.md](../documentation/references/seo-optimization.md)

## Language and Tone

- Use the US spelling. For example, use license, not licence.

## Naming Conventions

- **Use kebab-case**: `how-to-do-thing.md`
- **Be descriptive**: `multipart-form-data.md` not `form.md`
- **Match URL structure**: File name becomes the URL path

### Writing Patterns

| Pattern       | Example                                                 |
| ------------- |---------------------------------------------------------|
| Subject-first | "The `useApp` composable handles Fabric related logic." |
| Imperative    | "Add the following to `kubb.config.ts`."                |
| Contextual    | "When relying on TypeScript, configure..."              |

### Modal Verbs

| Verb     | Meaning     |
| -------- | ----------- |
| `can`    | Optional    |
| `should` | Recommended |
| `must`   | Required    |

### Component Patterns (WHEN to use)

| Need              | Component                           |
| ----------------- |-------------------------------------|
| Info aside        | `> [!NOTE]`                         |
| Suggestion        | `> [!TIP]`                          |
| Caution           | `> [!WARNING]`                      |
| Required          | `> [!IMPORTANT]`                    |
| Multi-source code | `::: code-group` and ends with `:::` |

## Headings

- **H1 (`#`)**: No backticks
- **H2-H4**: Backticks work fine

## Links and Cross-References

- **Internal links**: Use relative paths: `/plugins/plugin-ts/`
- **Anchor links**: Link to specific sections: `/plugins/plugin-ts/#output-path`
- **External links**: Use full URLs with descriptive text
- **Placement**: Add links section at the very end of the document

## Images and assets

- **Location**: `docs/public/`
- **Reference**: Use relative paths from markdown files
- **Formats**: Use optimized formats (`webp`/`png`/`jpg`)
- **Sizing**: Keep file sizes reasonable
- **Naming**: Use descriptive names: `plugin-react-query-example.png`

## Configuration (config.json)

The `docs/config.json` file defines navigation and sidebar structure using the Kubb.dev schema.

- **Schema**: `https://kubb.dev/schemas/config/schema.json`
- **Required**: `sidebars` (array), `sidebar` (route mapping)
- **Optional**: `nav` (navigation), `$schema` (validation)
- **Link format**: Use absolute paths with trailing slash: `/getting-started/introduction/`
- **Route mapping**: `/getting-started` maps to `gettingStarted` sidebar name

When adding new sections:
1. Define sidebar in `sidebars` array with unique `name`
2. Add navigation items to `nav` array
3. Map route prefix to sidebar name in `sidebar` object

See [./references/config-json.md](./references/config-json.md) for complete schema reference.

## Checklist

- [ ] Active voice (85%+)
- [ ] Present tense
- [ ] 2-3 sentences per paragraph
- [ ] Explanation before code
- [ ] Validate frontmatter syntax
- [ ] Update `config.json` when adding new pages/sections
