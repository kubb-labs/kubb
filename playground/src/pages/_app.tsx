import { ChakraProvider } from '@chakra-ui/react'
import Head from 'next/head'
import React from 'react'

import type { AppProps } from 'next/app'

function App({ Component, pageProps }: AppProps) {
  return (
    <ChakraProvider>
      <Head>
        <title>Kubb Playground</title>
        <script src="https://cdn.jsdelivr.net/npm/@kubb/core/dist/index.global.js"></script>
      </Head>
      <Component {...pageProps} />
    </ChakraProvider>
  )
}

export default App
