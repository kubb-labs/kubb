<div align="center">
  <a href="https://kubb.dev" target="_blank" rel="noopener noreferrer">
    <img src="https://kubb.dev/og.png" alt="Kubb banner">
  </a>

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![Stars][stars-src]][stars-href]
[![License][license-src]][license-href]
[![Node][node-src]][node-href]

<h4>
<a href="https://kubb.dev" target="_blank">Documentation</a>
<span> · </span>
<a href="https://github.com/kubb-labs/kubb/issues/" target="_blank">Report Bug</a>
<span> · </span>
<a href="https://github.com/kubb-labs/kubb/issues/" target="_blank">Request Feature</a>
</h4>
</div>

<br />

# @kubb/studio

Kubb Studio client runtime.

Connects a Kubb project to [Kubb Studio](https://kubb.studio) through typed Cap'n Web RPC over one
authenticated WebSocket, and publishes snapshots from CI in one HTTP request. It backs the `kubb studio`
CLI command and the `kubblabs/kubb-agent` Docker image.

Most people never install this directly. Reach for `kubb studio` instead, which pairs your machine
and runs this for you.

## Installation

```shell
npm install @kubb/studio
```

## Permissions

Every permission is off by default, and each covers one trust boundary:

| Option            | What it grants                                                                                 |
| ----------------- | ---------------------------------------------------------------------------------------------- |
| `allowWrite`      | Generated files are written to disk. Off means they exist only in memory and stream to Studio. |
| `allowExec`       | The formatter, the linter, and `output.postGenerate` run as child processes.                   |
| `allowConfigEdit` | Studio may change plugin options in `kubb.config.ts`.                                          |
| `allowRead`       | Studio may read existing output files and the files a generation produced.                     |
| `allowReadAst`    | Studio may read back the parsed spec (the Kubb AST).                                           |
| `allowFileRefs`   | A `$ref` in the spec may read a local file outside the project.                                |

A sandbox never writes or edits config. A sandbox the host declares with `agentType: 'sandbox'` or `'global'` always allows reads.

## Supporting Kubb

Kubb is an open source project, and its development is funded entirely by sponsors. If you would like to become a sponsor, please consider:

- [Become a Sponsor on GitHub](https://github.com/sponsors/stijnvanhulle)
- [See sponsorship tiers and our sponsors](https://kubb.dev/sponsors)

<p align="center">
  <a href="https://github.com/sponsors/stijnvanhulle">
    <img src="https://raw.githubusercontent.com/stijnvanhulle/sponsors/main/sponsors.svg" alt="My sponsors" />
  </a>
</p>

## License

[MIT](https://github.com/kubb-labs/kubb/blob/main/licenses/LICENSE-MIT)

<!-- Badges -->

[npm-version-src]: https://shieldcn.dev/npm/v/@kubb/studio.svg?variant=secondary&size=xs&theme=zinc&mode=dark
[npm-version-href]: https://npmx.dev/package/@kubb/studio
[npm-downloads-src]: https://shieldcn.dev/npm/dm/@kubb/studio.svg?variant=secondary&size=xs&theme=zinc&mode=dark
[npm-downloads-href]: https://npmx.dev/package/@kubb/studio
[stars-src]: https://shieldcn.dev/github/stars/kubb-labs/kubb.svg?variant=secondary&size=xs&theme=zinc&mode=dark
[stars-href]: https://github.com/kubb-labs/kubb
[license-src]: https://shieldcn.dev/npm/license/@kubb/studio.svg?variant=secondary&size=xs&theme=zinc
[license-href]: https://github.com/kubb-labs/kubb/blob/main/LICENSE
[node-src]: https://shieldcn.dev/npm/node/@kubb/studio.svg?variant=secondary&size=xs&theme=zinc&mode=dark
[node-href]: https://npmx.dev/package/@kubb/studio
