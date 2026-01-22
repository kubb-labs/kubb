import { defineLogger, LogLevel } from '@kubb/core'
import { render } from 'ink'
import React from 'react'
import { InkLogger } from './InkLogger.tsx'

export const inkLogger = defineLogger({
  name: 'ink',
  install(context, options) {
    const logLevel = options?.logLevel || LogLevel.info

    render(React.createElement(InkLogger, { context, logLevel }))
  },
})
