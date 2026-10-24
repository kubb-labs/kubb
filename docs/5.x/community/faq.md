---
layout: doc
title: FAQ
description: Frequently asked questions about Kubb, covering compatibility,
  generated code, customization, and plugins.
outline:
  - 2
  - 3
order: 2
navigation:
  title: FAQ
  icon: i-iconoir-help-circle
---

# FAQ

Find your question, then open it for the answer. If your question is not here, ask in [Discord](https://discord.gg/shfBFeczrm) or open a [GitHub issue](https://github.com/kubb-labs/kubb/issues).

## General

::accordion

:::accordion-item{label="Is Kubb production-ready?" icon="i-iconoir-help-circle"}
Yes. The generated code is plain TypeScript. It has no runtime dependency on Kubb, no decorators, and no framework lock-in.
:::

::

## Compatibility

::accordion

:::accordion-item{label="Does Kubb work with JavaScript projects?" icon="i-iconoir-help-circle"}
Yes. Kubb generates TypeScript. You can consume the output directly in a JavaScript project or transpile it as part of your build.
:::

:::accordion-item{label="Can I use Kubb with GraphQL?" icon="i-iconoir-help-circle"}
Not out of the box. The default [adapter](/docs/5.x/explanation/architecture#adapters) targets OpenAPI/Swagger. For GraphQL, use [GraphQL Code Generator](https://the-guild.dev/graphql/codegen). A custom adapter can handle any format, but writing one takes real work.
:::

:::accordion-item{label="What Node.js version is required?" icon="i-iconoir-help-circle"}
Node.js 22.22 or higher. The CLI and config file are ESM-native.
:::

:::accordion-item{label="Does Kubb support Bun or Deno?" icon="i-iconoir-help-circle"}
The CLI and generated code run on Bun with no extra configuration. Deno isn't officially tested.
:::

::

## Generated code

::accordion

:::accordion-item{label="Do I commit generated files to Git?" icon="i-iconoir-help-circle"}
Either way works. Many teams commit the generated code so CI can skip regeneration. Others add the output directory to `.gitignore` and generate during CI.
:::

:::accordion-item{label="How do I disable telemetry?" icon="i-iconoir-help-circle"}
Set `DO_NOT_TRACK=1` or `KUBB_DISABLE_TELEMETRY=1`. See [Telemetry](/docs/5.x/reference/telemetry) for details.
:::

::
