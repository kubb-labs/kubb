<div align="center">
  <a href="https://kubb.dev" target="_blank" rel="noopener noreferrer">
    <img src="https://kubb.dev/og.png" alt="Kubb banner">
  </a>

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![Stars][stars-src]][stars-href]
[![License][license-src]][license-href]
[![Coverage][coverage-src]][coverage-href]
[![Node][node-src]][node-href]
[![OC Backers][oc-backers-src]][oc-backers-href]

<h4>
<a href="https://kubb.dev" target="_blank">Documentation</a>
<span> · </span>
<a href="https://github.com/kubb-labs/kubb/issues/" target="_blank">Report Bug</a>
<span> · </span>
<a href="https://github.com/kubb-labs/kubb/issues/" target="_blank">Request Feature</a>
</h4>
</div>

<br />

# Kubb

### Turn your API spec into type-safe code

Kubb turns an API spec, such as OpenAPI, into TypeScript types, API clients, hooks, validators and mocks, and keeps them in sync with your API. It reads OpenAPI 2.0, 3.0 and 3.1.

## Installation

```bash
bun add kubb
# or
pnpm add kubb
# or
npm install kubb
```

## Quick start

Run the setup wizard to create a `kubb.config.ts`:

```bash
npx kubb init
```

The wizard creates a `package.json` if needed, guides you through plugin selection, installs packages, and writes `kubb.config.ts`. Then generate your code:

```bash
npx kubb generate
```

