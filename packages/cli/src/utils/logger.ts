import { LogMapper, createLogger } from '@kubb/core/logger'

export const logger = createLogger({
  logLevel: LogMapper.info,
  name: '',
})
