const { ast } = await import(`../${process.env.DIST ?? 'dist'}/index.js`)

function mergeFile(a, b) {
  return { ...a, sources: [...(a.sources ?? []), ...(b.sources ?? [])], imports: [...(a.imports ?? []), ...(b.imports ?? [])], exports: [] }
}

function fragment(i) {
  return {
    path: '/gen/models.ts',
    baseName: 'models.ts',
    sources: [
      ast.factory.createSource({
        name: `Model${i}`,
        isExportable: true,
        nodes: [ast.factory.createText(`export type Model${i} = { id: number; ref: Ref${i}; tag: Tag${i % 7} }`)],
      }),
    ],
    imports: [{ kind: 'Import', name: [`Ref${i}`, `Tag${i % 7}`], path: `./refs/ref${i}.ts`, isTypeOnly: true }],
    exports: [],
  }
}

function small(iterations) {
  const input = fragment(1)
  const start = performance.now()
  for (let i = 0; i < iterations; i++) ast.factory.createFile(input)
  return performance.now() - start
}

function merged(n) {
  let file = ast.factory.createFile(fragment(0))
  const start = performance.now()
  for (let i = 1; i < n; i++) file = ast.factory.createFile(mergeFile(file, fragment(i)))
  return performance.now() - start
}

small(3000)
console.log(`small x20000: ${small(20000).toFixed(1)} ms`)
for (const n of [100, 400, 800, 1600]) console.log(`merged ${String(n).padStart(4)}: ${merged(n).toFixed(1)} ms`)
