import { styleText } from 'node:util'
import { WATCHER_IGNORED_PATHS } from '../constants.ts'

export async function startWatcher(path: string[], cb: (path: string[]) => Promise<void>): Promise<void> {
  const { watch } = await import('chokidar')
  const watcher = watch(path, {
    ignorePermissionErrors: true,
    ignored: WATCHER_IGNORED_PATHS,
  })

  // Filesystem events can fire in quick succession (e.g. an editor writing a file twice on save),
  // and `cb` is async, so without serializing runs, two overlapping `cb` calls could both build
  // against the same output directory at once. Queue at most one extra run instead of overlapping.
  let isRunning = false
  let hasQueuedRun = false

  async function run(): Promise<void> {
    if (isRunning) {
      hasQueuedRun = true
      return
    }

    isRunning = true
    do {
      hasQueuedRun = false
      try {
        await cb(path)
      } catch (_e) {
        console.log(styleText('red', 'Watcher failed'))
      }
    } while (hasQueuedRun)
    isRunning = false
  }

  watcher.on('all', (type, file) => {
    console.log(styleText('yellow', styleText('bold', `Change detected: ${type} ${file}`)))

    void run()
  })
}
