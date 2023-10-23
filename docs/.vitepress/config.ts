import { createWriteStream } from 'node:fs'
import { resolve } from 'node:path'

import { SitemapStream } from 'sitemap'
import { defineConfig } from 'vitepress'

import { version } from '../../packages/core/package.json'

const ogImage = 'https://kubb.dev/og.png'
const title = 'Generate SDKs for all your APIs'
const description = 'OpenAPI to TypeScript, React-Query, Zod, Zodios, Faker.js, MSW and Axios. '

const links: Array<{ url: string; lastmod: number | undefined }> = []

// https://vitepress.dev/reference/site-config
export default defineConfig({
  lang: 'en-UK',
  title: 'Kubb',
  description: title,
  head: [
    ['meta', { property: 'og:title', content: `Kubb: ${title}` }],
    ['meta', { property: 'og:image', content: ogImage }],
    ['meta', { property: 'og:description', content: description }],
    ['meta', { property: 'og:url', content: 'https://kubb.dev' }],
    ['meta', { name: 'twitter:image', content: ogImage }],
    ['meta', { name: 'theme-color', content: '#DBCAFF' }],
    ['meta', { property: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { property: 'twitter:site:domain', content: 'kubb.dev' }],
    ['meta', { property: 'twitter:site:url', content: 'https://kubb.dev' }],
    ['meta', { property: 'twitter:title', content: title }],
    ['meta', { property: 'twitter:description', content: description }],
    ['link', { rel: 'icon', href: '/logo.png', type: 'image/png' }],
    ['link', { rel: 'mask-icon', href: '/logo.png', color: '#ffffff' }],
  ],
  transformHtml: (_, id, { pageData }) => {
    if (!/[\\/]404\.html$/.test(id)) {
      links.push({
        // you might need to change this if not using clean urls mode
        url: pageData.relativePath.replace(/((^|\/)index)?\.md$/, '$2'),
        lastmod: pageData.lastUpdated,
      })
    }
  },
  buildEnd: async ({ outDir }) => {
    const sitemap = new SitemapStream({
      hostname: 'https://kubb.dev/',
    })
    const writeStream = createWriteStream(resolve(outDir, 'sitemap.xml'))
    sitemap.pipe(writeStream)
    links.forEach((link) => sitemap.write(link))
    sitemap.end()
    await new Promise((r) => writeStream.on('finish', r))
  },
  cleanUrls: true,
  ignoreDeadLinks: true,
  lastUpdated: true,
  markdown: {
    theme: {
      light: 'github-light',
      dark: 'nord',
    },
    lineNumbers: true,
  },
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: {
      src: '/logo.png',
    },
    search: {
      provider: 'local',
    },
    nav: [
      { text: 'Introduction', link: '/introduction' },
      { text: 'Guides', link: '/guides/basic-usage' },
      { text: 'Plugins', link: '/plugins/introduction' },
      { text: 'Examples', link: '/examples/typescript' },
      { text: 'Playground', link: '/playground' },
      {
        text: `v${version}`,
        items: [
          {
            text: 'Releases',
            link: 'https://github.com/kubb-project/kubb/releases',
          },
          {
            text: 'Sponsor Kubb',
            link: 'https://github.com/sponsors/stijnvanhulle/',
          },
          {
            text: 'Contribute Kubb',
            link: '/contributing',
          },
          {
            text: 'About Kubb',
            link: '/about',
          },
        ],
      },
    ],
    editLink: {
      pattern: 'https://github.com/kubb-project/kubb/edit/main/docs/src/:path',
    },
    sidebar: [
      {
        text: 'Getting Started',
        items: [
          {
            text: 'Introduction',
            link: '/introduction',
          },
          {
            text: 'Comparison <span class="beta">under construction</span>',
            link: '/comparison',
          },
          {
            text: 'Quick start',
            link: '/quick-start',
          },
        ],
      },
      {
        text: 'Configuration',
        items: [
          {
            text: 'Options',
            link: '/configuration/options',
          },
          {
            text: '<code class="code">kubb.config.js</code>',
            link: '/configuration/configure',
          },
        ],
      },
      {
        text: 'Usage Guides',
        collapsed: false,
        items: [
          {
            text: 'Basic Usage',
            link: '/guides/basic-usage',
          },
        ],
      },
      {
        text: 'Plugins',
        collapsed: false,
        items: [
          {
            text: 'Introduction',
            link: '/plugins/introduction',
          },
          {
            text: 'Template',
            link: '/plugins/template',
          },
          {
            text: '@kubb/core',
            link: '/plugins/core/',
            items: [
              {
                text: 'globals.d.ts',
                link: '/plugins/core/globals',
              },
            ],
          },
          {
            text: '@kubb/cli',
            link: '/plugins/cli',
          },
          {
            text: 'Swagger plugins',
            collapsed: false,
            items: [
              { text: '@kubb/swagger', link: '/plugins/swagger' },
              {
                text: '@kubb/swagger-client',
                link: '/plugins/swagger-client/',
                items: [
                  {
                    text: 'globals.d.ts <span class="beta">beta</span>',
                    link: '/plugins/swagger-client/globals',
                  },
                  {
                    text: 'client <span class="beta">beta</span>',
                    link: '/plugins/swagger-client/client',
                  },
                ],
              },
              {
                text: '@kubb/swagger-ts',
                link: '/plugins/swagger-ts',
              },
              {
                text: '@kubb/swagger-zod',
                link: '/plugins/swagger-zod',
              },
              {
                text: '@kubb/swagger-zodios',
                link: '/plugins/swagger-zodios',
              },
              {
                text: '@kubb/swagger-tanstack-query <span class="new">v5 support</span>',
                link: '/plugins/swagger-tanstack-query',
              },
              {
                text: '@kubb/swagger-swr',
                link: '/plugins/swagger-swr',
              },
              {
                text: '@kubb/swagger-faker',
                link: '/plugins/swagger-faker',
              },
              {
                text: '@kubb/swagger-msw',
                link: '/plugins/swagger-msw',
              },
            ],
          },
          {
            text: 'Internal plugins',
            collapsed: false,
            items: [
              {
                text: '@kubb/parser',
                link: '/plugins/parser',
              },
              {
                text: '@kubb/react <span class="beta">under construction</span>',
                link: '/plugins/react',
              },
            ],
          },
        ],
      },
      {
        text: 'API <span class="beta">under construction</span>',
        collapsed: false,
        items: [
          {
            text: 'FileManager',
            link: '/reference/fileManager',
          },
          {
            text: 'PluginManager',
            link: '/reference/pluginManager',
          },
        ],
      },
      {
        text: 'Examples(PetStore)',
        collapsed: false,
        items: [
          {
            text: 'TypeScript',
            link: '/examples/typescript',
          },
          {
            text: 'Tanstack-Query',
            items: [
              {
                text: 'React-Query',
                link: '/examples/tanstack-query/react-query',
              },
              {
                text: 'React-Query v5 <span class="new">new</span>',
                link: '/examples/tanstack-query/react-query-v5',
              },
              {
                text: 'Vue-Query',
                link: '/examples/tanstack-query/vue-query',
              },
              {
                text: 'Svelte-Query',
                link: '/examples/tanstack-query/svelte-query',
              },
              {
                text: 'Solid-Query',
                link: '/examples/tanstack-query/solid-query',
              },
            ],
          },
          {
            text: 'SWR-Query',
            link: '/examples/swr',
          },
          {
            text: 'Zod',
            link: '/examples/zod',
          },
          {
            text: 'Faker',
            link: '/examples/faker',
          },
          {
            text: 'MSW',
            link: '/examples/msw',
          },
          {
            text: 'Simple',
            link: '/examples/simple',
          },
          {
            text: 'Client',
            link: '/examples/client',
          },
          {
            text: 'Advanced',
            link: '/examples/advanced',
          },
        ],
      },
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/kubb-project/kubb' },
      { icon: 'discord', link: 'https://discord.gg/shfBFeczrm' },
      { icon: 'twitter', link: 'https://twitter.com/kubbproject' },
    ],
    footer: {
      message: 'Released under the MIT License.',
      copyright: `Copyright © 2022-${new Date().getFullYear()} Stijn Van Hulle`,
    },
    // algolia: {
    //   appId: "",
    //   apiKey: "",
    //   indexName: "",
    // },
  },
})
