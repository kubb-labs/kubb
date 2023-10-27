import fs from 'node:fs'

const tag = process.argv[process.argv.length - 1]

const pkgJsonPaths = ['package.json']
try {
  for (const pkgJsonPath of pkgJsonPaths) {
    const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'))
    const oldVersion = 'workspace:*'
    const newVersion = ['latest', 'canary', 'alpha'].includes(tag) ? tag : pkg.version

    const content = JSON.stringify(pkg, null, '\t') + '\n'
    const newContent = content
      // @ts-ignore
      .replaceAll(`"${oldVersion}"`, `"${newVersion}"`)

    fs.writeFileSync(pkgJsonPath, newContent)
  }
} catch (error) {
  console.error(error)
  process.exit(1)
}
