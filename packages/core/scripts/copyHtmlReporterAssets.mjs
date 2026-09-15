import { copyFile, mkdir } from 'node:fs/promises'

const source = new URL('../src/reporters/html/index.html', import.meta.url)
const destination = new URL('../dist/html/index.html', import.meta.url)

await mkdir(new URL('../dist/html/', import.meta.url), { recursive: true })
await copyFile(source, destination)
