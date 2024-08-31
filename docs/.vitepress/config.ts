import { createWriteStream } from 'node:fs'
import { resolve } from 'node:path'

import { transformerTwoslash } from '@shikijs/vitepress-twoslash'
import { SitemapStream } from 'sitemap'
import { defineConfig } from 'vitepress'

import { version } from '../../packages/core/package.json'

const ogImage = 'https://kubb.dev/og.png'
const title = 'Generate SDKs for all your APIs'
const description = 'OpenAPI to TypeScript, React-Query, Zod, Faker.js, MSW and Axios. '

const links: Array<{ url: string; lastmod: number | undefined }> = []

const gettingStartedSidebar = [
  {
    text: 'Getting Started',
    items: [
      {
        text: 'Introduction',
        link: '/getting-started/introduction',
      },
      {
        text: 'Installation',
        link: '/getting-started/installation',
      },
      {
        text: 'Configure',
        link: '/getting-started/configure',
      },
      {
        text: 'CLI',
        link: '/getting-started/cli',
      },
      {
        text: 'Quick start',
        link: '/getting-started/quick-start',
      },
    ],
  },
]

const knowledgeBaseSidebar = [
  {
    text: 'Overview',
    link: '/knowledge-base/overview',
  },
  {
    text: 'How tos',
    link: '/knowledge-base/how-tos',
    items: [
      {
        text: 'Debugging Kubb',
        link: '/knowledge-base/how-tos/debugging',
      },
    ],
  },
  {
    text: 'Plugins',
    collapsed: false,
    items: [
      {
        text: 'Plugin system',
        link: '/knowledge-base/plugins/system',
      },
      {
        text: 'Plugin core',
        link: '/knowledge-base/plugins/core',
      },
    ],
  },
  {
    text: 'FileManager',
    link: '/knowledge-base/fileManager',
  },
  {
    text: 'PluginManager',
    link: '/knowledge-base/pluginManager/',
    collapsed: false,
    items: [
      {
        text: 'Lifecycle',
        link: '/knowledge-base/pluginManager/lifecycle',
      },
    ],
  },
  {
    text: 'Templates <img src="/icons/experimental.svg"/>',
    link: '/knowledge-base/templates',
  },
]

