import { adapterOas } from '@kubb/adapter-oas'
import { setDefaultAdapter, setDefaultParsers } from '@kubb/core'
import { parserTs } from '@kubb/parser-ts'

setDefaultAdapter(adapterOas())
setDefaultParsers([parserTs])

export { defineConfig } from './defineConfig.ts'
