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

### The meta framework for code generation

Point Kubb at an OpenAPI spec and it generates types, clients, hooks, validators, mocks, and more.

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

## Features

- Generate from a spec: point Kubb at an OpenAPI document and it produces TypeScript types, type-safe API clients, [TanStack Query](https://github.com/TanStack/query) hooks for React and Vue, [SWR](https://github.com/vercel/swr) hooks, [Zod](https://github.com/colinhacks/zod) validators, [Faker](https://github.com/faker-js/faker) mocks, and [MSW](https://github.com/mswjs/msw) handlers.
- Read Swagger 2.0, OpenAPI 3.0, and 3.1, with TypeScript-first output that runs on Node.js and Bun.
- Pick what you generate from the [plugin ecosystem](https://github.com/kubb-labs/kubb-plugins): `plugin-ts`, `plugin-client`, `plugin-react-query`, `plugin-vue-query`, `plugin-swr`, `plugin-zod`, `plugin-faker`, `plugin-msw`, `plugin-cypress`, `plugin-redoc`, and `plugin-mcp`. Enable only the ones a project needs.
- Choose your HTTP client: use the axios or fetch presets, or point at a custom client module so generated requests run through your own wrapper.
- Control the generated tree: group files by tag, emit barrel exports, and include or exclude operations to keep the output focused.
- Build your own output with custom plugins, composable middleware, and the JSX-based renderer (`@kubb/renderer-jsx`) for full control over what lands on disk.
- Hook into your bundler with `unplugin-kubb`, which runs generation inside [Vite](https://github.com/vitejs/vite), [Nuxt](https://github.com/nuxt/nuxt), [Astro](https://github.com/withastro/astro), [webpack](https://github.com/webpack/webpack), and other build tools.
- Drive generation from AI tools through the built-in Model Context Protocol (MCP) server, which works with [Claude](https://claude.ai), [Cursor](https://cursor.sh), and other MCP-compatible assistants.
- Generate from inside [Claude Code](https://kubb.dev/docs/5.x/ai/claude) with the Kubb plugin, which adds slash commands, a config skill, and an agent that run the Kubb CLI.

## Supporting Kubb

Kubb is an open source project, and its development is funded entirely by sponsors. If you would like to become a sponsor, please consider:

- [Become a Sponsor on GitHub](https://github.com/sponsors/stijnvanhulle)
- [See sponsorship tiers and our sponsors](https://kubb.dev/sponsors)

<p align="center">
  <a href="https://github.com/sponsors/stijnvanhulle">
    <img src="https://raw.githubusercontent.com/stijnvanhulle/sponsors/main/sponsors.svg" alt="My sponsors" />
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
      <td align="center" valign="top" width="14.28%"><a href="https://aluc.io/"><img src="https://avatars.githubusercontent.com/u/15520015?v=4?s=100" width="100px;" alt="Alfred"/><br /><sub><b>Alfred</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=b6pzeusbc54tvhw5jgpyw8pwz2x6gs" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/raveclassic"><img src="https://avatars.githubusercontent.com/u/1743568?v=4?s=100" width="100px;" alt="Kirill Agalakov"/><br /><sub><b>Kirill Agalakov</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=raveclassic" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://wicky.nillia.ms"><img src="https://avatars.githubusercontent.com/u/1091390?v=4?s=100" width="100px;" alt="Nick Williams"/><br /><sub><b>Nick Williams</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=WickyNilliams" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/helt"><img src="https://avatars.githubusercontent.com/u/1732112?v=4?s=100" width="100px;" alt="helt"/><br /><sub><b>helt</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=helt" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/Ti-webdev"><img src="https://avatars.githubusercontent.com/u/478565?v=4?s=100" width="100px;" alt="Vasily Mikhaylovsky"/><br /><sub><b>Vasily Mikhaylovsky</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=Ti-webdev" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/chiptus"><img src="https://avatars.githubusercontent.com/u/1381655?v=4?s=100" width="100px;" alt="Chaim Lev-Ari"/><br /><sub><b>Chaim Lev-Ari</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=chiptus" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="http://projects.pafnuty.name"><img src="https://avatars.githubusercontent.com/u/1635679?v=4?s=100" width="100px;" alt="Pavel Belousov"/><br /><sub><b>Pavel Belousov</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=pafnuty" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/dmitry-blackwave"><img src="https://avatars.githubusercontent.com/u/5526543?v=4?s=100" width="100px;" alt="Dmitry Belov"/><br /><sub><b>Dmitry Belov</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=dmitry-blackwave" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/aburgel"><img src="https://avatars.githubusercontent.com/u/341478?v=4?s=100" width="100px;" alt="Alex Burgel"/><br /><sub><b>Alex Burgel</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=aburgel" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/dgarciamuria"><img src="https://avatars.githubusercontent.com/u/8144333?v=4?s=100" width="100px;" alt="Daniel Garcia"/><br /><sub><b>Daniel Garcia</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=dgarciamuria" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/wuyuanyi135"><img src="https://avatars.githubusercontent.com/u/11760870?v=4?s=100" width="100px;" alt="wuyuanyi135"/><br /><sub><b>wuyuanyi135</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=wuyuanyi135" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/cjthompson"><img src="https://avatars.githubusercontent.com/u/1958266?v=4?s=100" width="100px;" alt="Chris Thompson"/><br /><sub><b>Chris Thompson</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=cjthompson" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/hkang1"><img src="https://avatars.githubusercontent.com/u/220971?v=4?s=100" width="100px;" alt="Caleb Hoyoul Kang"/><br /><sub><b>Caleb Hoyoul Kang</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=hkang1" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/grreeenn"><img src="https://avatars.githubusercontent.com/u/13204857?v=4?s=100" width="100px;" alt="Gregory Zhukovsky"/><br /><sub><b>Gregory Zhukovsky</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=grreeenn" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/ChilloManiac"><img src="https://avatars.githubusercontent.com/u/3761964?v=4?s=100" width="100px;" alt="Christoffer Nørbjerg"/><br /><sub><b>Christoffer Nørbjerg</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=ChilloManiac" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://codefy.de/de/karriere"><img src="https://avatars.githubusercontent.com/u/122524301?v=4?s=100" width="100px;" alt="CHE1RON"/><br /><sub><b>CHE1RON</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=CHE1RON" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/ekaradon"><img src="https://avatars.githubusercontent.com/u/9439390?v=4?s=100" width="100px;" alt="ekaradon"/><br /><sub><b>ekaradon</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=ekaradon" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://thijmen.dev"><img src="https://avatars.githubusercontent.com/u/383903?v=4?s=100" width="100px;" alt="Thijmen Stavenuiter"/><br /><sub><b>Thijmen Stavenuiter</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=Thijmen" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/bohdanhusak"><img src="https://avatars.githubusercontent.com/u/13829370?v=4?s=100" width="100px;" alt="Bohdan Husak"/><br /><sub><b>Bohdan Husak</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=bohdanhusak" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/Ericlm"><img src="https://avatars.githubusercontent.com/u/19361503?v=4?s=100" width="100px;" alt="Éric Le Maître"/><br /><sub><b>Éric Le Maître</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=Ericlm" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/chambber"><img src="https://avatars.githubusercontent.com/u/11406841?v=4?s=100" width="100px;" alt="Rubens Pereira do Nascimento"/><br /><sub><b>Rubens Pereira do Nascimento</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=chambber" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/msutkowski"><img src="https://avatars.githubusercontent.com/u/784953?v=4?s=100" width="100px;" alt="Matt Sutkowski"/><br /><sub><b>Matt Sutkowski</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=msutkowski" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/vitorcamachoo"><img src="https://avatars.githubusercontent.com/u/20595956?v=4?s=100" width="100px;" alt="Vítor Camacho"/><br /><sub><b>Vítor Camacho</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=vitorcamachoo" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/VasekProchazka"><img src="https://avatars.githubusercontent.com/u/13906845?v=4?s=100" width="100px;" alt="Václav Procházka"/><br /><sub><b>Václav Procházka</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=VasekProchazka" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://codx.dev"><img src="https://avatars.githubusercontent.com/u/59735735?v=4?s=100" width="100px;" alt="Luiz Bett"/><br /><sub><b>Luiz Bett</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=heyBett" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/lambdank"><img src="https://avatars.githubusercontent.com/u/5475129?v=4?s=100" width="100px;" alt="Sebastian Andersen"/><br /><sub><b>Sebastian Andersen</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=lambdank" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://akino.icu"><img src="https://avatars.githubusercontent.com/u/64176534?v=4?s=100" width="100px;" alt="Akino"/><br /><sub><b>Akino</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=akinoccc" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/rmachado-studocu"><img src="https://avatars.githubusercontent.com/u/89906313?v=4?s=100" width="100px;" alt="Ricardo Machado"/><br /><sub><b>Ricardo Machado</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=rmachado-studocu" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://simonelnahas.com"><img src="https://avatars.githubusercontent.com/u/29279201?v=4?s=100" width="100px;" alt="Simon El Nahas"/><br /><sub><b>Simon El Nahas</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=simonelnahas" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/maartenvansambeek"><img src="https://avatars.githubusercontent.com/u/91739524?v=4?s=100" width="100px;" alt="maartenvansambeek"/><br /><sub><b>maartenvansambeek</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=maartenvansambeek" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://sdufresne.info"><img src="https://avatars.githubusercontent.com/u/583851?v=4?s=100" width="100px;" alt="Stefan du Fresne"/><br /><sub><b>Stefan du Fresne</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=SCdF" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://hugofelippe.github.io/"><img src="https://avatars.githubusercontent.com/u/19368365?v=4?s=100" width="100px;" alt="Hugo Felippe de Souza Cruz"/><br /><sub><b>Hugo Felippe de Souza Cruz</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=hugoFelippe" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/belgattitude"><img src="https://avatars.githubusercontent.com/u/259798?v=4?s=100" width="100px;" alt="Sébastien Vanvelthem"/><br /><sub><b>Sébastien Vanvelthem</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=belgattitude" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://bento.me/vitalygashkov"><img src="https://avatars.githubusercontent.com/u/30000398?v=4?s=100" width="100px;" alt="Vitaly Gashkov"/><br /><sub><b>Vitaly Gashkov</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=vitalygashkov" title="Documentation">📖</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://ducduc.nl"><img src="https://avatars.githubusercontent.com/u/9675738?v=4?s=100" width="100px;" alt="Duco Drupsteen"/><br /><sub><b>Duco Drupsteen</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=ducodrupsteen" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/th3l0g4n"><img src="https://avatars.githubusercontent.com/u/326306?v=4?s=100" width="100px;" alt="th3l0g4n"/><br /><sub><b>th3l0g4n</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=th3l0g4n" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://rxliuli.com"><img src="https://avatars.githubusercontent.com/u/24560368?v=4?s=100" width="100px;" alt="rxliuli"/><br /><sub><b>rxliuli</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=rxliuli" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/humarkx"><img src="https://avatars.githubusercontent.com/u/13049940?v=4?s=100" width="100px;" alt="humarkx"/><br /><sub><b>humarkx</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=humarkx" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/Jakub-Cerovsky"><img src="https://avatars.githubusercontent.com/u/141134227?v=4?s=100" width="100px;" alt="Jakub Cerovsky"/><br /><sub><b>Jakub Cerovsky</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=Jakub-Cerovsky" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/yukikwi"><img src="https://avatars.githubusercontent.com/u/66879660?v=4?s=100" width="100px;" alt="Pachara Chantawong"/><br /><sub><b>Pachara Chantawong</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=yukikwi" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://volodymyrkushnir.dev/"><img src="https://avatars.githubusercontent.com/u/10290626?v=4?s=100" width="100px;" alt="Volodymyr Kushnir"/><br /><sub><b>Volodymyr Kushnir</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=volodymyr-kushnir" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/GKNewsrooms"><img src="https://avatars.githubusercontent.com/u/201248633?v=4?s=100" width="100px;" alt="GKNewsrooms"/><br /><sub><b>GKNewsrooms</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=GKNewsrooms" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/stepek"><img src="https://avatars.githubusercontent.com/u/5058678?v=4?s=100" width="100px;" alt="Kamil Stepczuk"/><br /><sub><b>Kamil Stepczuk</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=stepek" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/JoaoBrlt"><img src="https://avatars.githubusercontent.com/u/11065509?v=4?s=100" width="100px;" alt="João Brilhante"/><br /><sub><b>João Brilhante</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=JoaoBrlt" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/kamilzki"><img src="https://avatars.githubusercontent.com/u/27976736?v=4?s=100" width="100px;" alt="Kamil Sieradzki"/><br /><sub><b>Kamil Sieradzki</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=kamilzki" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/EricPierlotIdmog"><img src="https://avatars.githubusercontent.com/u/124898024?v=4?s=100" width="100px;" alt="Eric Pierlot"/><br /><sub><b>Eric Pierlot</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=EricPierlotIdmog" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://atholin.se"><img src="https://avatars.githubusercontent.com/u/33940473?v=4?s=100" width="100px;" alt="Alexander Sjöcrona Tholin"/><br /><sub><b>Alexander Sjöcrona Tholin</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=ATholin" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://hyoban.cc"><img src="https://avatars.githubusercontent.com/u/38493346?v=4?s=100" width="100px;" alt="Stephen Zhou"/><br /><sub><b>Stephen Zhou</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=hyoban" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://choly.ca"><img src="https://avatars.githubusercontent.com/u/943597?v=4?s=100" width="100px;" alt="Ilia Choly"/><br /><sub><b>Ilia Choly</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=icholy" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/skoropadas"><img src="https://avatars.githubusercontent.com/u/20700969?v=4?s=100" width="100px;" alt="Alex Skoropad"/><br /><sub><b>Alex Skoropad</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=skoropadas" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://pateljay.io"><img src="https://avatars.githubusercontent.com/u/36803168?v=4?s=100" width="100px;" alt="Jay Patel"/><br /><sub><b>Jay Patel</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=jay-babu" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://hamzamihaidaniel.com"><img src="https://avatars.githubusercontent.com/u/12731515?v=4?s=100" width="100px;" alt="Hamza Mihai Daniel"/><br /><sub><b>Hamza Mihai Daniel</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=hamzamihaidanielx" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/DesselBane"><img src="https://avatars.githubusercontent.com/u/12199480?v=4?s=100" width="100px;" alt="DesselBane"/><br /><sub><b>DesselBane</b></sub></a><br /><a href="https://github.com/kubb-labs/kubb/commits?author=DesselBane" title="Code">💻</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

## License

Most of this repository is licensed under the [MIT License](./licenses/LICENSE-MIT), Copyright © 2025 [Stijn Van Hulle](https://stijnvanhulle.be). Most packages use [MIT](./licenses/LICENSE-MIT), and `@kubb/agent` uses [AGPL-3.0-or-later](./licenses/LICENSE-AGPL-3.0).

See [LICENSE](./LICENSE) for details.

## Star history

<a href="https://star-history.com/#kubb-labs/kubb&Date">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=kubb-labs/kubb&type=Date&theme=dark" />
    <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=kubb-labs/kubb&type=Date" />
    <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=kubb-labs/kubb&type=Date" />
  </picture>
</a>

<!-- Badges -->

[npm-version-src]: https://shieldcn.dev/npm/v/kubb.svg?variant=secondary&size=xs&theme=zinc&mode=dark
[npm-version-href]: https://npmx.dev/package/kubb
[npm-downloads-src]: https://shieldcn.dev/npm/dm/kubb.svg?variant=secondary&size=xs&theme=zinc&mode=dark
[npm-downloads-href]: https://npmx.dev/package/kubb
[stars-src]: https://shieldcn.dev/github/stars/kubb-labs/kubb.svg?variant=secondary&size=xs&theme=zinc&mode=dark
[stars-href]: https://github.com/kubb-labs/kubb
[license-src]: https://shieldcn.dev/npm/license/kubb.svg?variant=secondary&size=xs&theme=zinc&mode=dark
[license-href]: https://github.com/kubb-labs/kubb/blob/main/LICENSE
[node-src]: https://shieldcn.dev/npm/node/kubb.svg?variant=secondary&size=xs&theme=zinc&mode=dark
[node-href]: https://npmx.dev/package/kubb
[contributors-src]: https://shieldcn.dev/github/contributors/kubb-labs/kubb.svg?variant=secondary&size=xs&theme=zinc&mode=dark
[contributors-href]: #contributors-
[coverage-src]: https://shieldcn.dev/codecov/github/kubb-labs/kubb.svg?variant=secondary&size=xs&theme=zinc&mode=dark
[coverage-href]: https://app.codecov.io/gh/kubb-labs/kubb