const documentationSidebar = [
  {
    text: 'Config',
    collapsed: true,
    link: '/documentation/config',
  },
  {
    text: 'Parsers',
    collapsed: false,
    items: [
      {
        text: '@kubb/parser-ts',
        link: '/documentation/plugins/parser-ts/',
      },
    ],
  },
  {
    text: 'Helpers',
    collapsed: false,
    items: [
      {
        text: '@kubb/cli',
        link: '/documentation/plugins/cli/',
      },
      {
        text: '@kubb/oas',
        link: '/documentation/plugins/oas/',
        collapsed: true,
        items: [
          {
            text: 'Infer <img src="/icons/experimental.svg"/> <span class="new">new</span>',
            link: '/documentation/plugins/oas/infer',
          },
        ],
      },
      {
        text: '@kubb/react',
        link: '/documentation/plugins/react/',
        collapsed: true,
        items: [
          {
            text: 'Components',
            link: '/documentation/plugins/react/components/',
            items: [
              {
                text: 'Text',
                link: '/documentation/plugins/react/components/text',
              },
              {
                text: 'Function',
                link: '/documentation/plugins/react/components/function',
              },
              {
                text: 'Parser',
                link: '/documentation/plugins/react/components/parser',
              },
              {
                text: 'Type',
                link: '/documentation/plugins/react/components/type',
              },
              {
                text: 'File',
                link: '/documentation/plugins/react/components/file',
              },
            ],
          },
          {
            text: 'Hooks',
            link: '/documentation/plugins/react/hooks/',
            items: [],
          },
        ],
      },
    ],
  },
  {
    text: 'Plugins',
    collapsed: false,
    link: '/documentation/plugins',
    items: [
      {
        text: '@kubb/core',
        collapsed: true,
        link: '/documentation/plugins/core/',
      },
      {
        text: '@kubb/plugin-oas',
        link: '/documentation/plugins/plugin-oas/',
        collapsed: true,
        items: [
          {
            text: 'Hooks',
            link: '/documentation/plugins/plugin-oas/hooks/',
          },
        ],
      },
      {
        text: '@kubb/plugin-client',
        link: '/documentation/plugins/plugin-client/',
        collapsed: true,
      },
      {
        text: '@kubb/plugin-ts',
        link: '/documentation/plugins/plugin-ts/',
      },
      {
        text: '@kubb/plugin-zod',
        link: '/documentation/plugins/plugin-zod/',
      },
      {
        text: '@kubb/plugin-tanstack-query',
        link: '/documentation/plugins/plugin-tanstack-query/',
      },
      {
        text: '@kubb/plugin-swr',
        link: '/documentation/plugins/plugin-swr/',
      },
      {
        text: '@kubb/plugin-faker',
        link: '/documentation/plugins/plugin-faker/',
      },
      {
        text: '@kubb/plugin-msw',
        link: '/documentation/plugins/plugin-msw/',
      },
      {
        text: '@kubb/plugin-redoc',
        link: '/documentation/plugins/plugin-redoc/',
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
        link: '/documentation/plugins/unplugin/',
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

const tutorialsSidebar = [
  {
    text: 'Basic',
    link: '/tutorials/basic',
  },
  {
    text: 'Templates',
    link: '/tutorials/templates',
  },
]

const documentationMenu = [
  {
    text: 'Config',
    link: '/documentation/config',
  },
  {
    text: 'Parsers',
    items: [
      {
        text: '@kubb/parser-ts',
        link: '/documentation/plugins/parser-ts/',
      },
    ],
  },
  {
    text: 'Helpers',
    items: [
      {
        text: '@kubb/cli',
        link: '/documentation/plugins/cli/',
      },
      {
        text: '@kubb/oas',
        link: '/documentation/plugins/oas/',
      },
      {
        text: '@kubb/react',
        link: '/documentation/plugins/react/',
      },
    ],
  },
  {
    text: 'Plugins',
    items: [
      {
        text: '@kubb/core',
        link: '/documentation/plugins/core/',
      },
      {
        text: '@kubb/plugin-oas',
        link: '/documentation/plugins/plugin-oas/',
      },
      {
        text: '@kubb/plugin-client',
        link: '/documentation/plugins/plugin-client/',
      },
      {
        text: '@kubb/plugin-ts',
        link: '/documentation/plugins/plugin-ts/',
      },
      {
        text: '@kubb/plugin-zod',
        link: '/documentation/plugins/plugin-zod/',
      },
      {
        text: '@kubb/plugin-tanstack-query',
        link: '/documentation/plugins/plugin-tanstack-query/',
      },
      {
        text: '@kubb/plugin-swr',
        link: '/documentation/plugins/plugin-swr/',
      },
      {
        text: '@kubb/plugin-faker',
        link: '/documentation/plugins/plugin-faker/',
      },
      {
        text: '@kubb/plugin-msw',
        link: '/documentation/plugins/plugin-msw/',
      },
      {
        text: '@kubb/plugin-redoc',
        link: '/documentation/plugins/plugin-redoc/',
      },
    ],
  },
  {
    text: 'Build tools',
    items: [
      {
        text: 'unplugin-kubb',
        link: '/documentation/plugins/unplugin/',
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
    // https://vitepress.dev/knowledge-base/default-theme-config
    logo: {
      src: '/logo.png',
    },
    search: {
      provider: 'local',
    },
    nav: [
      { text: 'Getting started', link: '/getting-started/introduction', activeMatch: 'getting-started' },
      {
        text: 'Documentation',
        activeMatch: 'documentation',
        items: [...(documentationMenu as any)],
      },
      {
        text: 'Knowledge base',
        link: '/knowledge-base/overview',
        activeMatch: 'knowledge-base',
      },
      {
        text: 'Try Out',
        items: [
          {
            text: 'Examples',
            link: '/examples/typescript',
            activeMatch: 'examples',
          },
          {
            text: 'Tutorials',
            items: [
              {
                text: 'Basic',
                link: '/tutorials/basic',
              },
              {
                text: 'Templates',
                link: '/tutorials/templates',
              },
            ],
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
      '/getting-started': gettingStartedSidebar,
      '/documentation': documentationSidebar,
      '/knowledge-base': knowledgeBaseSidebar,
      '/examples': examplesSidebar,
      '/blog': blogSidebar,
      '/tutorials': tutorialsSidebar,
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
