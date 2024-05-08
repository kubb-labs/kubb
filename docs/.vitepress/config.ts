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
        text: '@kubb/swagger',
        link: '/plugins/swagger/',
        collapsed: true,
        items: [
          {
            text: 'Hooks',
            link: '/plugins/swagger/hooks/',
          },
        ],
      },
      {
        text: '@kubb/swagger-client',
        link: '/plugins/swagger-client/',
        collapsed: true,
        items: [
          // {
          //   text: 'globals.d.ts',
          //   link: '/plugins/swagger-client/globals',
          // },
          // {
          //   text: 'Client',
          //   link: '/plugins/swagger-client/client',
          // },
        ],
      },
      {
        text: '@kubb/swagger-ts',
        link: '/plugins/swagger-ts/',
      },
      {
        text: '@kubb/swagger-zod',
        link: '/plugins/swagger-zod/',
      },
      {
        text: '@kubb/swagger-zodios',
        link: '/plugins/swagger-zodios/',
      },
      {
        text: '@kubb/swagger-tanstack-query',
        link: '/plugins/swagger-tanstack-query/',
      },
      {
        text: '@kubb/swagger-swr',
        link: '/plugins/swagger-swr/',
      },
      {
        text: '@kubb/swagger-faker',
        link: '/plugins/swagger-faker/',
      },
      {
        text: '@kubb/swagger-msw',
        link: '/plugins/swagger-msw/',
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
        text: 'React-Query v5>',
        link: '/examples/tanstack-query/react-query-v5',
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
        text: '@kubb/swagger',
        link: '/plugins/swagger/',
      },
      {
        text: '@kubb/swagger-client',
        link: '/plugins/swagger-client/',
      },
      {
        text: '@kubb/swagger-ts',
        link: '/plugins/swagger-ts/',
      },
      {
        text: '@kubb/swagger-zod',
        link: '/plugins/swagger-zod/',
      },
      {
        text: '@kubb/swagger-zodios',
        link: '/plugins/swagger-zodios/',
      },
      {
        text: '@kubb/swagger-tanstack-query',
        link: '/plugins/swagger-tanstack-query/',
      },
      {
        text: '@kubb/swagger-swr',
        link: '/plugins/swagger-swr/',
      },
      {
        text: '@kubb/swagger-faker',
        link: '/plugins/swagger-faker/',
      },
      {
        text: '@kubb/swagger-msw',
        link: '/plugins/swagger-msw/',
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
      transformerTwoslash({
        twoslashOptions: {
          compilerOptions: {
            paths: {
              '@kubb/cli': ['../packages/cli/src/index.ts'],
              '@kubb/config-biome': ['../packages/config/config-biome/src/index.ts'],
              '@kubb/config-tsup': ['../packages/config/config-tsup/src/index.ts'],
              '@kubb/config-ts': ['../packages/config/config-ts/src/index.ts'],
              '@kubb/core': ['../packages/core/src/index.ts'],
              '@kubb/types': ['../packages/types/src/index.ts'],
              '@kubb/core/utils': ['../packages/core/src/utils/index.ts'],
              '@kubb/core/logger': ['../packages/core/src/logger.ts'],
              '@kubb/core/transformers': ['../packages/core/src/transformers/index.ts'],
              '@kubb/core/fs': ['../packages/core/src/fs/index.ts'],
              '@kubb/swagger': ['../packages/swagger/src/index.ts'],
              '@kubb/swagger/hooks': ['../packages/swagger/src/hooks/index.ts'],
              '@kubb/swagger-client': ['../packages/swagger-client/src/index.ts'],
              '@kubb/swagger-client/client': ['../packages/swagger-client/client.ts'],
              '@kubb/swagger-client/components': ['../packages/swagger-client/src/components/index.ts'],
              '@kubb/swagger-client/ts-client': ['../packages/swagger-client/client.ts'],
              '@kubb/swagger-faker': ['../packages/swagger-faker/src/index.ts'],
              '@kubb/swagger-msw': ['../packages/swagger-msw/src/index.ts'],
              '@kubb/swagger-msw/components': ['../packages/swagger-msw/src/components/index.ts'],
              '@kubb/swagger-tanstack-query': ['../packages/swagger-tanstack-query/src/index.ts'],
              '@kubb/swagger-ts': ['../packages/swagger-ts/src/index.ts'],
              '@kubb/swagger-zod': ['../packages/swagger-zod/src/index.ts'],
              '@kubb/swagger-zodios': ['../packages/swagger-zodios/src/index.ts'],
              '@kubb/parser-ts': ['../packages/parser-ts/src/index.ts'],
              '@kubb/oas': ['../packages/oas/src/index.ts'],
              '@kubb/react': ['../packages/react/src/index.ts'],
              'unplugin-kubb': ['../packages/unplugin-kubb/src/index.ts'],
              'unplugin-kubb/vite': ['../packages/unplugin-kubb/src/vite.ts'],
            },
          },
        },
      }),
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
            text: 'Blog',
            link: '/blog/v2',
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
