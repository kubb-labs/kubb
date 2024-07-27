---
layout: home
sidebar: false

title: Kubb
titleTemplate: Generate SDKs for all your APIs

hero:
  name: Kubb
  text: Generate SDKs for all your APIs
  tagline: OpenAPI to TypeScript, React-Query, Zod, Zodios, Faker.js, MSW and Axios.
  image:
    src: /logo.png
    alt: Kubbb
  actions:
    - theme: brand
      text: Get Started
      link: /guide/introduction
    - theme: alt
      text: Playground
      link: /playground
    - theme: alt
      text: View on GitHub
      link: https://github.com/kubb-labs/kubb

features:
  - icon:
      src: ./feature/typescript.svg
      height: 24
    title: TypeScript
    details: Out-of-box <a href="https://www.typescriptlang.org/">TypeScript</a> (with JSDoc) support. <div class="learn-more"><a href="/plugins/swagger-ts">Learn more</a></div>
  - icon:
      src: ./feature/tanstack.svg
      height: 24
    title: Tanstack Query <span class="new">v5 support</span>
    details: Creates hooks for all supported <a href="https://tanstack.com/query/latest">Tanstack-Query</a> frameworks (React, Solid, Svelte, Vue). <div class="learn-more"><a href="/plugins/swagger-tanstack-query">Learn more</a></div>
  - icon:
      dark: ./feature/swr-dark.svg
      light: ./feature/swr-light.svg
      height: 24
    title: SWR
    details: Creates React Hooks for Data Fetching with <a href="https://swr.vercel.app/">SWR</a>. <div class="learn-more"><a href="/plugins/plugin-swr">Learn more</a></div>
  - icon:
      src: ./feature/axios.svg
    title: Axios
    details: <a href="https://axios-http.com/">Promise-based HTTP calls</a> with a custom Client to set baseURL, headers, ... options. <div class="learn-more"><a href="/plugins/plugin/">Learn more</a></div>
  - icon:
      src: ./feature/msw.svg
    title: MSW <span class="new">v2 support</span>
    details: Use of <a href="https://mswjs.io/">MSW</a> to create API mocks based on faker data. <div class="learn-more"><a href="/plugins/swagger-msw">Learn more</a></div>
  - icon:
      src: ./feature/zod.svg
      height: 24
    title: Zod
    details: Validates your data with the power of <a href="https://zod.dev/">Zod</a> schemas. <div class="learn-more"><a href="/plugins/swagger-zod">Learn more</a></div>
  - icon:
      src: ./feature/zodios.svg
    title: Zodios
    details: <a href="https://www.zodios.org"/>End-to-end typesafe REST API toolbox</a> created based on our <a href="https://zod.dev/">Zod</a> plugin. <div class="learn-more"><a href="/plugins/plugin-zodios">Learn more</a></div>
  - icon:
      src: https://fakerjs.dev/logo.svg
    title: Faker
    details: Use of <a href="https://fakerjs.dev/">Fake.js</a> to create mock data that can be used to create fake API calls. <div class="learn-more"><a href="/plugins/swagger-faker">Learn more</a></div>
  - icon:
      src: ./feature/json.svg
    title: JSON Schemas
    details: Reuse the JSON schemas that are created inside your Swagger/OpenAPI file. <div class="learn-more"><a href="/plugins/swagger">Learn more</a></div>
  - icon:
      src: ./feature/cli.svg
    title: CLI support
    details: Log in and see what is happening with the <span class="code">Kubb</span> CLI command. <div class="learn-more"><a href="/plugins/cli">Learn more</a></div>
  - icon:
      dark: ./feature/plugins-dark.svg
      light: ./feature/plugins-light.svg
    title: Extensible with plugins
    details: Create your own plugin or fork and change one of the default plugins with your flavor(without a Kubb fork). <div class="learn-more"><a href="/plugins/overview">Learn more</a></div>
  - icon:
      src: ./feature/react.svg
      height: 24
    title: Templates
    details: Customize the generated files/output based on a custom-defined JSX(React) template. <div class="learn-more"><a href="/reference/templates">Learn more</a></div>

---
<!--
Ideas
 https://github.com/elysiajs/documentation/blob/14601f322b42023ea8b50edd3584545915bbda0e/docs/index.md?plain=1
 https://github.com/elysiajs/documentation/blob/14601f322b42023ea8b50edd3584545915bbda0e/components/midori/index.vue
-->
