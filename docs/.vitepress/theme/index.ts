// https://vitepress.dev/guide/custom-theme
import { inject } from '@vercel/analytics'
import DefaultTheme from 'vitepress/theme'
import { injectSpeedInsights } from '@vercel/speed-insights'
import { h } from 'vue'

import HomePage from './HomePage.vue'

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
  enhanceApp(ctx: any) {
    injectSpeedInsights()
    DefaultTheme.enhanceApp(ctx)
  },
}
