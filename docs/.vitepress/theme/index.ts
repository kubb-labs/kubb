import TwoslashFloatingVue from '@shikijs/vitepress-twoslash/client'
import type { EnhanceAppContext } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import { h } from 'vue'
import type { Theme } from 'vitepress'
// import { NolebaseGitChangelogPlugin } from '@nolebase/vitepress-plugin-git-changelog/client'
import { NolebaseHighlightTargetedHeading } from '@nolebase/vitepress-plugin-highlight-targeted-heading/client'
import { NolebaseEnhancedReadabilitiesMenu, NolebaseEnhancedReadabilitiesScreenMenu } from '@nolebase/vitepress-plugin-enhanced-readabilities/client'

import '@nolebase/vitepress-plugin-highlight-targeted-heading/client/style.css'
import '@nolebase/vitepress-plugin-git-changelog/client/style.css'
import '@nolebase/vitepress-plugin-enhanced-readabilities/client/style.css'

import HomePage from './HomePage.vue'

import '@shikijs/vitepress-twoslash/style.css'
import 'virtual:group-icons.css'
import './style.css'

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
    // ctx.app.use(NolebaseGitChangelogPlugin)
  },
} satisfies Theme
