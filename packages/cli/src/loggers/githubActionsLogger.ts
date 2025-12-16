import { defineLogger } from '@kubb/core'

/**
 * GitHub Actions adapter for CI environments
 * Uses ::group:: and ::endgroup:: annotations for collapsible sections
 */
export const githubActionsLogger = defineLogger({
  name: 'github-actions',
  install(_context, _options) {
    // const logLevel = options?.logLevel || LogLevel.info
  },
})
