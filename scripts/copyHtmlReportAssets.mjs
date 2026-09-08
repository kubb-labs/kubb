import { cp, mkdir, readdir, rm } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

const root = new URL('..', import.meta.url)
const source = new URL('packages/devtools/client/dist/assets/', root)
const target = new URL('packages/core/dist/assets/', root)
const sourcePath = fileURLToPath(source)
const targetPath = fileURLToPath(target)
const files = await readdir(sourcePath)
const script = files.filter((file) => file.endsWith('.js'))
const styles = files.filter((file) => file.endsWith('.css'))

if (script.length !== 1 || styles.length !== 1) {
  throw new Error(`Expected one devtools JavaScript and CSS asset, found ${script.length} JS and ${styles.length} CSS files`)
}

await rm(targetPath, { recursive: true, force: true })
await mkdir(targetPath, { recursive: true })
await cp(join(sourcePath, script[0]), join(targetPath, 'report.js'))
await cp(join(sourcePath, styles[0]), join(targetPath, 'report.css'))
