import { transformerTwoslash } from '@shikijs/vitepress-twoslash'
import { defineConfig } from 'vitepress'
import { groupIconMdPlugin, groupIconVitePlugin, localIconLoader } from 'vitepress-plugin-group-icons'
import { version } from '../../packages/core/package.json'
import { renderMermaidGraphsPlugin } from './mermaid'
import { transposeTables } from './transposeTables'

const ogImage = 'https://kubb.dev/og.png'
const title = 'Generate SDKs for all your APIs'
const description = 'OpenAPI to TypeScript, React-Query, Zod, Faker.js, MSW, MCP and Axios. '

const links: Array<{ url: string; lastmod: number | undefined }> = []

const knowledgeBaseSidebar = [
  {
    text: 'Basic',
    items: [
      {
        text: 'Custom HTTP client',
        link: '/knowledge-base/fetch/',
      },
      {
        text: 'Use of your own baseUrl',
        link: '/knowledge-base/base-url/',
      },
      {
        text: 'Filter and sort',
        link: '/knowledge-base/filter-and-sort/',
      },
    ],
  },
  {
    text: 'Intermediate',
    items: [
      {
        text: 'Debugging Kubb',
        link: '/knowledge-base/debugging/',
      },
      {
        text: 'Setup Claude with Kubb',
        link: '/knowledge-base/claude/',
      },
    ],
  },
  {
    text: 'Advanced',
    items: [
      {
        text: 'Use JSX in Kubb',
        link: '/knowledge-base/react/',
      },
      {
        text: 'Generators',
        link: '/knowledge-base/generators/',
      },
      {
        text: 'Kubb Plugins',
        link: '/knowledge-base/plugins/',
      },
    ],
  },

  // {
  //   text: 'Plugins',
  //   collapsed: false,
  //   link: '/knowledge-base/plugins/',
  //   items: [
  //     {
  //       text: 'Plugin system',
  //       link: '/knowledge-base/plugins/system',
  //     },
  //     {
  //       text: 'Plugin core',
  //       link: '/knowledge-base/plugins/core',
  //     },
  //   ],
  // },
  // {
  //   text: 'FileManager',
  //   link: '/knowledge-base/fileManager',
  // },
  // {
  //   text: 'PluginManager',
  //   link: '/knowledge-base/pluginManager/',
  //   collapsed: false,
  //   items: [
  //     {
  //       text: 'Lifecycle',
  //       link: '/knowledge-base/pluginManager/lifecycle',
  //     },
  //   ],
  // },
]

