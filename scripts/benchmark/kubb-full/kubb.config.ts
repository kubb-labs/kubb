import { defineConfig } from 'kubb/config'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginZod } from '@kubb/plugin-zod'
import { pluginFetch } from '@kubb/plugin-fetch'
export default defineConfig({
  input: process.env.SPEC!,
  output: { path: './gen', clean: true },
  plugins: [pluginTs(), pluginZod(), pluginFetch()],
})
