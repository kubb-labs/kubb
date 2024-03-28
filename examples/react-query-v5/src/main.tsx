import React from 'react'
import ReactDOM from 'react-dom/client'

import { App } from './App.tsx'
import { worker } from './mocks/index.ts'

const render = () => {
  ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
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
