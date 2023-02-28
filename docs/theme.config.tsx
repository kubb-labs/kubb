import React from 'react'

import type { DocsThemeConfig } from 'nextra-theme-docs'

export default {
  project: {
    link: 'https://github.com/stijnvanhulle/kubb.git',
  },
  docsRepositoryBase: 'https://github.com/stijnvanhulle/kubb/blob/main/docs',
  titleSuffix: ' – Kubb',
  useNextSeoProps() {
    return {
      titleTemplate: '%s – Kubb',
    }
  },
  i18n: [],
  logo: (
    <>
      <span
        style={{
          fontSize: '2rem',
          marginRight: '1rem',
        }}
        className="mr-2 font-extrabold md:inline"
      >
        Kubb
      </span>
      <span className="text-gray-400 font-normal md:inline">OpenAPI generated clients</span>
    </>
  ),
  head: () => (
    <>
      <meta name="msapplication-TileColor" content="#ffffff" />
      <meta name="theme-color" content="#ffffff" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="Content-Language" content="en" />
      <meta name="description" content="Kubb: OpenAPI generated clients" />
      <meta name="og:description" content="Kubb: OpenAPI generated clients" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:image" content="https://kubb.dev/og.png" />
      <meta name="twitter:site:domain" content="kubb.dev" />
      <meta name="twitter:url" content="https://kubb.dev" />
      <meta name="og:title" content="Kubb: OpenAPI generated clients" />
      <meta name="og:image" content="https://kub.dev/og.png" />
      <meta name="apple-mobile-web-app-title" content="Kubb" />
      <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      <link rel="icon" href="/favicon.png" type="image/png" />
      <link rel="icon" href="/favicon-dark.svg" type="image/svg+xml" media="(prefers-color-scheme: dark)" />
      <link rel="icon" href="/favicon-dark.png" type="image/png" media="(prefers-color-scheme: dark)" />
    </>
  ),
  banner: {
    key: '2.0-release',
    text: <>Kubb is still in beta</>,
  },
  navigation: {
    prev: true,
    next: true,
  },
  editLink: {
    text: 'Edit this page on GitHub',
  },
  footer: {
    text: `MIT ${new Date().getFullYear()} © Stijn Van Hulle.`,
  },
  toc: {
    float: true,
  },
  sidebar: {
    defaultMenuCollapsed: true,
    subtitle: ({ title }) => <>{title}</>,
  },
} as DocsThemeConfig
