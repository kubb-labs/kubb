import { NolebaseEnhancedReadabilitiesMenu, NolebaseEnhancedReadabilitiesScreenMenu } from '@nolebase/vitepress-plugin-enhanced-readabilities/client'
import { NolebaseHighlightTargetedHeading } from '@nolebase/vitepress-plugin-highlight-targeted-heading/client'
import TwoslashFloatingVue from '@shikijs/vitepress-twoslash/client'
import type { EnhanceAppContext, Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
// @ts-expect-error cannot find import
import CopyOrDownloadAsMarkdownButtons from 'vitepress-plugin-llms/vitepress-components/CopyOrDownloadAsMarkdownButtons.vue'
import { h } from 'vue'

import '@nolebase/vitepress-plugin-highlight-targeted-heading/client/style.css'
import '@nolebase/vitepress-plugin-enhanced-readabilities/client/style.css'

// @ts-expect-error
import HomePage from './HomePage.vue'

import '@shikijs/vitepress-twoslash/style.css'
import 'virtual:group-icons.css'
import './style.css'

// @ts-expect-error
import allContributorsStr from '../../../.all-contributorsrc?raw'

export default {
  ...DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      // https://vitepress.dev/guide/extending-default-theme#layout-slots
      'home-features-after': () => h(HomePage, { allContributors: JSON.parse(allContributorsStr) }),
      'layout-top': () => [h(NolebaseHighlightTargetedHeading)],
      'nav-bar-content-after': () => h(NolebaseEnhancedReadabilitiesMenu),
      'nav-screen-content-after': () => h(NolebaseEnhancedReadabilitiesScreenMenu),
    })
  },
  enhanceApp(ctx: EnhanceAppContext) {
    DefaultTheme.enhanceApp(ctx)
    ctx.app.use(TwoslashFloatingVue)
    ctx.app.component('CopyOrDownloadAsMarkdownButtons', CopyOrDownloadAsMarkdownButtons)
  },
} satisfies Theme
