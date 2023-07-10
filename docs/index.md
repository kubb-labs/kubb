---
layout: home
sidebar: false

title: Kubb
titleTemplate: Generate SDKs for all your APIs

hero:
  name: Kubb
  text: Generate SDKs for all your APIs
  tagline: OpenAPI to TypeScript, React-Query, Zod, Zodios, Faker.js and Axios. 
  image:
    src: /logo.png
    alt: Kubbb
  actions:
    - theme: brand
      text: Get Started
      link: /introduction
    - theme: alt
      text: Playground
      link: /playground
    - theme: alt
      text: View on GitHub
      link: https://github.com/kubb-project/kubb

features:
  - icon: 
      src: ./feature/typescript.svg
      height: 24
    title: TypeScript
    details: Out-of-box <a href="https://www.typescriptlang.org/">TypeScript</a> (with JSDoc) support.
  - icon: 
      src: ./feature/tanstack.svg
      height: 24
    title: Tanstack Query
    details: Creates hooks for all supported <a href="https://tanstack.com/query/latest">Tanstack-Query</a> frameworks (React, Solid, Svelte, Vue).
  - icon: 
      dark: ./feature/swr-dark.svg
      light: ./feature/swr-light.svg
      height: 24
    title: SWR
    details: Creates hooks for React with <a href="https://swr.vercel.app/">SWR</a>.
  - icon: 
      src: ./feature/zod.svg
      height: 24
    title: Zod
    details: Validates your data with the power of <a href="https:/zod.dev/">Zod</a> schemas.
  - icon: 
      src: ./feature/zodios.svg
    title: Zodios
    details: <a href="https://www.zodios.org"/>End-to-end typesafe REST API toolbox</a> created based on our <a href="https:/zod.dev/">Zod</a> plugin.
  - icon: 
      src: ./feature/axios.svg
    title: Axios
    details: <a href="https://axios-http.com/">Promise based HTTP calls</a> with a custom Client to set baseURL, headers, ... options.
  - icon: 
      dark: ./feature/form-dark.svg
      light: ./feature/form-light.svg
    title: Forms <span class="new">new</span> <span class="beta">beta</span>
    details: Create forms based on your Swagger/OpenAPI file with support for <a href="https://react-hook-form.com/">react-hook-form</a>, <a href="https://www.data-driven-forms.org/">data-driven-forms</a>.
  - icon: 
      src: https://fakerjs.dev/logo.svg
    title: Faker <span class="new">new</span>
    details: Use of <a href="https://fakerjs.dev/">Fake.js</a> to create mock data that can be used to create fake API calls. Useful when using <a href="https://mswjs.io/">MSW</a> 
  - icon: 
      src: ./feature/json.svg
    title: JSON Schemas
    details: Reuse the JSON schemas that are created inside your Swagger/OpenAPI file.
  - icon: 
      src: ./feature/cli.svg
    title: CLI support
    details: Log and see what is happening with the <span class="code">Kubb</span> CLI command.
  - icon: 
      dark: ./feature/plugins-dark.svg
      light: ./feature/plugins-light.svg
    title: Extensible with plugins
    details: Create your own plugin or fork and change one of the default plugins with your own flavour without the need of forking the full project.
---
