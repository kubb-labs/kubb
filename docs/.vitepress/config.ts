import { createWriteStream } from 'node:fs'
import { resolve } from 'node:path'

import { SitemapStream } from 'sitemap'
import { defineConfig } from 'vitepress'

import { version } from '../../packages/core/package.json'

const ogImage = 'https://kubb.dev/og.png'
const title = 'Generate SDKs for all your APIs'
const description = 'OpenAPI to TypeScript, React-Query, Zod, Zodios, Faker.js, MSW and Axios. '

const links: Array<{ url: string; lastmod: number | undefined }> = []

const guideSidebar = [
  {
    text: 'Getting Started',
    items: [
      {
        text: 'Introduction',
        link: '/guide/introduction',
      },
      {
        text: 'Installation',
        link: '/guide/installation',
      },
      // {
      //   text: 'Comparison <span class="beta">under construction</span>',
      //   link: '/comparison',
      // },
      {
        text: 'Quick start',
        link: '/guide/quick-start',
      },
    ],
  },
  {
    text: 'Configuration',
    items: [
      {
        text: 'Options',
        link: '/guide/options',
      },
      {
        text: 'Configuring Kubb',
        link: '/guide/configure',
      },
    ],
  },
  {
    text: 'Tutorials',
    collapsed: false,
    items: [
      {
        text: 'Basic tutorial',
        link: '/guide/tutorial/basic',
      },
      {
        text: 'Templates tutorial <span class="new">new</span>',
        link: '/guide/tutorial/templates',
      },
    ],
  },
]

const referenceSidebar = [
  {
    text: 'Plugins',
    collapsed: false,
    items: [
      {
        text: 'Introduction',
        link: '/plugins/introduction',
      },
      {
        text: '@kubb/core',
        collapsed: true,
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
        collapsed: true,
        items: [
          { text: '@kubb/swagger', link: '/plugins/swagger' },
          {
            text: '@kubb/swagger-client',
            collapsed: true,
            link: '/plugins/swagger-client/',
            items: [
              {
                text: 'globals.d.ts',
                link: '/plugins/swagger-client/globals',
              },
              {
                text: 'client',
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
            text: '@kubb/swagger-msw <span class="new">v2 support</span>',
            link: '/plugins/swagger-msw',
          },
        ],
      },
      {
        text: '@kubb/parser',
        link: '/plugins/parser',
      },
      {
        text: '@kubb/react <span class="new">New</span>',
        link: '/plugins/react/',
        collapsed: true,
        items: [
          {
            text: 'Components',
            link: '/plugins/react/components/',
            items: [
              {
                text: 'Text',
                link: '/plugins/react/components/text',
              },
              {
                text: 'Function',
                link: '/plugins/react/components/function',
              },
              {
                text: 'Type',
                link: '/plugins/react/components/type',
              },
              {
                text: 'File',
                link: '/plugins/react/components/file',
              },
            ],
          },
          {
            text: 'Hooks',
            link: '/plugins/react/hooks/',
            items: [],
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
      {
        text: 'Templates <img src="/icons/experimental.svg"/>',
        link: '/reference/templates',
      },
    ],
  },
]

const examplesSidebar = [
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
        text: 'Vue-Query v5 <span class="new">new</span>',
        link: '/examples/tanstack-query/vue-query-v5',
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
]

const blogSidebar = [
  {
    text: 'Release of Kubb v2',
    link: '/blog/v2',
  },
]

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
      { text: 'Guide', link: '/guide/introduction' },
      { text: 'Reference', link: '/plugins/introduction' },
      { text: 'Examples', link: '/examples/typescript' },
      { text: 'Playground', link: '/playground' },
      {
        text: 'Blog',
        link: '/blog/v2',
      },
      {
        text: `v${version}`,
        items: [
          {
            text: '1.0.0',
            link: 'https://kubb.dev',
            target: '_blank',
          },
          {
            text: 'Releases',
            link: 'https://github.com/kubb-project/kubb/releases',
            target: '_blank',
          },

          {
            text: 'Sponsor Kubb',
            link: 'https://github.com/sponsors/stijnvanhulle/',
            target: '_blank',
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
      {
        text:
          `<iframe src="https://github.com/sponsors/stijnvanhulle/button" title="Sponsor stijnvanhulle" height="32" width="114" style="border: 0; border-radius: 6px;"></iframe>
      `,
        link: '',
      },
    ],
    editLink: {
      pattern: 'https://github.com/kubb-project/kubb/edit/main/docs/src/:path',
    },
    sidebar: {
      '/configuration': guideSidebar,
      '/guide': guideSidebar,
      '/plugins': referenceSidebar,
      '/reference': referenceSidebar,
      '/examples': examplesSidebar,
      '/blog': blogSidebar,
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/kubb-project/kubb' },
      { icon: 'discord', link: 'https://discord.gg/shfBFeczrm' },
      { icon: 'x', link: 'https://twitter.com/kubbproject' },
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
