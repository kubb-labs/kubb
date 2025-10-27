import { buildEndGenerateOpenGraphImages } from '@nolebase/vitepress-plugin-og-image/vitepress'

import { transformerTwoslash } from '@shikijs/vitepress-twoslash'
import { defineConfig } from 'vitepress'
import { groupIconMdPlugin, groupIconVitePlugin, localIconLoader } from 'vitepress-plugin-group-icons'
import llmstxt, { copyOrDownloadAsMarkdownButtons } from 'vitepress-plugin-llms'
import { version } from '../../packages/core/package.json'
import { renderMermaidGraphsPlugin } from './mermaid'
import { transposeTables } from './transposeTables'

const ogImage = 'https://kubb.dev/og.png'
const title = 'Generate SDKs for all your APIs'
const description = 'OpenAPI to TypeScript, React-Query, Zod, Faker.js, MSW, MCP and Axios. '

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

const knowledgeBaseSidebarRu = [
  {
    text: 'Базовый',
    items: [
      {
        text: 'Пользовательский HTTP-клиент',
        link: '/ru/knowledge-base/fetch/',
      },
      {
        text: 'Использование собственного baseUrl',
        link: '/ru/knowledge-base/base-url/',
      },
      {
        text: 'Фильтрация и сортировка',
        link: '/ru/knowledge-base/filter-and-sort/',
      },
    ],
  },
  {
    text: 'Средний',
    items: [
      {
        text: 'Отладка Kubb',
        link: '/ru/knowledge-base/debugging/',
      },
      {
        text: 'Настройка Claude с Kubb',
        link: '/ru/knowledge-base/claude/',
      },
    ],
  },
  {
    text: 'Продвинутый',
    items: [
      {
        text: 'Использование JSX в Kubb',
        link: '/ru/knowledge-base/react/',
      },
      {
        text: 'Генераторы',
        link: '/ru/knowledge-base/generators/',
      },
      {
        text: 'Плагины Kubb',
        link: '/ru/knowledge-base/plugins/',
      },
    ],
  },
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
        text: 'Ecosystem',
        link: '/getting-started/ecosystem/',
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

const mainSidebarRu = [
  {
    text: 'Начало работы',
    collapsed: false,
    items: [
      {
        text: 'Краткий обзор',
        link: '/ru/getting-started/at-glance/',
      },
      {
        text: 'Экосистема',
        link: '/ru/getting-started/ecosystem/',
      },
      {
        text: 'Быстрый старт',
        link: '/ru/getting-started/quick-start/',
      },
      {
        text: 'Конфигурация',
        link: '/ru/getting-started/configure/',
      },
    ],
  },
  {
    text: 'Помощники',
    collapsed: false,
    items: [
      {
        text: '@kubb/cli',
        link: '/ru/helpers/cli/',
      },
      {
        text: '@kubb/oas',
        link: '/ru/helpers/oas/',
      },
      {
        text: '@kubb/react',
        link: '/ru/helpers/react/',
        collapsed: true,
        items: [
          {
            text: 'Компоненты',
            link: '/ru/helpers/react/components/',
            items: [
              {
                text: 'Text',
                link: '/ru/helpers/react/components/text/',
              },
              {
                text: 'Function',
                link: '/ru/helpers/react/components/function/',
              },
              {
                text: 'Type',
                link: '/ru/helpers/react/components/type/',
              },
              {
                text: 'Const',
                link: '/ru/helpers/react/components/const/',
              },
              {
                text: 'File',
                link: '/ru/helpers/react/components/file/',
              },
            ],
          },
          {
            text: 'Хуки',
            link: '/ru/helpers/react/hooks/',
            items: [],
          },
        ],
      },
    ],
  },
  {
    text: 'Плагины',
    collapsed: false,
    items: [
      {
        text: '@kubb/core',
        collapsed: true,
        link: '/ru/plugins/core/',
      },
      {
        text: '@kubb/plugin-oas',
        link: '/ru/plugins/plugin-oas/',
        collapsed: true,
        items: [
          {
            text: 'Хуки',
            link: '/ru/plugins/plugin-oas/hooks/',
          },
        ],
      },
      {
        text: '@kubb/plugin-cypress <span class="new">новое в 3.7.0</span>',
        link: '/ru/plugins/plugin-cypress/',
      },
      {
        text: '@kubb/plugin-mcp <span class="new">новое в 3.9.0</span>',
        link: '/ru/plugins/plugin-mcp/',
      },
      {
        text: '@kubb/plugin-client',
        link: '/ru/plugins/plugin-client/',
        collapsed: true,
      },
      {
        text: '@kubb/plugin-ts',
        link: '/ru/plugins/plugin-ts/',
      },
      {
        text: '@kubb/plugin-zod',
        link: '/ru/plugins/plugin-zod/',
      },
      {
        text: '@kubb/plugin-react-query',
        link: '/ru/plugins/plugin-react-query/',
      },
      {
        text: '@kubb/plugin-vue-query',
        link: '/ru/plugins/plugin-vue-query/',
      },
      {
        text: '@kubb/plugin-solid-query',
        link: '/ru/plugins/plugin-solid-query/',
      },
      {
        text: '@kubb/plugin-svelte-query',
        link: '/ru/plugins/plugin-svelte-query/',
      },
      {
        text: '@kubb/plugin-swr',
        link: '/ru/plugins/plugin-swr/',
      },
      {
        text: '@kubb/plugin-faker',
        link: '/ru/plugins/plugin-faker/',
      },
      {
        text: '@kubb/plugin-msw',
        link: '/ru/plugins/plugin-msw/',
      },
      {
        text: '@kubb/plugin-redoc',
        link: '/ru/plugins/plugin-redoc/',
      },
    ],
  },
  {
    text: 'Инструменты сборки',
    collapsed: false,
    items: [
      {
        text: 'unplugin-kubb',
        collapsed: false,
        link: '/ru/builders/unplugin/',
      },
    ],
  },
  {
    text: 'Руководство по миграции',
    link: '/ru/migration-guide/',
  },
  {
    text: 'История изменений',
    link: '/ru/changelog/',
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
]

const examplesSidebarRu = [
  {
    text: 'TypeScript',
    link: '/ru/examples/typescript/',
  },
  {
    text: 'Tanstack-Query',
    items: [
      {
        text: 'React-Query',
        link: '/ru/examples/tanstack-query/react-query/',
      },
      {
        text: 'Vue-Query',
        link: '/ru/examples/tanstack-query/vue-query/',
      },
      {
        text: 'Svelte-Query',
        link: '/ru/examples/tanstack-query/svelte-query/',
      },
      {
        text: 'Solid-Query',
        link: '/ru/examples/tanstack-query/solid-query/',
      },
    ],
  },
  {
    text: 'SWR-Query',
    link: '/ru/examples/swr/',
  },
  {
    text: 'Zod',
    link: '/ru/examples/zod/',
  },
  {
    text: 'Faker',
    link: '/ru/examples/faker/',
  },
  {
    text: 'MSW',
    link: '/ru/examples/msw/',
  },
  {
    text: 'Простой',
    link: '/ru/examples/simple/',
  },
  {
    text: 'Client',
    link: '/ru/examples/client/',
  },
  {
    text: 'Fetch',
    link: '/ru/examples/fetch/',
  },
  {
    text: 'Cypress <span class="new">новое в 3.7.0</span>',
    link: '/ru/examples/cypress/',
  },
  {
    text: 'MCP <span class="new">новое в 3.9.0</span>',
    link: '/ru/examples/mcp/',
  },
  {
    text: 'Продвинутый',
    link: '/ru/examples/advanced/',
  },
  {
    text: 'Генераторы <span class="new">новое</span>',
    link: '/ru/examples/generators/',
  },
  {
    text: 'React <span class="new">новое</span>',
    link: '/ru/examples/react/',
  },
]

const blogSidebar = [
  {
    text: 'Introducing Fabric',
    link: '/blog/fabric/',
  },
  {
    text: 'Release of Kubb 4.0',
    link: '/blog/v4/',
  },
  {
    text: 'Release of Kubb 3.0',
    link: '/blog/v3/',
  },
]

const blogSidebarRu = [
  {
    text: 'Релиз Kubb 3.0',
    link: '/ru/blog/v3/',
  },
  {
    text: 'Релиз Kubb 4.0',
    link: '/ru/blog/v4/',
  },
]

const tutorialsSidebar = [
  {
    text: 'Basic',
    link: '/tutorials/basic/',
  },
]

const tutorialsSidebarRu = [
  {
    text: 'Базовый',
    link: '/ru/tutorials/basic/',
  },
]

const documentationMenu = [
  {
    text: 'Getting Started',
    link: '/getting-started/at-glance/',
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

const documentationMenuRu = [
  {
    text: 'Начало работы',
    link: '/ru/getting-started/at-glance/',
  },
  {
    text: 'Помощники',
    items: [
      {
        text: '@kubb/cli',
        link: '/ru/helpers/cli/',
      },
      {
        text: '@kubb/oas',
        link: '/ru/helpers/oas/',
      },
      {
        text: '@kubb/react',
        link: '/ru/helpers/react/',
      },
    ],
  },
  {
    text: 'Плагины',
    items: [
      {
        text: '@kubb/core',
        link: '/ru/plugins/core/',
      },
      {
        text: '@kubb/plugin-oas',
        link: '/ru/plugins/plugin-oas/',
      },
      {
        text: '@kubb/plugin-cypress',
        link: '/ru/plugins/plugin-cypress/',
      },
      {
        text: '@kubb/plugin-mcp',
        link: '/ru/plugins/plugin-mcp/',
      },
      {
        text: '@kubb/plugin-client',
        link: '/ru/plugins/plugin-client/',
      },
      {
        text: '@kubb/plugin-ts',
        link: '/ru/plugins/plugin-ts/',
      },
      {
        text: '@kubb/plugin-zod',
        link: '/ru/plugins/plugin-zod/',
      },
      {
        text: '@kubb/plugin-react-query',
        link: '/ru/plugins/plugin-react-query/',
      },
      {
        text: '@kubb/plugin-vue-query',
        link: '/ru/plugins/plugin-vue-query/',
      },
      {
        text: '@kubb/plugin-solid-query',
        link: '/ru/plugins/plugin-solid-query/',
      },
      {
        text: '@kubb/plugin-svelte-query',
        link: '/ru/plugins/plugin-svelte-query/',
      },
      {
        text: '@kubb/plugin-swr',
        link: '/ru/plugins/plugin-swr/',
      },
      {
        text: '@kubb/plugin-faker',
        link: '/ru/plugins/plugin-faker/',
      },
      {
        text: '@kubb/plugin-msw',
        link: '/ru/plugins/plugin-msw/',
      },
      {
        text: '@kubb/plugin-redoc',
        link: '/ru/plugins/plugin-redoc/',
      },
    ],
  },
  {
    text: 'Инструменты сборки',
    items: [
      {
        text: 'unplugin-kubb',
        link: '/ru/builders/unplugin/',
      },
    ],
  },
]

// https://vitepress.dev/knowledge-base/site-config
export default defineConfig({
  title: 'Kubb',
  description: title,
  locales: {
    root: {
      label: 'English',
      lang: 'en-UK',
    },
    ru: {
      label: 'Русский',
      lang: 'ru-RU',
      title: 'Kubb',
      description: 'Генерация SDK для всех ваших API',
      themeConfig: {
        nav: [
          {
            text: 'Документация',
            items: [...(documentationMenuRu as any)],
          },
          {
            text: 'База знаний',
            link: '/ru/knowledge-base/fetch/',
            activeMatch: 'knowledge-base',
          },
          {
            text: 'Попробовать',
            items: [
              {
                text: 'Примеры',
                link: '/ru/examples/typescript/',
                activeMatch: 'examples',
              },
              {
                text: 'Уроки',
                items: [
                  {
                    text: 'Базовый',
                    link: '/ru/tutorials/basic/',
                  },
                ],
              },
              { text: 'Песочница', link: '/ru/playground/' },
            ],
          },
          {
            text: `v${version}`,
            items: [
              {
                text: 'История изменений',
                link: '/ru/changelog/',
              },
              {
                text: 'Руководство по миграции',
                link: '/ru/migration-guide/',
              },
              {
                text: 'Релизы',
                link: 'https://github.com/kubb-labs/kubb/releases',
                target: '_blank',
              },
              {
                text: 'Версии',
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
                text: 'Ещё',
                items: [
                  {
                    text: 'Спонсоры',
                    link: '/ru/sponsors/',
                  },
                  {
                    text: 'Участники',
                    link: '/ru/contributers/',
                  },
                  {
                    text: 'Блог',
                    link: '/ru/blog/v3/',
                  },
                  {
                    text: 'О Kubb',
                    link: '/ru/about/',
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
      Поддержать нас
    </a>`,
            link: '',
          },
        ],
        editLink: {
          pattern: 'https://github.com/kubb-labs/kubb/edit/main/docs/:path',
          text: 'Редактировать эту страницу на GitHub',
        },
        sidebar: {
          '/ru/getting-started': mainSidebarRu,
          '/ru/plugins': mainSidebarRu,
          '/ru/parsers': mainSidebarRu,
          '/ru/helpers': mainSidebarRu,
          '/ru/build': mainSidebarRu,
          '/ru/changelog': mainSidebarRu,
          '/ru/knowledge-base': knowledgeBaseSidebarRu,
          '/ru/examples': examplesSidebarRu,
          '/ru/blog': blogSidebarRu,
          '/ru/tutorials': tutorialsSidebarRu,
        },
        socialLinks: [
          { icon: 'github', link: 'https://github.com/kubb-labs/kubb' },
          { icon: 'discord', link: 'https://discord.gg/shfBFeczrm' },
        ],
        footer: {
          message: 'Выпущено под лицензией MIT.',
          copyright: `Авторские права © 2022-${new Date().getFullYear()} Stijn Van Hulle`,
        },
        docFooter: {
          prev: 'Предыдущая страница',
          next: 'Следующая страница',
        },
        outline: {
          label: 'На этой странице',
        },
        lastUpdated: {
          text: 'Последнее обновление',
        },
        returnToTopLabel: 'Вернуться наверх',
        sidebarMenuLabel: 'Меню',
        darkModeSwitchLabel: 'Тема',
        lightModeSwitchTitle: 'Переключить на светлую тему',
        darkModeSwitchTitle: 'Переключить на тёмную тему',
      },
    },
  },
  buildEnd: async (siteConfig) => {
    await buildEndGenerateOpenGraphImages(siteConfig)
  },
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
      md.use(copyOrDownloadAsMarkdownButtons)
    },
    lineNumbers: false,
    codeTransformers: [
      transformerTwoslash({
        twoslashOptions: {
          compilerOptions: {
            paths: {
              '@kubb/cli': ['../packages/cli/src/index.ts'],
              '@kubb/core': ['../packages/core/src/index.ts'],
              '@kubb/types': ['../packages/types/src/index.ts'],
              '@kubb/core/utils': ['../packages/core/src/utils/index.ts'],
              '@kubb/core/logger': ['../packages/core/src/logger.ts'],
              '@kubb/core/transformers': ['../packages/core/src/transformers/index.ts'],
              '@kubb/plugin-cypress': ['../packages/plugin-cypress/src/index.ts'],
              '@kubb/plugin-mcp': ['../packages/plugin-mcp/src/index.ts'],
              '@kubb/plugin-oas': ['../packages/plugin-oas/src/index.ts'],
              '@kubb/plugin-oas/generators': ['../packages/plugin-oas/generators/index.ts'],
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
              '@kubb/oas': ['../packages/oas/src/index.ts'],
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
                link: '/blog/fabric/',
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
    optimizeDeps: {
      exclude: ['@nolebase/vitepress-plugin-enhanced-readabilities/client', 'vitepress', '@nolebase/ui'],
    },
    ssr: {
      noExternal: ['@nolebase/vitepress-plugin-highlight-targeted-heading', '@nolebase/vitepress-plugin-enhanced-readabilities', '@nolebase/ui'],
    },
    plugins: [
      llmstxt(),
      renderMermaidGraphsPlugin(),
      groupIconVitePlugin({
        customIcon: {
          'kubb.config.ts': localIconLoader(import.meta.url, '../public/logo.png'),
          'kubb.config.js': localIconLoader(import.meta.url, '../public/logo.png'),
        },
      }),
    ] as any,
  },
})
