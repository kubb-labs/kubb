import { createWriteStream } from 'node:fs'
import { resolve } from 'node:path'

import { transformerTwoslash } from '@shikijs/vitepress-twoslash'
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
      {
        text: 'Configure',
        link: '/guide/configure',
      },
      {
        text: 'CLI',
        link: '/guide/cli',
      },
      {
        text: 'Quick start',
        link: '/guide/quick-start',
      },
    ],
  },

  {
    text: 'Tutorials',
    collapsed: false,
    items: [
      {
        text: 'Basic',
        link: '/guide/tutorial/basic',
      },
      {
        text: 'Templates <span class="new">new</span>',
        link: '/guide/tutorial/templates',
      },
    ],
  },
]

const configSidebar = [
  {
    text: 'Overview',
    link: '/config/overview',
  },
  {
    text: 'Options',
    collapsed: false,
    items: [
      {
        text: 'name <span class="new">new</span>',
        link: '/config/name',
      },
      {
        text: 'root',
        link: '/config/root',
      },
      {
        text: 'input',
        link: '/config/input',
      },
      {
        text: 'output',
        link: '/config/output',
      },
      {
        text: 'plugins',
        link: '/config/plugins',
      },
      {
        text: 'hooks',
        link: '/config/hooks',
      },
    ],
  },
]

const referenceSidebar = [
  {
    text: 'Overview',
    link: '/reference/overview',
  },
  {
    text: 'FileManager',
    link: '/reference/fileManager',
  },
  {
    text: 'PluginManager',
    link: '/reference/pluginManager/',
    collapsed: false,
    items: [
      {
        text: 'Lifecycle',
        link: '/reference/pluginManager/lifecycle',
      },
    ],
  },
  {
    text: 'Templates <span class="new">new</span><img src="/icons/experimental.svg"/>',
    link: '/reference/templates',
  },
]

