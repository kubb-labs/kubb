const types = process.env.MODE === 'types'
const input = { target: process.env.SPEC }
// Types only: orval has no types-only mode; an output with `schemas` and no `target` writes models only.
export default types
  ? { api: { input, output: { schemas: './gen/model' } } }
  : {
      api: { input, output: { target: './gen/api.ts', schemas: './gen/model', client: 'fetch', mode: 'split' } },
      zod: { input, output: { target: './gen/zod.ts', client: 'zod', mode: 'single' } },
    }
