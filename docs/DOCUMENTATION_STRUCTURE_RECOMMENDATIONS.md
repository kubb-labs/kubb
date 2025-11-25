# Documentation Structure Recommendations

This document outlines recommendations for improving the Kubb documentation structure based on a comprehensive analysis of the current docs folder.

## Current Structure Overview

```
docs/
├── .vitepress/          # VitePress configuration
├── blog/                # Blog posts (v3, v4, fabric)
├── builders/            # Build tool integrations (unplugin)
├── examples/            # Code examples for various plugins
├── getting-started/     # Introduction and setup guides
├── helpers/             # CLI and OAS helper documentation
├── knowledge-base/      # Advanced topics and tutorials
├── plugins/             # Plugin-specific documentation
├── tutorials/           # Step-by-step tutorials
├── public/              # Static assets
├── index.md             # Homepage
├── about.md             # About Kubb
├── changelog.md         # Version history
├── contributers.md      # Contributors
├── migration-guide.md   # Migration from v2 to v3
├── playground.md        # Interactive playground
└── sponsors.md          # Sponsors page
```

## Key Findings

### Strengths
1. **Clear plugin organization**: Each plugin has its own folder with consistent documentation
2. **Good use of VitePress features**: Code groups, badges, mermaid diagrams
3. **Reusable content**: Shared markdown files in `plugins/core/` for common options
4. **Multiple entry points**: Good navigation via sidebar and top menu

### Areas for Improvement

## 1. Navigation and Discoverability

### Issue: Inconsistent sidebar groupings
The `knowledgeBaseSidebar` uses categories like "Basic", "Intermediate", "Advanced" but this doesn't align well with how users search for information.

**Recommendation**: Reorganize knowledge base by topic rather than difficulty:
```typescript
const knowledgeBaseSidebar = [
  {
    text: 'Configuration',
    items: [
      { text: 'Custom HTTP client', link: '/knowledge-base/fetch/' },
      { text: 'Use of your own baseUrl', link: '/knowledge-base/base-url/' },
      { text: 'Filter and sort', link: '/knowledge-base/filter-and-sort/' },
      { text: 'Multipart FormData', link: '/knowledge-base/multipart-form-data' },
    ],
  },
  {
    text: 'Development',
    items: [
      { text: 'Debugging Kubb', link: '/knowledge-base/debugging/' },
      { text: 'Generators', link: '/knowledge-base/generators/' },
      { text: 'Kubb Plugins', link: '/knowledge-base/plugins/' },
    ],
  },
  {
    text: 'Integrations',
    items: [
      { text: 'Setup Claude with Kubb', link: '/knowledge-base/claude/' },
    ],
  },
]
```

## 2. Getting Started Flow

### Issue: The "At Glance" page is comprehensive but could be overwhelming for new users

**Recommendation**: Split the getting started section into more digestible pages:
```
getting-started/
├── introduction.md      # What is Kubb? (brief, focused)
├── quick-start.md       # 5-minute setup guide
├── installation.md      # Detailed installation options
├── configure.md         # Configuration reference
├── ecosystem.md         # Overview of plugins
└── next-steps.md        # Where to go next
```

## 3. Plugin Documentation Consistency

### Issue: Some plugins have sub-pages (e.g., `plugin-oas/hooks/`) while others don't

**Recommendation**: Standardize plugin documentation structure:
```
plugin-{name}/
├── index.md             # Overview, installation, basic usage
├── options.md           # All configuration options (for complex plugins)
├── examples.md          # Common use cases and examples
└── api.md               # API reference (hooks, components, utilities)
```

This would apply to plugins with substantial content like:
- `plugin-oas`
- `plugin-client`
- `plugin-react-query` and other Tanstack Query plugins
- `plugin-zod`

## 4. Examples Section Reorganization

### Issue: Examples are listed flat, making it hard to find related examples

**Current structure in sidebar**:
```
- TypeScript
- Tanstack-Query (grouped)
- SWR-Query
- Zod
- Faker
- MSW
- Simple
- Client
- Fetch
- Cypress
- MCP
- Advanced
- Generators
```

