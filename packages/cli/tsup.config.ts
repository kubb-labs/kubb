import { optionsCJS, optionsESM } from '@kubb/tsup-config'

import { defineConfig } from 'tsup'

export default defineConfig([{ ...optionsCJS, noExternal: [/ora/, /execa/, /tinyrainbow/] }, optionsESM])
