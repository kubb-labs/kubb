---
layout: doc

title: Introduction
outline: deep
---

<script setup>

import { version } from '../../packages/core/package.json'

</script>

# Introduction

Hi 👋🏽 and welcome to Kubb<img width="30" style="display: inline-block;line-height: 30px;" src="/logo.png"/>!<br/>

My name is <a href="https://twitter.com/stijnvanhulle">Stijn Van Hulle</a>, the creator of Kubb and I'm super excited to have you here! Let me give you a quick introduction to Kubb and what it can do for your project.

## 💡 What is Kubb

**Kubb** is a library and toolkit that converts your _Swagger/OpenAPI_ specification to one of the generated client libraries (TypeScript, React-Query, Zod, Zodios, Faker.js and Axios).

<hr/>

Imagine that your backend team is writing an API in Java/Kotlin, how do you connect your frontend to their system without the need of communicating on every API change.
This is not a new problem and has already been resolved with the use of a Swagger/OpenAPI specification combined with a <a href="https://tools.openapis.org/categories/code-generators.html">code generator</a>.

The problem is that most of them are good at one _thing_: generating TypeScript types or generating React-Query hooks.
Kubb is trying to resolve that with a plugin system where we already provide you with some <a href="/plugins/overview">generation plugins</a> but also giving you the possibilty to create your own custom plugin without the need of forking the full project.

<iframe src="https://github.com/sponsors/stijnvanhulle/button" title="Sponsor stijnvanhulle" height="32" width="114" style="border: 0; border-radius: 6px;"></iframe>

## 🔥 Features

Kubb has the following features:

- **Easy to Configure**: One of the goals of Kubb is to provide out-of-the-box plugins and utils for converting your Swagger/OpenAPI file to generated code.<br/><br/>You want to use a Swagger/OpenAPI file or URL, you want to split up the generated code based on a tag in the file, you want to use multiple Swagger/OpenApi files, we have you covered!
- **Generate SDK's**: Convert your Swagger/OpenAPI file to TypeScript, React-Query, Zod, Zodios, Faker.js, MSW and Axios.
- **Templates**: Override/change the generated output of a plugin with the help of [JSX templates(React)](/reference/templates).
- **Plugin Ecosystem**: Kubb has a [plugin system](/plugins/introdution) that makes it possible to change or add functionalities based on your needs.
- **CLI**: See in real-time what is getting generated or processed.
- And so much more ...

## 🧑‍💻 Community

Come and chat with us on [Discord](https://discord.gg/shfBFeczrm)! We're always looking for some contributions.

See [kubb.config.js](/guide/configure) on how to configure Kubb.
