import React from 'react'

import { Analytics } from '@vercel/analytics/react'

import 'nextra-theme-docs/style.css'
import '../styles.css'

export default function Nextra({ Component, pageProps }: { pageProps: any; Component: React.ElementType }) {
  return (
    <>
      <Component {...pageProps} />
      <Analytics />
    </>
  )
}
