import { defineConfig } from 'kubb/config'
import { pluginTs } from '@kubb/plugin-ts'
export default defineConfig({
  input: process.env.SPEC!,
  output: { path: './gen', clean: true },
  plugins: [pluginTs()],
})
