// https://vitepress.dev/guide/custom-theme
import { h } from 'vue'
import DefaultTheme from 'vitepress/theme'
import { EnhanceAppContext } from 'vitepress/dist/client'
import { inject } from '@vercel/analytics'

import HomePage from './HomePage.vue'

import './style.css'

import allContributorsStr from '../../.all-contributorsrc?raw'

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
    DefaultTheme.enhanceApp(ctx)
  },
}
