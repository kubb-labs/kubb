# AGENTS.md

Kubb is a code-generation toolkit for generating client code from OpenAPI specifications. Plugins are maintained in a separate monorepo at [kubb-project/kubb-plugins](https://github.com/kubb-project/kubb-plugins).

## Plugin Configuration

Plugins are configured using YAML schemas. Each plugin in the [kubb-plugins](https://github.com/kubb-project/kubb-plugins) repository includes a `plugin-*.yaml` file that defines its configuration structure.

**Schema Reference**: See [schemas/plugins/README.md](./schemas/plugins/README.md) for plugin metadata and configuration details.

**Example**: Plugin configuration from the kubb-plugins repository (e.g., `plugin-client.yaml`, `plugin-ts.yaml`) can be referenced to understand plugin options and usage patterns.

## Folder Structure

### Packages

```
packages/
├── core/                    # Core utilities and shared runtime
├── kubb/                    # Core kubb package (CLI, config, manager)
├── agent/                   # AI-assisted code generation agent
├── parser-ts/               # TypeScript parser
├── renderer-jsx/            # JSX renderer for components
└── unplugin/                # Unplugin integration
```

## Repository Setup

- **Monorepo** - Uses pnpm workspaces and Turborepo
- **Module system** - ESM-only (`type: "module"`)
- **Node version** - 20
- **Versioning** - Changesets
- **CI/CD** - GitHub Actions

## Commands

```bash
pnpm install                 # Install dependencies
pnpm clean                   # Clean build artifacts
pnpm build                   # Build all packages
pnpm generate                # Generate code from OpenAPI specs
pnpm perf                    # Run performance tests
pnpm test                    # Run tests
pnpm typecheck               # Type check all packages
pnpm typecheck:examples      # Type check examples
pnpm format                  # Format code
pnpm lint                    # Lint code
pnpm lint:fix                # Lint and fix issues
pnpm changeset               # Create changelog entry
pnpm run upgrade && pnpm i   # Upgrade dependencies
```

<skills>

## Skills

You have new skills. If any skill might be relevant then you MUST read it.

- [changelog](.skills/changelog/SKILL.md) - Automatically creates user-facing changelogs from git commits by analyzing commit history, categorizing changes, and transforming technical commits into clear, customer-friendly release notes. Turns hours of manual changelog writing into minutes of automated generation.
- [coding-style](.skills/coding-style/SKILL.md) - Coding style, testing, and PR guidelines for the Kubb ecosystem. Use when writing or reviewing code for the Kubb ecosystem.
- [components-generators](.skills/components-generators/SKILL.md) - Guidance for writing `@kubb/renderer-jsx` components and generators (React-based and function-based).
- [documentation](.skills/documentation/SKILL.md) - Use when writing blog posts or documentation markdown files - provides writing style guide (active voice, present tense), content structure patterns, and SEO optimization. Overrides brevity rules for proper grammar.
- [jsdoc](.skills/jsdoc/SKILL.md) - Guidelines for writing minimal, high-quality JSDoc comments in TypeScript.
- [plugin-architecture](.skills/plugin-architecture/SKILL.md) - Explains plugin lifecycle, generator types, and common utilities used by plugins in the Kubb ecosystem.
- [pr](.skills/pr/SKILL.md) - Rules and checklist for preparing PRs, creating changesets, and releasing packages in the monorepo.
- [testing](.skills/testing/SKILL.md) - Testing, CI, and troubleshooting guidance for running the repository's test suite and interpreting CI failures.
  </skills>
