import TwoslashFloatingVue from '@shikijs/vitepress-twoslash/client'
import type { EnhanceAppContext } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import { h } from 'vue'

import HomePage from './HomePage.vue'
import Banner from './Banner.vue'

import '@shikijs/vitepress-twoslash/style.css'
import './style.css'

import allContributorsStr from '../../../.all-contributorsrc?raw'

export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      // https://vitepress.dev/guide/extending-default-theme#layout-slots
      'home-features-after': () => h(HomePage, { allContributors: JSON.parse(allContributorsStr) }),
      'layout-top': () => h(Banner),
    })
  },
  enhanceApp(ctx: EnhanceAppContext) {
    DefaultTheme.enhanceApp(ctx)
    ctx.app.use(TwoslashFloatingVue)
  },
}
