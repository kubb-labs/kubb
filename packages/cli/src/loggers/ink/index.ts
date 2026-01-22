import { defineLogger, LogLevel } from '@kubb/core'
import React from 'react'
import { render } from 'ink'
import { InkLogger } from './InkLogger.tsx'

export const inkLogger = defineLogger({
  name: 'ink',
  install(context, options) {
    const logLevel = options?.logLevel || LogLevel.info

    const instance = render(React.createElement(InkLogger, { context, logLevel }))

    return () => {
        instance.unmount()
    }
  }
})
