<div align="center">
  <h1>Kubb Cli</h1>
  <a href="https://kubb.dev" target="_blank" rel="noopener noreferrer">
    <img width="180" src="https://raw.githubusercontent.com/kubb-labs/kubb/main/assets/logo.png" alt="Kubb logo">
  </a>


[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![Coverage][coverage-src]][coverage-href]
[![License][license-src]][license-href]
[![Sponsors][sponsors-src]][sponsors-href]
<h4>
    <a href="https://codesandbox.io/s/github/kubb-labs/kubb/tree/main//examples/typescript" target="_blank">View Demo</a>
    <span> · </span>
      <a href="https://kubb.dev/" target="_blank">Documentation</a>
    <span> · </span>
      <a href="https://github.com/kubb-labs/kubb/issues/" target="_blank">Report Bug</a>
    <span> · </span>
      <a href="https://github.com/kubb-labs/kubb/issues/" target="_blank">Request Feature</a>
  </h4>
</div>

## Commands

### `kubb init`

Initialize a new Kubb project with an interactive setup wizard.

```bash
npx kubb init
```

This command will:
1. Detect or create a `package.json` if it doesn't exist
2. Prompt you for your OpenAPI specification path
3. Ask for the output directory for generated files
4. Let you select which Kubb plugins to use
5. Install the selected packages using your package manager (npm, pnpm, yarn, or bun)
6. Generate a `kubb.config.ts` file with your chosen configuration

### `kubb generate`

Generate files based on your `kubb.config.ts` configuration.

```bash
npx kubb generate
```

Options:
- `-c, --config <path>` - Path to the Kubb config file
- `-l, --logLevel <level>` - Set log level (silent, info, verbose, debug)
- `-w, --watch` - Watch mode based on the input file
- `-d, --debug` - Enable debug mode
- `-v, --verbose` - Enable verbose mode
- `-s, --silent` - Enable silent mode

### `kubb validate`

Validate a Swagger/OpenAPI file.

```bash
npx kubb validate <path-to-openapi>
```

### `kubb mcp`

Start the MCP server to enable the MCP client to interact with the LLM.

```bash
npx kubb mcp
```

## Supporting Kubb

Kubb uses an MIT-licensed open source project with its ongoing development made possible entirely by the support of Sponsors. If you would like to become a sponsor, please consider:

- [Become a Sponsor on GitHub](https://github.com/sponsors/stijnvanhulle)

<p align="center">
  <a href="https://github.com/sponsors/stijnvanhulle">
    <img src="https://raw.githubusercontent.com/stijnvanhulle/sponsors/main/sponsors.svg" alt="My sponsors" />
  </a>
</p>


<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/@kubb/cli?flat&colorA=18181B&colorB=f58517
[npm-version-href]: https://npmjs.com/package/@kubb/cli
[npm-downloads-src]: https://img.shields.io/npm/dm/@kubb/cli?flat&colorA=18181B&colorB=f58517
[npm-downloads-href]: https://npmjs.com/package/@kubb/cli
[license-src]: https://img.shields.io/github/license/kubb-labs/kubb.svg?flat&colorA=18181B&colorB=f58517
[license-href]: https://github.com/kubb-labs/kubb/blob/main/LICENSE
[build-src]: https://img.shields.io/github/actions/workflow/status/kubb-labs/kubb/ci.yaml?style=flat&colorA=18181B&colorB=f58517
[build-href]: https://www.npmjs.com/package/@kubb/cli
[minified-src]: https://img.shields.io/bundlephobia/min/@kubb/cli?style=flat&colorA=18181B&colorB=f58517
[minified-href]: https://www.npmjs.com/package/@kubb/cli
[coverage-src]: https://img.shields.io/codecov/c/github/kubb-labs/kubb?style=flat&colorA=18181B&colorB=f58517
[coverage-href]: https://www.npmjs.com/package/@kubb/cli
[sponsors-src]: https://img.shields.io/github/sponsors/stijnvanhulle?style=flat&colorA=18181B&colorB=f58517
[sponsors-href]: https://github.com/sponsors/stijnvanhulle/
