// https://vitepress.dev/guide/custom-theme
import { h } from 'vue'
import Theme from 'vitepress/theme'
import { inject } from '@vercel/analytics'
import HomePage from './HomePage.vue'

import './style.css'

import allContributorsStr from '../../../.all-contributorsrc?raw'

inject({
  mode: 'auto',
})

export default {
  extends: Theme,
  Layout: () => {
    return h(Theme.Layout, null, {
      // https://vitepress.dev/guide/extending-default-theme#layout-slots
      'home-features-after': () => h(HomePage, { allContributors: JSON.parse(allContributorsStr) }),
    })
  },
  enhanceApp({ app, router, siteData }) {
    // ...
  },
}