See the [documentation](https://kubb.dev) for detailed usage and advanced features.

## Kubb Studio

[Kubb Studio](https://kubb.studio) is the visual companion for Kubb. Configure, run, and inspect generations in the browser while Kubb runs in your project or on an agent you control.

Try Studio's shared sandbox, [connect a local project](https://kubb.dev/docs/5.x/integrations/studio), or [publish reviewable snapshots from CI](https://github.com/kubb-labs/action). Kubb remains MIT-licensed and works without Studio.

## Features

- Generate TypeScript types, type-safe clients, [TanStack Query](https://github.com/TanStack/query) and [SWR](https://github.com/vercel/swr) hooks, [Zod](https://github.com/colinhacks/zod) validators, [Faker](https://github.com/faker-js/faker) mocks, and [MSW](https://github.com/mswjs/msw) handlers from one schema.
- Generate a typed [axios](https://axios-http.com/) or [Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) client with status-keyed results, auth, validation, file uploads, server-sent events, interceptors, and a swappable transport.
- Read OpenAPI 2.0, 3.0, and 3.1 through adapters like [`@kubb/adapter-oas`](https://npmx.dev/package/@kubb/adapter-oas), with output for Node.js and Bun.
- Enable only the [plugins](https://github.com/kubb-labs/plugins) you need: `plugin-ts`, `plugin-axios`, `plugin-fetch`, `plugin-react-query`, `plugin-vue-query`, `plugin-swr`, `plugin-zod`, `plugin-faker`, `plugin-msw`, `plugin-cypress`, `plugin-redoc`, `plugin-mcp`.
- Shape the output by grouping files by tag, including or excluding operations, and writing to disk, memory, or a custom storage backend.
- Build your own plugins, generators, adapters, and renderers with the [`kubb/kit`](https://kubb.dev/docs/5.x/reference/kit) authoring toolkit, plus a JSX renderer for component-based output.
- Run generation in your bundler with `unplugin-kubb` for [Vite](https://github.com/vitejs/vite), [Nuxt](https://github.com/nuxt/nuxt), [Astro](https://github.com/withastro/astro), [webpack](https://github.com/webpack/webpack), and more.
- Drive generation from AI tools over the built-in MCP server ([Claude](https://claude.ai), [Cursor](https://cursor.sh)) or inside [Claude Code](https://kubb.dev/docs/5.x/ai/claude).

## Supporting Kubb

Kubb is an open source project, and its development is funded entirely by sponsors. If you would like to become a sponsor, please consider:

- [Become a Sponsor on GitHub](https://github.com/sponsors/stijnvanhulle)
- [Back Kubb on Open Collective](https://opencollective.com/kubb)
- [See sponsorship tiers and our sponsors](https://kubb.dev/sponsors)

<p align="center">
  <a href="https://github.com/sponsors/stijnvanhulle">
    <img src="https://shieldcn.dev/sponsors/stijnvanhulle.svg?titleAlign=center&mode=dark" alt="stijnvanhulle sponsors" width="100%" />
  </a>
</p>

## Contributing

We welcome contributions that help improve Kubb. A few ways to get involved:

- Found a bug? File it in the [issue tracker](https://github.com/kubb-labs/kubb/issues).
- Have an idea to improve Kubb? [Open an issue](https://github.com/kubb-labs/kubb/issues/new) to share it.
- Need help? Ask the community on [Discord](https://discord.gg/4dQjA6vrWX).

See [CONTRIBUTING.md](https://github.com/kubb-labs/kubb/blob/main/CONTRIBUTING.md) for the project structure, local setup, and commands.

## Contributors [![Contributors][contributors-src]][contributors-href]

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="http://www.stijnvanhulle.be"><img src="https://avatars.githubusercontent.com/u/5904681?v=4?s=100" width="100px;" alt="Stijn Van Hulle"/><br /><sub><b>Stijn Van Hulle</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=stijnvanhulle" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/aburgel"><img src="https://avatars.githubusercontent.com/u/341478?v=4?s=100" width="100px;" alt="Alex Burgel"/><br /><sub><b>Alex Burgel</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=aburgel" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/ChilloManiac"><img src="https://avatars.githubusercontent.com/u/3761964?v=4?s=100" width="100px;" alt="Christoffer Nørbjerg"/><br /><sub><b>Christoffer Nørbjerg</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=ChilloManiac" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://codefy.de/de/karriere"><img src="https://avatars.githubusercontent.com/u/122524301?v=4?s=100" width="100px;" alt="CHE1RON"/><br /><sub><b>CHE1RON</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=CHE1RON" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/ekaradon"><img src="https://avatars.githubusercontent.com/u/9439390?v=4?s=100" width="100px;" alt="ekaradon"/><br /><sub><b>ekaradon</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=ekaradon" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://thijmen.dev"><img src="https://avatars.githubusercontent.com/u/383903?v=4?s=100" width="100px;" alt="Thijmen Stavenuiter"/><br /><sub><b>Thijmen Stavenuiter</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=Thijmen" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/bohdanhusak"><img src="https://avatars.githubusercontent.com/u/13829370?v=4?s=100" width="100px;" alt="Bohdan Husak"/><br /><sub><b>Bohdan Husak</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=bohdanhusak" title="Documentation">📖</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/Ericlm"><img src="https://avatars.githubusercontent.com/u/19361503?v=4?s=100" width="100px;" alt="Éric Le Maître"/><br /><sub><b>Éric Le Maître</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=Ericlm" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/chambber"><img src="https://avatars.githubusercontent.com/u/11406841?v=4?s=100" width="100px;" alt="Rubens Pereira do Nascimento"/><br /><sub><b>Rubens Pereira do Nascimento</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=chambber" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/msutkowski"><img src="https://avatars.githubusercontent.com/u/784953?v=4?s=100" width="100px;" alt="Matt Sutkowski"/><br /><sub><b>Matt Sutkowski</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=msutkowski" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/vitorcamachoo"><img src="https://avatars.githubusercontent.com/u/20595956?v=4?s=100" width="100px;" alt="Vítor Camacho"/><br /><sub><b>Vítor Camacho</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=vitorcamachoo" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/VasekProchazka"><img src="https://avatars.githubusercontent.com/u/13906845?v=4?s=100" width="100px;" alt="Václav Procházka"/><br /><sub><b>Václav Procházka</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=VasekProchazka" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://codx.dev"><img src="https://avatars.githubusercontent.com/u/59735735?v=4?s=100" width="100px;" alt="Luiz Bett"/><br /><sub><b>Luiz Bett</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=heyBett" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/lambdank"><img src="https://avatars.githubusercontent.com/u/5475129?v=4?s=100" width="100px;" alt="Sebastian Andersen"/><br /><sub><b>Sebastian Andersen</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=lambdank" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://akino.icu"><img src="https://avatars.githubusercontent.com/u/64176534?v=4?s=100" width="100px;" alt="Akino"/><br /><sub><b>Akino</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=akinoccc" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/rmachado-studocu"><img src="https://avatars.githubusercontent.com/u/89906313?v=4?s=100" width="100px;" alt="Ricardo Machado"/><br /><sub><b>Ricardo Machado</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=rmachado-studocu" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://simonelnahas.com"><img src="https://avatars.githubusercontent.com/u/29279201?v=4?s=100" width="100px;" alt="Simon El Nahas"/><br /><sub><b>Simon El Nahas</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=simonelnahas" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/maartenvansambeek"><img src="https://avatars.githubusercontent.com/u/91739524?v=4?s=100" width="100px;" alt="maartenvansambeek"/><br /><sub><b>maartenvansambeek</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=maartenvansambeek" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://sdufresne.info"><img src="https://avatars.githubusercontent.com/u/583851?v=4?s=100" width="100px;" alt="Stefan du Fresne"/><br /><sub><b>Stefan du Fresne</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=SCdF" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://hugofelippe.github.io/"><img src="https://avatars.githubusercontent.com/u/19368365?v=4?s=100" width="100px;" alt="Hugo Felippe de Souza Cruz"/><br /><sub><b>Hugo Felippe de Souza Cruz</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=hugoFelippe" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/belgattitude"><img src="https://avatars.githubusercontent.com/u/259798?v=4?s=100" width="100px;" alt="Sébastien Vanvelthem"/><br /><sub><b>Sébastien Vanvelthem</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=belgattitude" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="http://bento.me/vitalygashkov"><img src="https://avatars.githubusercontent.com/u/30000398?v=4?s=100" width="100px;" alt="Vitaly Gashkov"/><br /><sub><b>Vitaly Gashkov</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=vitalygashkov" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://ducduc.nl"><img src="https://avatars.githubusercontent.com/u/9675738?v=4?s=100" width="100px;" alt="Duco Drupsteen"/><br /><sub><b>Duco Drupsteen</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=ducodrupsteen" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/th3l0g4n"><img src="https://avatars.githubusercontent.com/u/326306?v=4?s=100" width="100px;" alt="th3l0g4n"/><br /><sub><b>th3l0g4n</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=th3l0g4n" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://rxliuli.com"><img src="https://avatars.githubusercontent.com/u/24560368?v=4?s=100" width="100px;" alt="rxliuli"/><br /><sub><b>rxliuli</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=rxliuli" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/humarkx"><img src="https://avatars.githubusercontent.com/u/13049940?v=4?s=100" width="100px;" alt="humarkx"/><br /><sub><b>humarkx</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=humarkx" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/Jakub-Cerovsky"><img src="https://avatars.githubusercontent.com/u/141134227?v=4?s=100" width="100px;" alt="Jakub Cerovsky"/><br /><sub><b>Jakub Cerovsky</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=Jakub-Cerovsky" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/yukikwi"><img src="https://avatars.githubusercontent.com/u/66879660?v=4?s=100" width="100px;" alt="Pachara Chantawong"/><br /><sub><b>Pachara Chantawong</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=yukikwi" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://volodymyrkushnir.dev/"><img src="https://avatars.githubusercontent.com/u/10290626?v=4?s=100" width="100px;" alt="Volodymyr Kushnir"/><br /><sub><b>Volodymyr Kushnir</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=volodymyr-kushnir" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/GKNewsrooms"><img src="https://avatars.githubusercontent.com/u/201248633?v=4?s=100" width="100px;" alt="GKNewsrooms"/><br /><sub><b>GKNewsrooms</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=GKNewsrooms" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/stepek"><img src="https://avatars.githubusercontent.com/u/5058678?v=4?s=100" width="100px;" alt="Kamil Stepczuk"/><br /><sub><b>Kamil Stepczuk</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=stepek" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/JoaoBrlt"><img src="https://avatars.githubusercontent.com/u/11065509?v=4?s=100" width="100px;" alt="João Brilhante"/><br /><sub><b>João Brilhante</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=JoaoBrlt" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/kamilzki"><img src="https://avatars.githubusercontent.com/u/27976736?v=4?s=100" width="100px;" alt="Kamil Sieradzki"/><br /><sub><b>Kamil Sieradzki</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=kamilzki" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/EricPierlotIdmog"><img src="https://avatars.githubusercontent.com/u/124898024?v=4?s=100" width="100px;" alt="Eric Pierlot"/><br /><sub><b>Eric Pierlot</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=EricPierlotIdmog" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://atholin.se"><img src="https://avatars.githubusercontent.com/u/33940473?v=4?s=100" width="100px;" alt="Alexander Sjöcrona Tholin"/><br /><sub><b>Alexander Sjöcrona Tholin</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=ATholin" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="http://hyoban.cc"><img src="https://avatars.githubusercontent.com/u/38493346?v=4?s=100" width="100px;" alt="Stephen Zhou"/><br /><sub><b>Stephen Zhou</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=hyoban" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://choly.ca"><img src="https://avatars.githubusercontent.com/u/943597?v=4?s=100" width="100px;" alt="Ilia Choly"/><br /><sub><b>Ilia Choly</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=icholy" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/skoropadas"><img src="https://avatars.githubusercontent.com/u/20700969?v=4?s=100" width="100px;" alt="Alex Skoropad"/><br /><sub><b>Alex Skoropad</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=skoropadas" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://pateljay.io"><img src="https://avatars.githubusercontent.com/u/36803168?v=4?s=100" width="100px;" alt="Jay Patel"/><br /><sub><b>Jay Patel</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=jay-babu" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://hamzamihaidaniel.com"><img src="https://avatars.githubusercontent.com/u/12731515?v=4?s=100" width="100px;" alt="Hamza Mihai Daniel"/><br /><sub><b>Hamza Mihai Daniel</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=hamzamihaidanielx" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/DesselBane"><img src="https://avatars.githubusercontent.com/u/12199480?v=4?s=100" width="100px;" alt="DesselBane"/><br /><sub><b>DesselBane</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=DesselBane" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://joao.neto.pt"><img src="https://avatars.githubusercontent.com/u/1539767?v=4?s=100" width="100px;" alt="João Neto"/><br /><sub><b>João Neto</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=joaomlneto" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/chuuddo"><img src="https://avatars.githubusercontent.com/u/526086?v=4?s=100" width="100px;" alt="Ilya Chudin"/><br /><sub><b>Ilya Chudin</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=chuuddo" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://xeoneux.com"><img src="https://avatars.githubusercontent.com/u/3099626?v=4?s=100" width="100px;" alt="Aayush Kapoor"/><br /><sub><b>Aayush Kapoor</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=xeoneux" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://www.alex-boehm.dev"><img src="https://avatars.githubusercontent.com/u/3983539?v=4?s=100" width="100px;" alt="Alex Böhm"/><br /><sub><b>Alex Böhm</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=mheob" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/mohammad-naji7"><img src="https://avatars.githubusercontent.com/u/13167378?v=4?s=100" width="100px;" alt="Mohammad Alhamdan"/><br /><sub><b>Mohammad Alhamdan</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=mohammad-naji7" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/pkasarda"><img src="https://avatars.githubusercontent.com/u/83337747?v=4?s=100" width="100px;" alt="Peter Kasarda"/><br /><sub><b>Peter Kasarda</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=pkasarda" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/tachirodriguez"><img src="https://avatars.githubusercontent.com/u/25849492?v=4?s=100" width="100px;" alt="Tachi Rodriguez"/><br /><sub><b>Tachi Rodriguez</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=tachirodriguez" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://ghettoddos.su"><img src="https://avatars.githubusercontent.com/u/47575319?v=4?s=100" width="100px;" alt="Egor"/><br /><sub><b>Egor</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=ghettoDdOS" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/rajp33"><img src="https://avatars.githubusercontent.com/u/44758822?v=4?s=100" width="100px;" alt="Raj Patel"/><br /><sub><b>Raj Patel</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=rajp33" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/kaigritun"><img src="https://avatars.githubusercontent.com/u/258667664?v=4?s=100" width="100px;" alt="Kai Gritun"/><br /><sub><b>Kai Gritun</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=kaigritun" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/sebastianvitterso"><img src="https://avatars.githubusercontent.com/u/37065184?v=4?s=100" width="100px;" alt="Sebastian Vittersø"/><br /><sub><b>Sebastian Vittersø</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=sebastianvitterso" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/IanVS"><img src="https://avatars.githubusercontent.com/u/4616705?v=4?s=100" width="100px;" alt="Ian VanSchooten"/><br /><sub><b>Ian VanSchooten</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=IanVS" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/iivo-k"><img src="https://avatars.githubusercontent.com/u/46477013?v=4?s=100" width="100px;" alt="Iivo Kapanen"/><br /><sub><b>Iivo Kapanen</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=iivo-k" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/direnakkoc"><img src="https://avatars.githubusercontent.com/u/74667729?v=4?s=100" width="100px;" alt="Diren"/><br /><sub><b>Diren</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=direnakkoc" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/blackravenx"><img src="https://avatars.githubusercontent.com/u/70589675?v=4?s=100" width="100px;" alt="Max Shy"/><br /><sub><b>Max Shy</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=blackravenx" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/nicholaschiang"><img src="https://avatars.githubusercontent.com/u/20798889?v=4?s=100" width="100px;" alt="Nicholas Chiang"/><br /><sub><b>Nicholas Chiang</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=nicholaschiang" title="Code">💻</a> <a href="https://github.com/kubb-labs/kubb/commits?author=nicholaschiang" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/vandreleal"><img src="https://avatars.githubusercontent.com/u/9258892?v=4?s=100" width="100px;" alt="Vandré Leal"/><br /><sub><b>Vandré Leal</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=vandreleal" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/billomore"><img src="https://avatars.githubusercontent.com/u/153465150?v=4?s=100" width="100px;" alt="billomore"/><br /><sub><b>billomore</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=billomore" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/phenax"><img src="https://avatars.githubusercontent.com/u/11407672?v=4?s=100" width="100px;" alt="Akshay Nair"/><br /><sub><b>Akshay Nair</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=phenax" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/Pavel-Surkov"><img src="https://avatars.githubusercontent.com/u/74367926?v=4?s=100" width="100px;" alt="Pavel Surkov"/><br /><sub><b>Pavel Surkov</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=Pavel-Surkov" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://sferadev.com"><img src="https://avatars.githubusercontent.com/u/2181866?v=4?s=100" width="100px;" alt="Alexis Rico"/><br /><sub><b>Alexis Rico</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=SferaDev" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/gustafc"><img src="https://avatars.githubusercontent.com/u/3645254?v=4?s=100" width="100px;" alt="gustafc"/><br /><sub><b>gustafc</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=gustafc" title="Documentation">📖</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/oller"><img src="https://avatars.githubusercontent.com/u/1219831?v=4?s=100" width="100px;" alt="David Ollerhead"/><br /><sub><b>David Ollerhead</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=oller" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/TopGrd"><img src="https://avatars.githubusercontent.com/u/4202848?v=4?s=100" width="100px;" alt="Robot."/><br /><sub><b>Robot.</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=TopGrd" title="Documentation">📖</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

## License

This repository is licensed under the [MIT License](https://github.com/kubb-labs/kubb/blob/main/LICENSE), Copyright © 2025 [Stijn Van Hulle](https://stijnvanhulle.be).

See [LICENSE](https://github.com/kubb-labs/kubb/blob/main/LICENSE) for details.

## Star history

<img alt="Star history chart" src="https://shieldcn.dev/chart/github/stars/kubb-labs/kubb.svg?theme=orange" width="100%" />

<!-- Badges -->

[npm-version-src]: https://shieldcn.dev/npm/v/@kubb/core.svg?variant=secondary&size=xs&theme=zinc&mode=dark
[npm-version-href]: https://npmx.dev/package/@kubb/core
[npm-downloads-src]: https://shieldcn.dev/npm/dm/@kubb/core.svg?variant=secondary&size=xs&theme=zinc&mode=dark
[npm-downloads-href]: https://npmx.dev/package/@kubb/core
[stars-src]: https://shieldcn.dev/github/stars/kubb-labs/kubb.svg?variant=secondary&size=xs&theme=zinc&mode=dark
[stars-href]: https://github.com/kubb-labs/kubb
[license-src]: https://shieldcn.dev/npm/license/kubb.svg?variant=secondary&size=xs&theme=zinc
[license-href]: https://github.com/kubb-labs/kubb/blob/main/LICENSE
[node-src]: https://shieldcn.dev/npm/node/kubb.svg?variant=secondary&size=xs&theme=zinc&mode=dark
[node-href]: https://npmx.dev/package/@kubb/core
[contributors-src]: https://shieldcn.dev/github/contributors/kubb-labs/kubb.svg?variant=secondary&size=xs&theme=zinc&mode=dark
[contributors-href]: #contributors-
[coverage-src]: https://shieldcn.dev/codecov/github/kubb-labs/kubb.svg?variant=secondary&size=xs&theme=zinc&mode=dark
[coverage-href]: https://app.codecov.io/gh/kubb-labs/kubb
[oc-backers-src]: https://shieldcn.dev/opencollective/backers/kubb.svg?variant=secondary&size=xs&theme=zinc&mode=dark
[oc-backers-href]: https://opencollective.com/kubb
