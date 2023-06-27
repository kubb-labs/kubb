/* eslint-disable */

import { beforeAll } from '@jest/globals'

beforeAll(() => {
  if (globalThis.Bun) {
    /** @type {import('bun:jsc')} */
    const jsc = require('bun:jsc')
    const http = require('http')
    const source = globalThis.Bun.fileURLToPath(jsc.callerSourceOrigin())
    const bunTest = globalThis.Bun.jest(source)

    globalThis.vi = bunTest.vi

    http.ClientRequest = { prototype: {} }
    http.OutgoingMessage = { prototype: {} }
  }
})

if (globalThis.jest) {
  /** @type {import('@jest/globals')} */
  const { jest } = require('@jest/globals')
  const http = require('http')

  globalThis.vi = jest

  http.ClientRequest = { prototype: {} }
  http.OutgoingMessage = { prototype: {} }
}
