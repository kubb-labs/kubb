---
layout: doc

title: At Glance
outline: deep
---

# At Glance
Kubb is a library and toolkit that transforms your [Swagger/OpenAPI](/knowledge-base/oas) specification into various client libraries, including:
- [TypeScript](/plugins/plugin-ts/)
- [React-Query](/plugins/plugin-react-query/)
- [Vue-Query](/plugins/plugin-vue-query/)
- [Solid-Query](/plugins/plugin-solid-query/)
- [Svelte-Query](/plugins/plugin-svelte-query/)
- [Zod](/plugins/plugin-zod/)
- [Faker.js](/plugins/plugin-faker/)
- [Axios](/plugins/plugin-client/)
- [Redoc](/plugins/plugin-redoc/)
- ...

Additionally, Kubb features a plugin system, enabling you to build custom implementations and integrate other libraries.

<iframe src="https://github.com/sponsors/stijnvanhulle/button" title="Sponsor stijnvanhulle" height="32" width="114" style="border: 0; border-radius: 6px;"></iframe>

## Features
- Works with Node.js 20+.
- Supports Swagger 2.0, OpenAPI 3.0, and OpenAPI 3.1.
- Plugin Ecosystem of Kubb to extend beyond the default plugins we provide.
- CLI support with progressbar and logs.
- Debug tools with [React DevTools](/knowledge-base/debugging).
- Generate barrel files(index.ts).
- And so much more ...

## Philosophy

Imagine that your backend team is writing an API in Java/Kotlin, how do you connect your frontend to their system without the need of communicating on every API change.
This is not a new problem and has already been resolved with the use of a Swagger/OpenAPI specification combined with a <a href="https://tools.openapis.org/categories/code-generators.html">code generator</a>. This concept is called [contract-first development](https://medium.com/@dxloop/contract-first-approach-with-node-js-and-openapi-for-rest-services-d2283a7ffd9d) and one of our maintainer wrote this amazing article showing casing the use cases of Kubb.

The problem is that most of them are good at one _thing_: generating TypeScript types or generating React-Query hooks.
Kubb is trying to resolve that with a plugin system where we already provide you with some plugins but also giving you the possibility to create [your own plugin](/knowledge-base/plugins/).


## Sponsoring
Kubb is open source and build by the community, help us building Kubb by [sponsoring](https://github.com/sponsors/stijnvanhulle) us.

## Projects Build With Kubb

- [https://github.com/dxloop/koper](KOPER): a modern tech stack design for creating full-stack application powered by Kubb.


## Our Community
Come and chat with us on [Discord](https://discord.gg/shfBFeczrm)!

We're always looking for some contributions.
