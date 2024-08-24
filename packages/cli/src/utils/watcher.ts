import c from 'tinyrainbow'
import { createLogger } from '@kubb/core/logger'

export async function startWatcher(path: string[], cb: (path: string[]) => Promise<void>): Promise<void> {
  const { watch } = await import('chokidar')

  const ignored = ['**/{.git,node_modules}/**']
  const logger = createLogger()

  const watcher = watch(path, {
    ignorePermissionErrors: true,
    ignored,
  })
  watcher.on('all', (type, file) => {
    logger.emit('info', c.yellow(c.bold(`Change detected: ${type} ${file}`)))

    try {
      cb(path)
    } catch (e) {
      logger?.emit('warning', c.red('Watcher failed'))
    }
  })

  return
}
