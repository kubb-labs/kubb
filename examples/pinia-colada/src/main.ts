import { PiniaColada } from '@pinia/colada'
import { createPinia } from 'pinia'
import { createApp } from 'vue'

import App from './App.vue'
import { worker } from './mocks/index.ts'

const render = () => {
  const app = createApp(App)
  const pinia = createPinia()
  app.use(pinia)
  app.use(PiniaColada)
  app.mount('#root')
}

worker
  .start({
    serviceWorker: {
      /**
       * Use a custom Service Worker script URL to resolve
       * the mock worker served by CodeSandbox.
       * @note You DO NOT need this in your application.
       * @see https://mswjs.io/docs/api/setup-worker/start#serviceworker
       */
      url: '/mockServiceWorker.js',
    },
  })
  .then(() => render())
