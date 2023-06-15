import pc from 'picocolors'

import { spinner } from '../program'

export async function startWatcher(path: string[], cb: (path: string[]) => Promise<void>): Promise<void> {
  const { watch } = await import('chokidar')

  const ignored = ['**/{.git,node_modules}/**']

  const watcher = watch(path, {
    ignorePermissionErrors: true,
    ignored,
  })
  watcher.on('all', (type, file) => {
    spinner.succeed(pc.yellow(pc.bold(`Change detected: ${type} ${file}`)))
    // revert back
    spinner.spinner = 'clock'

    try {
      cb(path)
    } catch (e) {
      spinner.warn(pc.red('Watcher failed'))
    }
  })

  return
}
