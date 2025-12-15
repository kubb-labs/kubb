import pc from 'picocolors'

export async function startWatcher(path: string[], cb: (path: string[]) => Promise<void>): Promise<void> {
  const { watch } = await import('chokidar')

  const ignored = '**/{.git,node_modules}/**'

  const watcher = watch(path, {
    ignorePermissionErrors: true,
    ignored,
  })
  watcher.on('all', (type, file) => {
    console.log(pc.yellow(pc.bold(`Change detected: ${type} ${file}`)))

    try {
      cb(path)
    } catch (_e) {
      console.log(pc.red('Watcher failed'))
    }
  })
}
