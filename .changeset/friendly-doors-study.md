---
"@kubb/cli": minor
---

Add new `init` command for interactive project setup

The CLI now includes a new `kubb init` command that provides an interactive setup wizard to quickly scaffold a Kubb project:

- **Interactive prompts**: Uses `@clack/prompts` for a beautiful CLI experience
- **Package manager detection**: Automatically detects `npm`, `pnpm`, `yarn`, or `bun`
- **Plugin selection**: Multi-select from all 13 available Kubb plugins
- **Automatic installation**: Installs selected packages with the detected package manager
- **Config generation**: Creates `kubb.config.ts` with sensible defaults
- **File protection**: Asks before overwriting existing configuration

Usage:
```bash
npx kubb init
```

The command will guide you through:
1. Creating a `package.json` (if needed)
2. Selecting your OpenAPI specification path
3. Choosing which plugins to install
4. Installing packages automatically
5. Generating `kubb.config.ts`

This is now the recommended way to start a new Kubb project!
