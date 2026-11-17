// Builds the native addon and puts it next to index.mjs as core_rs.node.
import { execFileSync } from 'node:child_process'
import { copyFileSync } from 'node:fs'
import path from 'node:path'

const dir = import.meta.dirname
execFileSync('cargo', ['build', '--release'], { cwd: dir, stdio: 'inherit' })
const lib = { linux: 'libcore_rs.so', darwin: 'libcore_rs.dylib', win32: 'core_rs.dll' }[process.platform]
copyFileSync(path.join(dir, 'target/release', lib), path.join(dir, 'core_rs.node'))
