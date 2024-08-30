import { optionsCJS, optionsESM } from '@kubb/config-tsup'

import { defineConfig } from 'tsup'

export default defineConfig([
  {
    ...optionsCJS,
    entry: {
      index: 'src/index.ts',
      'jsx-runtime': './src/jsx-runtime.ts',
    },
  },
  {
    entry: {
      runner: './src/runner.tsx',
    },
    format: ['cjs'],
    target: ['es2020', 'node16'],
    noExternal:[/auto-bind/],
    banner: {
      'js': `
const ws = require('ws');

const customGlobal = global;
customGlobal.WebSocket ||= ws;
customGlobal.window ||= global;
customGlobal.self ||= global;

const devtools = require('react-devtools-core');
devtools.connectToDevTools();
    `}
  },
  {
    ...optionsESM,
    entry: {
      index: 'src/index.ts',
      'jsx-runtime': './src/jsx-runtime.ts',
    },
  },
])