**Recommendation**: Group by use case:
```typescript
const examplesSidebar = [
  {
    text: 'Getting Started',
    items: [
      { text: 'Simple', link: '/examples/simple/' },
      { text: 'TypeScript', link: '/examples/typescript/' },
    ],
  },
  {
    text: 'API Clients',
    items: [
      { text: 'Axios Client', link: '/examples/client/' },
      { text: 'Fetch Client', link: '/examples/fetch/' },
      { text: 'Cypress', link: '/examples/cypress/' },
    ],
  },
  {
    text: 'Data Fetching Hooks',
    items: [
      {
        text: 'Tanstack Query',
        items: [
          { text: 'React Query', link: '/examples/tanstack-query/react-query/' },
          { text: 'Vue Query', link: '/examples/tanstack-query/vue-query/' },
          { text: 'Svelte Query', link: '/examples/tanstack-query/svelte-query/' },
          { text: 'Solid Query', link: '/examples/tanstack-query/solid-query/' },
        ],
      },
      { text: 'SWR', link: '/examples/swr/' },
    ],
  },
  {
    text: 'Validation & Mocking',
    items: [
      { text: 'Zod Schemas', link: '/examples/zod/' },
      { text: 'Faker Data', link: '/examples/faker/' },
      { text: 'MSW Mocks', link: '/examples/msw/' },
    ],
  },
  {
    text: 'AI & Extensions',
    items: [
      { text: 'MCP (Claude)', link: '/examples/mcp/' },
    ],
  },
  {
    text: 'Advanced',
    items: [
      { text: 'Custom Generators', link: '/examples/generators/' },
      { text: 'Advanced Configuration', link: '/examples/advanced/' },
    ],
  },
]
```

## 5. Knowledge Base Improvements

### Issue: Some knowledge-base pages are stubs or have minimal content

**Files needing expansion**:
- `knowledge-base/oas.md` - Only 2 lines, should explain OAS/Swagger basics
- `knowledge-base/fileManager.md` - Documented but commented out in nav
- `knowledge-base/pluginManager/` - Documented but commented out in nav

**Recommendation**: Either:
1. Expand these pages with meaningful content, or
2. Remove them from the file system if not planned

## 6. Missing Documentation

### Recommend adding:
1. **Troubleshooting guide** (`getting-started/troubleshooting.md`)
   - Common errors and solutions
   - FAQ section

2. **API Reference** (new section)
   - Programmatic API documentation for `@kubb/core`
   - Type definitions and interfaces

3. **Recipe/Cookbook section** (expand knowledge-base)
   - "How to generate TypeScript types only"
   - "How to customize client templates"
   - "How to integrate with existing projects"

4. **Comparison page**
   - Compare Kubb vs other OpenAPI generators
   - When to use Kubb

## 7. Content Organization in Files

### Issue: The `knowledge-base/generators.md` file is comprehensive but long

**Recommendation**: Consider splitting into:
```
knowledge-base/generators/
├── index.md             # Overview and concepts
├── createGenerator.md   # Basic generator guide
├── createReactGenerator.md  # React-based generators
└── examples.md          # Collection of generator examples
```

## 8. Typos and Minor Issues

1. `contributers.md` should be renamed to `contributors.md` (typo in filename)
2. Some links in the sidebar use trailing slashes inconsistently

## 9. SEO and Accessibility

### Recommendations:
1. Add meta descriptions to all pages
2. Ensure all images have alt text
3. Add structured data for better search indexing

## 10. Proposed New Folder Structure

```
docs/
├── .vitepress/
├── guide/                    # NEW: Rename from getting-started
│   ├── introduction.md
│   ├── quick-start.md
│   ├── installation.md
│   ├── configuration.md
│   └── troubleshooting.md    # NEW
├── plugins/                  # Keep as is, standardize internal structure
├── examples/                 # Reorganize with grouping
├── recipes/                  # NEW: Practical how-to guides
│   ├── typescript-only.md
│   ├── custom-client.md
│   ├── monorepo-setup.md
│   └── ci-cd-integration.md
├── api/                      # NEW: API reference
│   ├── core.md
│   ├── cli.md
│   └── types.md
├── knowledge-base/           # Keep, but reorganize by topic
├── blog/
├── tutorials/
├── public/
└── [other standalone pages]
```

## Implementation Priority

### High Priority
1. Fix typo: rename `contributers.md` to `contributors.md`
2. Reorganize examples sidebar by use case
3. Expand `knowledge-base/oas.md` with meaningful content

### Medium Priority
4. Standardize plugin documentation structure
5. Add troubleshooting guide
6. Reorganize knowledge-base sidebar by topic

### Low Priority
7. Split large documentation files
8. Add comparison page
9. Create recipes section

## Summary

The Kubb documentation is already well-organized and comprehensive. These recommendations focus on:
1. **Improving discoverability** through better navigation structure
2. **Enhancing consistency** across plugin documentation
3. **Filling gaps** in documentation coverage
4. **Improving user experience** for both new and experienced users

The changes can be implemented incrementally without disrupting the existing documentation.
