const types = process.env.MODE === 'types'
export default {
  input: process.env.SPEC,
  output: { path: './gen', clean: true },
  plugins: types ? ['@hey-api/typescript'] : ['@hey-api/typescript', 'zod', '@hey-api/client-fetch', '@hey-api/sdk'],
}
