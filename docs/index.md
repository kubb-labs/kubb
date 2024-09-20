---
layout: home
sidebar: false

title: Kubb
titleTemplate: The ultimate toolkit for working with APIs

hero:
  text: The ultimate toolkit for working with APIs
  tagline: OpenAPI to TypeScript, React-Query, Zod, Faker.js, MSW and Axios.
  image:
    src: /logo.png
    alt: Kubbb
  actions:
    - theme: brand
      text: Get Started
      link: /getting-started/at-glance
    - theme: alt
      text: Playground
      link: /playground
    - theme: alt
      text: View on GitHub
      link: https://github.com/kubb-labs/kubb

features:
  - icon:
      src: ./feature/openapi.svg
      height: 24
    title: OpenAPI/Swagger
    details: Supports OpenAPI 2.0, 3.0, and 3.1.
    link: /plugins/plugin-oas/
    linkText: Learn more
  - icon:
      src: ./feature/typescript.svg
      height: 24
    title: TypeScript
    details: Out-of-the-box support for<a href="https://www.typescriptlang.org/">TypeScript</a> with JSDoc integration.
    link: /plugins/plugin-ts
    linkText: Learn more
  - icon:
      src: ./feature/tanstack.svg
      height: 24
    title: Tanstack Query
    details: Generate query keys, query options and hooks with support for React, Solid, Svelte, Vue.
    link: /plugins/plugin-react-query
    linkText: Learn more
  - icon:
      dark: ./feature/swr-dark.svg
      light: ./feature/swr-light.svg
      height: 24
    title: SWR
    details: Creates React Hooks for <a href="https://swr.vercel.app/">SWR</a>.
    link: /plugins/plugin-swr
    linkText: Learn more
  - icon:
      src: ./feature/axios.svg
    title: Axios
    details: <a href="https://axios-http.com/">Promise-based HTTP calls</a> with override possibilities for Fetch, ky,...
    link: /plugins/plugin-client/
    linkText: Learn more
  - icon:
      src: ./feature/msw.svg
    title: MSW
    details: Use of <a href="https://mswjs.io/">MSW</a> to create API mocks based on the faker generated data.
    link: /plugins/plugin-msw
    linkText: Learn more
  - icon:
      src: ./feature/zod.svg
      height: 24
    title: Zod
    details: Create <a href="https://zod.dev/">Zod</a> schemas that could be use to validate your data.
    link: /plugins/plugin-zod
    linkText: Learn more
  - icon:
      src: https://fakerjs.dev/logo.svg
    title: Faker
    details: Use of <a href="https://fakerjs.dev/">Fake.js</a> to create mock data for testing and development of APIs.
    link: /plugins/plugin-faker
    linkText: Learn more
  - icon:
      src: ./feature/json.svg
    title: JSON Schemas
    details: Export your OpenAPI schema's as JSON schema's.
    link: /plugins/plugin-oas
    linkText: Learn more
  - icon:
      dark: ./feature/plugins-dark.svg
      light: ./feature/plugins-light.svg
    title: Extensible with plugins
    details: Build your own plugin or modify one of the default plugins to suit your needs.
    link: /plugins/
    linkText: Learn more
---
