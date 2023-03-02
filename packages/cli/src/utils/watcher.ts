import pc from 'picocolors'

import type { Ora } from 'ora'

type Options = {
  path: string[]
  spinner: Ora
}
export async function startWatcher(cb: (path: string[]) => Promise<any>, options: Options) {
  const { spinner, path } = options
  const { watch } = await import('chokidar')

  const ignored = ['**/{.git,node_modules}/**']

  const watcher = watch(path, {
    ignorePermissionErrors: true,
    ignored,
  })
  watcher.on('all', async (type, file) => {
    spinner.succeed(pc.yellow(pc.bold(`Change detected: ${type} ${file}`)))
    // revert back
    spinner.spinner = 'clock'

    try {
      await cb(options.path)
    } catch (e) {
      spinner.warn(pc.red(e))
    }
  })
}