const mainSidebar = [
  {
    text: 'Getting started',
    collapsed: false,
    items: [
      {
        text: 'At Glance',
        link: '/getting-started/at-glance/',
      },
      {
        text: 'Quick Start',
        link: '/getting-started/quick-start/',
      },
      {
        text: 'Configure',
        link: '/getting-started/configure/',
      },
    ],
  },
  {
    text: 'Parsers',
    collapsed: false,
    items: [
      {
        text: '@kubb/parser-ts',
        link: '/parsers/parser-ts/',
      },
    ],
  },
  {
    text: 'Helpers',
    collapsed: false,
    items: [
      {
        text: '@kubb/cli',
        link: '/helpers/cli/',
      },
      {
        text: '@kubb/oas',
        link: '/helpers/oas/',
      },
      {
        text: '@kubb/react',
        link: '/helpers/react/',
        collapsed: true,
        items: [
          {
            text: 'Components',
            link: '/helpers/react/components/',
            items: [
              {
                text: 'Text',
                link: '/helpers/react/components/text/',
              },
              {
                text: 'Function',
                link: '/helpers/react/components/function/',
              },
              {
                text: 'Type',
                link: '/helpers/react/components/type/',
              },
              {
                text: 'Const',
                link: '/helpers/react/components/const/',
              },
              {
                text: 'File',
                link: '/helpers/react/components/file/',
              },
            ],
          },
          {
            text: 'Hooks',
            link: '/helpers/react/hooks/',
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
        text: '@kubb/plugin-cypress <span class="new">new in 3.7.0</span>',
        link: '/plugins/plugin-cypress/',
      },
      {
        text: '@kubb/plugin-mcp <span class="new">new in 3.9.0</span>',
        link: '/plugins/plugin-mcp/',
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
        text: '@kubb/plugin-react-query',
        link: '/plugins/plugin-react-query/',
      },
      {
        text: '@kubb/plugin-vue-query',
        link: '/plugins/plugin-vue-query/',
      },
      {
        text: '@kubb/plugin-solid-query',
        link: '/plugins/plugin-solid-query/',
      },
      {
        text: '@kubb/plugin-svelte-query',
        link: '/plugins/plugin-svelte-query/',
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
        text: 'unplugin-kubb',
        collapsed: false,
        link: '/builders/unplugin/',
      },
    ],
  },
  {
    text: 'Migration guide',
    link: '/migration-guide/',
  },
  {
    text: 'Changelog',
    link: '/changelog/',
  },
]

const examplesSidebar = [
  {
    text: 'TypeScript',
    link: '/examples/typescript/',
  },
  {
    text: 'Tanstack-Query',
    items: [
      {
        text: 'React-Query',
        link: '/examples/tanstack-query/react-query/',
      },
      {
        text: 'Vue-Query',
        link: '/examples/tanstack-query/vue-query/',
      },
      {
        text: 'Svelte-Query',
        link: '/examples/tanstack-query/svelte-query/',
      },
      {
        text: 'Solid-Query',
        link: '/examples/tanstack-query/solid-query/',
      },
    ],
  },
  {
    text: 'SWR-Query',
    link: '/examples/swr/',
  },
  {
    text: 'Zod',
    link: '/examples/zod/',
  },
  {
    text: 'Faker',
    link: '/examples/faker/',
  },
  {
    text: 'MSW',
    link: '/examples/msw/',
  },
  {
    text: 'Simple',
    link: '/examples/simple/',
  },
  {
    text: 'Client',
    link: '/examples/client/',
  },
  {
    text: 'Fetch',
    link: '/examples/fetch/',
  },
  {
    text: 'Cypress <span class="new">new in 3.7.0</span>',
    link: '/examples/cypress/',
  },
  {
    text: 'MCP <span class="new">new in 3.9.0</span>',
    link: '/examples/mcp/',
  },
  {
    text: 'Advanced',
    link: '/examples/advanced/',
  },
  {
    text: 'Generators <span class="new">new</span>',
    link: '/examples/generators/',
  },
  {
    text: 'React <span class="new">new</span>',
    link: '/examples/react/',
  },
]

const blogSidebar = [
  {
    text: 'Release of Kubb 3.0',
    link: '/blog/v3/',
  },
]

const tutorialsSidebar = [
  {
    text: 'Basic',
    link: '/tutorials/basic/',
  },
]

const documentationMenu = [
  {
    text: 'Getting Started',
    link: '/getting-started/at-glance/',
  },
  {
    text: 'Parsers',
    items: [
      {
        text: '@kubb/parser-ts',
        link: '/parsers/parser-ts/',
        activeMatch: 'parser-ts',
      },
    ],
  },
  {
    text: 'Helpers',
    items: [
      {
        text: '@kubb/cli',
        link: '/helpers/cli/',
      },
      {
        text: '@kubb/oas',
        link: '/helpers/oas/',
      },
      {
        text: '@kubb/react',
        link: '/helpers/react/',
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
        text: '@kubb/plugin-cypress',
        link: '/plugins/plugin-cypress/',
      },
      {
        text: '@kubb/plugin-mcp',
        link: '/plugins/plugin-mcp/',
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
        text: '@kubb/plugin-react-query',
        link: '/plugins/plugin-react-query/',
      },
      {
        text: '@kubb/plugin-vue-query',
        link: '/plugins/plugin-vue-query/',
      },
      {
        text: '@kubb/plugin-solid-query',
        link: '/plugins/plugin-solid-query/',
      },
      {
        text: '@kubb/plugin-svelte-query',
        link: '/plugins/plugin-svelte-query/',
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
        link: '/builders/unplugin/',
      },
    ],
  },
]

// https://vitepress.dev/knowledge-base/site-config
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
  // transformHtml: (code, id, { pageData }) => {
  //   if (!/[\\/]404\.html$/.test(id)) {
  //     links.push({
  //       // you might need to change this if not using clean urls mode
  //       url: pageData.relativePath.replace(/((^|\/)index)?\.md$/, '$2'),
  //       lastmod: pageData.lastUpdated,
  //     })
  //   }
  // },
  sitemap: {
    hostname: 'https://kubb.dev/',
  },
  cleanUrls: true,
  outDir: 'dist',
  ignoreDeadLinks: true,
  lastUpdated: true,
  markdown: {
    theme: {
      light: 'github-light',
      dark: 'nord',
    },
    config(md) {
      transposeTables(md)
      md.use(groupIconMdPlugin)
    },
    lineNumbers: false,
    codeTransformers: [
      transformerTwoslash({
        twoslashOptions: {
          compilerOptions: {
            paths: {
              '@kubb/cli': ['../packages/cli/src/index.ts'],
              '@kubb/config-tsup': ['../packages/config/config-tsup/src/index.ts'],
              '@kubb/config-ts': ['../packages/config/config-ts/src/index.ts'],
              '@kubb/core': ['../packages/core/src/index.ts'],
              '@kubb/types': ['../packages/types/src/index.ts'],
              '@kubb/core/utils': ['../packages/core/src/utils/index.ts'],
              '@kubb/core/logger': ['../packages/core/src/logger.ts'],
              '@kubb/core/transformers': ['../packages/core/src/transformers/index.ts'],
              '@kubb/core/fs': ['../packages/core/src/fs/index.ts'],
              '@kubb/plugin-cypress': ['../packages/plugin-cypress/src/index.ts'],
              '@kubb/plugin-mcp': ['../packages/plugin-mcp/src/index.ts'],
              '@kubb/plugin-oas': ['../packages/plugin-oas/src/index.ts'],
              '@kubb/plugin-oas/hooks': ['../packages/plugin-oas/src/hooks/index.ts'],
              '@kubb/plugin-client': ['../packages/plugin-client/src/index.ts'],
              '@kubb/plugin-client/client': ['../packages/plugin-client/client.ts'],
              '@kubb/plugin-client/components': ['../packages/plugin-client/src/components/index.ts'],
              '@kubb/plugin-faker': ['../packages/plugin-faker/src/index.ts'],
              '@kubb/plugin-msw': ['../packages/plugin-msw/src/index.ts'],
              '@kubb/plugin-swr': ['../packages/plugin-swr/src/index.ts'],
              '@kubb/plugin-redoc': ['../packages/plugin-redoc/src/index.ts'],
              '@kubb/plugin-swr/components': ['../packages/plugin-swr/src/components/index.ts'],
              '@kubb/plugin-msw/components': ['../packages/plugin-msw/src/components/index.ts'],
              '@kubb/plugin-react-query': ['../packages/plugin-react-query/src/index.ts'],
              '@kubb/plugin-react-query/components': ['../packages/plugin-react-query/src/components/index.ts'],
              '@kubb/plugin-vue-query': ['../packages/plugin-vue-query/src/index.ts'],
              '@kubb/plugin-vue-query/components': ['../packages/plugin-vue-query/src/components/index.ts'],
              '@kubb/plugin-svelte-query': ['../packages/plugin-svelte-query/src/index.ts'],
              '@kubb/plugin-svelte-query/components': ['../packages/plugin-svelte-query/src/components/index.ts'],
              '@kubb/plugin-solid-query': ['../packages/plugin-solid-query/src/index.ts'],
              '@kubb/plugin-solid-query/components': ['../packages/plugin-solid-query/src/components/index.ts'],
              '@kubb/plugin-ts': ['../packages/plugin-ts/src/index.ts'],
              '@kubb/plugin-zod': ['../packages/plugin-zod/src/index.ts'],
              '@kubb/plugin-zod/components': ['../packages/plugin-zod/src/components/index.ts'],
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
    // https://vitepress.dev/knowledge-base/default-theme-config
    logo: {
      src: '/logo.png',
    },
    search: {
      provider: 'local',
    },
    nav: [
      {
        text: 'Docs',
        items: [...(documentationMenu as any)],
      },
      {
        text: 'Knowledge base',
        link: '/knowledge-base/fetch/',
        activeMatch: 'knowledge-base',
      },
      {
        text: 'Try Out',
        items: [
          {
            text: 'Examples',
            link: '/examples/typescript/',
            activeMatch: 'examples',
          },
          {
            text: 'Tutorials',
            items: [
              {
                text: 'Basic',
                link: '/tutorials/basic/',
              },
            ],
          },
          { text: 'Playground', link: '/playground/' },
        ],
      },
      {
        text: `v${version}`,
        items: [
          {
            text: 'Changelog',
            link: '/changelog/',
          },
          {
            text: 'Migration guide',
            link: '/migration-guide/',
          },
          {
            text: 'Releases',
            link: 'https://github.com/kubb-labs/kubb/releases',
            target: '_blank',
          },
          {
            text: 'Versions',
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
            ],
          },
          {
            text: 'More',
            items: [
              {
                text: 'Sponsors',
                link: '/sponsors/',
              },
              {
                text: 'Contributers',
                link: '/contributers/',
              },
              {
                text: 'Blog',
                link: '/blog/v3/',
              },
              {
                text: 'About Kubb',
                link: '/about/',
              },
            ],
          },
        ],
      },
      {
        text: `<a
      class="fancy-sponsor"
      href="https://github.com/sponsors/stijnvanhulle"
      target="_blank"
      rel="noreferrer"
    >
      Sponsor us
    </a>`,
        link: '',
      },
    ],
    editLink: {
      pattern: 'https://github.com/kubb-labs/kubb/edit/main/docs/:path',
    },
    sidebar: {
      '/getting-started': mainSidebar,
      '/plugins': mainSidebar,
      '/parsers': mainSidebar,
      '/helpers': mainSidebar,
      '/build': mainSidebar,
      '/changelog': mainSidebar,
      '/knowledge-base': knowledgeBaseSidebar,
      '/examples': examplesSidebar,
      '/blog': blogSidebar,
      '/tutorials': tutorialsSidebar,
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/kubb-labs/kubb' },
      { icon: 'discord', link: 'https://discord.gg/shfBFeczrm' },
      // { icon: 'x', link: 'https://twitter.com/kubbproject' },
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
  vite: {
    plugins: [
      renderMermaidGraphsPlugin(),
      groupIconVitePlugin({
        customIcon: {
          'kubb.config.ts': localIconLoader(import.meta.url, '../public/logo.svg'),
          'kubb.config.js': localIconLoader(import.meta.url, '../public/logo.svg'),
        },
      }),
    ],
  },
})
