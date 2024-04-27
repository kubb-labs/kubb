import TwoslashFloatingVue from '@shikijs/vitepress-twoslash/client'
// https://vitepress.dev/guide/custom-theme
import { inject } from '@vercel/analytics'
import { injectSpeedInsights } from '@vercel/speed-insights'
import type { EnhanceAppContext } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import { h } from 'vue'

import HomePage from './HomePage.vue'

import '@shikijs/vitepress-twoslash/style.css'
import './style.css'

import allContributorsStr from '../../../.all-contributorsrc?raw'

inject({
  mode: 'auto',
})

export default {
  ...DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      // https://vitepress.dev/guide/extending-default-theme#layout-slots
      'home-features-after': () => h(HomePage, { allContributors: JSON.parse(allContributorsStr) }),
    })
  },
  enhanceApp(ctx: EnhanceAppContext) {
    injectSpeedInsights()
    DefaultTheme.enhanceApp(ctx)
    ctx.app.use(TwoslashFloatingVue)
  },
}
