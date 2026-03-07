import { styleText } from 'node:util'
import { WATCHER_IGNORED_PATHS } from '../constants.ts'

export async function startWatcher(path: string[], cb: (path: string[]) => Promise<void>): Promise<void> {
  const { watch } = await import('chokidar')

  const watcher = watch(path, {
    ignorePermissionErrors: true,
    ignored: WATCHER_IGNORED_PATHS,
  })
  watcher.on('all', async (type, file) => {
    console.log(styleText('yellow', styleText('bold', `Change detected: ${type} ${file}`)))

    try {
      await cb(path)
    } catch (_e) {
      console.log(styleText('red', 'Watcher failed'))
    }
  })
}