const pluginsSidebar = [
  {
    text: 'Overview',
    link: '/plugins/overview',
  },
  {
    text: 'Parsers',
    collapsed: false,
    items: [
      {
        text: '@kubb/parser-ts',
        link: '/plugins/parser-ts/',
      },
    ],
  },
  {
    text: 'Helpers',
    collapsed: false,
    items: [
      {
        text: '@kubb/cli',
        link: '/plugins/cli/',
      },
      {
        text: '@kubb/oas',
        link: '/plugins/oas/',
        collapsed: true,
        items: [
          {
            text: 'Infer <img src="/icons/experimental.svg"/> <span class="new">new</span>',
            link: '/plugins/oas/infer',
          },
        ],
      },
      {
        text: '@kubb/react',
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
                text: 'Parser',
                link: '/plugins/react/components/parser',
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
    text: 'Plugins',
    collapsed: false,
    items: [
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
        text: '@kubb/plugin-oas',
        link: '/plugins/plugin-oas/',
        collapsed: true,
        items: [
          {
            text: 'Hooks',
            link: '/plugins/plugin-oas/hooks/',
          },
        ],
      },
      {
        text: '@kubb/plugin-client',
        link: '/plugins/plugin-client/',
        collapsed: true,
      },
      {
        text: '@kubb/plugin-ts',
        link: '/plugins/plugin-ts/',
      },
      {
        text: '@kubb/plugin-zod',
        link: '/plugins/plugin-zod/',
      },
      {
        text: '@kubb/plugin-zodios',
        link: '/plugins/plugin-zodios/',
      },
      {
        text: '@kubb/plugin-tanstack-query',
        link: '/plugins/plugin-tanstack-query/',
      },
      {
        text: '@kubb/plugin-swr',
        link: '/plugins/plugin-swr/',
      },
      {
        text: '@kubb/plugin-faker',
        link: '/plugins/plugin-faker/',
      },
      {
        text: '@kubb/plugin-msw',
        link: '/plugins/plugin-msw/',
      },
      {
        text: '@kubb/plugin-redoc',
        link: '/plugins/plugin-redoc/',
      },
    ],
  },
  {
    text: 'Build tools',
    collapsed: false,
    items: [
      {
        text: 'unplugin-kubb <span class="new">new</span>',
        collapsed: false,
        link: '/plugins/unplugin/',
      },
    ],
  },
  {
    text: 'Development',
    collapsed: false,
    items: [
      {
        text: 'Plugin system <img src="/icons/experimental.svg"/>',
        link: '/plugins/development/system',
      },
      {
        text: 'Plugin core <img src="/icons/experimental.svg"/>',
        link: '/plugins/development/core',
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
        text: 'Vue-Query',
        link: '/examples/tanstack-query/vue-query',
      },
      {
        text: 'Vue-Query v5',
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
  {
    text: 'Templates <span class="new">new</span>',
    link: '/examples/client',
  },
  {
    text: 'Python <span class="new">new</span>',
    link: '/examples/python',
  },
]

const blogSidebar = [
  {
    text: 'Release of Kubb 3.0',
    link: '/blog/v3',
  },
  {
    text: 'Release of Kubb 2.0',
    link: '/blog/v2',
  },
  {
    text: 'Benefits of using JSX for templates',
    link: '/blog/benefits-of-templates',
  },
]

const pluginsMenu = [
  {
    text: 'Overview',
    link: '/plugins/overview',
  },
  {
    text: 'Parsers',
    items: [
      {
        text: '@kubb/parser-ts',
        link: '/plugins/parser-ts/',
      },
    ],
  },
  {
    text: 'Helpers',
    items: [
      {
        text: '@kubb/cli',
        link: '/plugins/cli/',
      },
      {
        text: '@kubb/oas',
        link: '/plugins/oas/',
      },
      {
        text: '@kubb/react',
        link: '/plugins/react/',
      },
    ],
  },
  {
    text: 'Plugins',
    items: [
      {
        text: '@kubb/core',
        link: '/plugins/core/',
      },
      {
        text: '@kubb/plugin-oas',
        link: '/plugins/plugin-oas/',
      },
      {
        text: '@kubb/plugin-client',
        link: '/plugins/plugin-client/',
      },
      {
        text: '@kubb/plugin-ts',
        link: '/plugins/plugin-ts/',
      },
      {
        text: '@kubb/plugin-zod',
        link: '/plugins/plugin-zod/',
      },
      {
        text: '@kubb/plugin-zodios',
        link: '/plugins/plugin-zodios/',
      },
      {
        text: '@kubb/plugin-tanstack-query',
        link: '/plugins/plugin-tanstack-query/',
      },
      {
        text: '@kubb/plugin-swr',
        link: '/plugins/plugin-swr/',
      },
      {
        text: '@kubb/plugin-faker',
        link: '/plugins/plugin-faker/',
      },
      {
        text: '@kubb/plugin-msw',
        link: '/plugins/plugin-msw/',
      },
      {
        text: '@kubb/plugin-redoc',
        link: '/plugins/plugin-redoc/',
      },
    ],
  },
  {
    text: 'Build tools',
    items: [
      {
        text: 'unplugin-kubb',
        link: '/plugins/unplugin/',
      },
    ],
  },
  {
    text: 'Development',
    items: [
      {
        text: 'Plugin system',
        link: '/plugins/development/system',
      },
      {
        text: 'Plugin core',
        link: '/plugins/development/core',
      },
    ],
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
    [
      'script',
      {
        src: 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js',
      },
    ],
  ],
  transformHtml: (code, id, { pageData }) => {
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
    lineNumbers: false,
    codeTransformers: [
      // transformerTwoslash({
      //   twoslashOptions: {
      //     compilerOptions: {
      //       paths: {
      //         '@kubb/cli': ['../packages/cli/src/index.ts'],
      //         '@kubb/config-biome': ['../packages/config/config-biome/src/index.ts'],
      //         '@kubb/config-tsup': ['../packages/config/config-tsup/src/index.ts'],
      //         '@kubb/config-ts': ['../packages/config/config-ts/src/index.ts'],
      //         '@kubb/core': ['../packages/core/src/index.ts'],
      //         '@kubb/types': ['../packages/types/src/index.ts'],
      //         '@kubb/core/utils': ['../packages/core/src/utils/index.ts'],
      //         '@kubb/core/logger': ['../packages/core/src/logger.ts'],
      //         '@kubb/core/transformers': ['../packages/core/src/transformers/index.ts'],
      //         '@kubb/fs': ['../packages/fs/src/index.ts'],
      //         '@kubb/fs/types': ['../packages/fs/src/types.ts'],
      //         '@kubb/plugin-oas': ['../packages/plugin-oas/src/index.ts'],
      //         '@kubb/plugin-oas/hooks': ['../packages/plugin-oas/src/hooks/index.ts'],
      //         '@kubb/plugin-client': ['../packages/plugin-client/src/index.ts'],
      //         '@kubb/plugin-client/client': ['../packages/plugin-client/client.ts'],
      //         '@kubb/plugin-client/components': ['../packages/plugin-client/src/components/index.ts'],
      //         '@kubb/plugin-faker': ['../packages/plugin-faker/src/index.ts'],
      //         '@kubb/plugin-msw': ['../packages/plugin-msw/src/index.ts'],
      //         '@kubb/plugin-swr': ['../packages/plugin-swr/src/index.ts'],
      //         '@kubb/plugin-redoc': ['../packages/plugin-redoc/src/index.ts'],
      //         '@kubb/plugin-swr/components': ['../packages/plugin-swr/src/components/index.ts'],
      //         '@kubb/plugin-msw/components': ['../packages/plugin-msw/src/components/index.ts'],
      //         '@kubb/plugin-tanstack-query': ['../packages/plugin-tanstack-query/src/index.ts'],
      //         '@kubb/plugin-tanstack-query/components': ['../packages/plugin-tanstack-query/src/components/index.ts'],
      //         '@kubb/plugin-ts': ['../packages/plugin-ts/src/index.ts'],
      //         '@kubb/plugin-zod': ['../packages/plugin-zod/src/index.ts'],
      //         '@kubb/plugin-zod/components': ['../packages/plugin-zod/src/components/index.ts'],
      //         '@kubb/plugin-zodios': ['../packages/plugin-zodios/src/index.ts'],
      //         '@kubb/parser-ts': ['../packages/parser-ts/src/index.ts'],
      //         '@kubb/oas': ['../packages/oas/src/index.ts'],
      //         '@kubb/react': ['../packages/react/src/index.ts'],
      //         'unplugin-kubb': ['../packages/unplugin-kubb/src/index.ts'],
      //         'unplugin-kubb/vite': ['../packages/unplugin-kubb/src/vite.ts'],
      //       },
      //     },
      //   },
      // }),
    ],
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
      { text: 'Guide', link: '/guide/introduction', activeMatch: 'guide' },
      { text: 'Config', link: '/config/overview', activeMatch: 'config' },
      {
        text: 'Plugins',
        activeMatch: 'plugins',
        items: [...(pluginsMenu as any)],
      },
      {
        text: 'Reference',
        link: '/reference/overview',
        activeMatch: 'reference',
      },
      {
        text: 'Try Out',
        items: [
          {
            text: 'Examples',
            link: '/examples/typescript',
            activeMatch: 'examples',
          },
          { text: 'Playground', link: '/playground' },
        ],
      },
      {
        text: `v${version}`,
        items: [
          {
            text: 'v1',
            link: 'https://v1.kubb.dev',
            target: '_blank',
          },
          {
            text: 'v2',
            link: 'https://v2.kubb.dev',
            target: '_blank',
          },
          {
            text: 'Blog',
            link: '/blog/v3',
          },
          {
            text: 'Releases',
            link: 'https://github.com/kubb-labs/kubb/releases',
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
        text: `<iframe src="https://github.com/sponsors/stijnvanhulle/button" title="Sponsor stijnvanhulle" height="25" width="90" style="border: 0; border-radius: 6px;"></iframe>
      `,
        link: '',
      },
    ],
    editLink: {
      pattern: 'https://github.com/kubb-labs/kubb/edit/main/docs/:path',
    },
    sidebar: {
      '/config': configSidebar,
      '/guide': guideSidebar,
      '/plugins': pluginsSidebar,
      '/reference': referenceSidebar,
      '/examples': examplesSidebar,
      '/blog': blogSidebar,
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/kubb-labs/kubb' },
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
