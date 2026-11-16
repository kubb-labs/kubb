---
layout: doc
title: Kubb FAQ - Production use and compatibility
description: Answers to common questions about Kubb, covering production use, telemetry, compatibility, and generated code.
outline:
  - 2
  - 3
order: 2
navigation:
  title: FAQ
  icon: i-iconoir-help-circle
---

# FAQ

Not here? Ask on [Discord](https://discord.gg/shfBFeczrm) or open a [GitHub issue](https://github.com/kubb-labs/kubb/issues).

## General

::accordion

:::accordion-item{label="Is Kubb production-ready?" icon="i-iconoir-help-circle"}
Yes. The generated code is plain TypeScript, with no runtime dependency on Kubb and no decorators. [Generate your first client](/docs/5.x/tutorials/quickstart) shows the output.
:::

:::accordion-item{label="How do I turn off telemetry?" icon="i-iconoir-help-circle"}
Set `DO_NOT_TRACK=1` or `KUBB_DISABLE_TELEMETRY=1`. See [Telemetry](/docs/5.x/reference/telemetry).
:::

::

## Compatibility

::accordion

:::accordion-item{label="Does Kubb work with JavaScript projects?" icon="i-iconoir-help-circle"}
Yes, with a build step. Kubb generates TypeScript, so import the output through a bundler that compiles TypeScript, such as [Vite](https://vite.dev) or esbuild, or compile it with `tsc`.
:::

:::accordion-item{label="Can I use Kubb with GraphQL?" icon="i-iconoir-help-circle"}
Not out of the box. The default [adapter](/docs/5.x/explanation/architecture#adapters) reads OpenAPI and Swagger, so use [GraphQL Code Generator](https://the-guild.dev/graphql/codegen) for GraphQL. A [custom adapter](/docs/5.x/reference/kit/adapters) can read any format, but takes real work.
:::

:::accordion-item{label="Which Node.js version do I need?" icon="i-iconoir-help-circle"}
Node.js 22.22 or later. The CLI and the config file are ESM. See [Installation](/docs/5.x/how-to/installation#prerequisites).
:::

:::accordion-item{label="Does Kubb work with TypeScript 7?" icon="i-iconoir-help-circle"}
Yes. Kubb builds and type-checks with TypeScript 7, and the code it generates type-checks with `tsc` 7. Install `typescript@7` and run `tsc` as before. See [Installation](/docs/5.x/how-to/installation#prerequisites).
:::

:::accordion-item{label="Does Kubb run on Bun or Deno?" icon="i-iconoir-help-circle"}
On Bun, yes. The CLI and the generated code need no extra setup. Use the Bun commands in [Installation](/docs/5.x/how-to/installation). Deno is not tested.
:::

::

## Generated code

::accordion

:::accordion-item{label="Do I commit generated files to Git?" icon="i-iconoir-help-circle"}
Either works. Commit the output so CI can skip generation, or add the output folder to `.gitignore` and run [`kubb generate`](/docs/5.x/reference/commands/generate) in CI.
:::

:::accordion-item{label="Can Kubb generate during my build or in CI?" icon="i-iconoir-help-circle"}
Yes. [Build tool plugins](/docs/5.x/integrations/overview#build-tools) generate when Vite, webpack, or another bundler builds. [CI snapshots](/docs/5.x/integrations/ci) publish the output of each pull request as an installable package.
:::

::
