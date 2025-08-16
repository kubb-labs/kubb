import { createLogger } from '@kubb/core/logger'
import pc from 'picocolors'

export async function startWatcher(path: string[], cb: (path: string[]) => Promise<void>): Promise<void> {
  const { watch } = await import('chokidar')
  const logger = createLogger()

  const ignored = '**/{.git,node_modules}/**'

  const watcher = watch(path, {
    ignorePermissionErrors: true,
    ignored,
  })
  watcher.on('all', (type, file) => {
    logger?.emit('info', pc.yellow(pc.bold(`Change detected: ${type} ${file}`)))

    try {
      cb(path)
    } catch (_e) {
      logger?.emit('warning', pc.red('Watcher failed'))
    }
  })
}
