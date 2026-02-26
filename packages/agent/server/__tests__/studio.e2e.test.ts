/**
 * E2E test: spins up the real built Nitro agent and a lightweight mock Studio server,
 * then validates the full WebSocket lifecycle including generate and connect commands
 * with different permission modes.
 */

import type { ChildProcess } from 'node:child_process'
import { existsSync, rmSync } from 'node:fs'
import path from 'node:path'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { WebSocket } from 'ws'
import type { DataMessage } from '../types/agent.ts'
import { isConnectedMessage, isDataMessage, isPingMessage } from '../types/agent.ts'
import { connectCmd, createMockStudio, type MockStudio, makeTmpDir, STARTUP_TIMEOUT, spawnAgent, waitForAgentReady } from './helpers.ts'

describe.skip('studio plugin – e2e (read-only agent)', () => {
  const context = {} as { studio: MockStudio; agent: ChildProcess; tmpDir: string }

  beforeAll(async () => {
    context.tmpDir = makeTmpDir()
    context.studio = await createMockStudio({ isSandbox: false })
    context.agent = spawnAgent({ studioPort: context.studio.port, tmpDir: context.tmpDir, allowWrite: false })

    await waitForAgentReady(context.agent)
    await context.studio.waitForConnection()
  }, STARTUP_TIMEOUT + 2_000)

  afterAll(async () => {
    context.agent.kill()
    await context.studio.close()
    rmSync(context.tmpDir, { recursive: true, force: true })
  })

  afterEach(() => {
    context.studio.clearMessages()
  })

  it('agent registers with Studio on startup', () => {
    expect(context.studio.agentWs()).not.toBeNull()
  })

  it('health endpoint returns ok', async () => {
    expect(context.studio.agentWs()?.readyState).toBe(WebSocket.OPEN)
  })

  describe('connect command', () => {
    it('sends back a connected message with plugin config and read-only permissions', { timeout: 60_000 }, async () => {
      context.studio.send(connectCmd)

      const msg = await context.studio.waitForMessage(isConnectedMessage)
      expect(msg.payload.permissions.allowWrite).toBe(false)
      expect(msg.payload.permissions.allowAll).toBe(false)
      expect(msg.payload.configPath).toBeDefined()
      expect(msg.payload.version).toBeDefined()
    })
  })

  describe('generate command', () => {
    it('emits generation lifecycle events over WebSocket', { timeout: 60_000 }, async () => {
      context.studio.send({ type: 'command', command: 'generate' })

      const start = await context.studio.waitForMessage((m): m is DataMessage<'generation:start'> => isDataMessage(m, 'generation:start'))

      expect(start.payload.type).toBe('generation:start')

      const end = await context.studio.waitForMessage((m): m is DataMessage<'generation:end'> => isDataMessage(m, 'generation:end'))

      expect(end.payload.type).toBe('generation:end')
    })

    it('does not write studioConfig when there is no payload', { timeout: 60_000 }, async () => {
      context.studio.send({ type: 'command', command: 'generate' })

      await context.studio.waitForMessage((m) => isDataMessage(m, 'generation:end'))

      expect(existsSync(path.join(context.tmpDir, 'kubb.config.studio.json'))).toBe(false)
    })
  })

  describe('heartbeat', () => {
    it('agent sends a ping message to Studio', { timeout: 60_000 }, async () => {
      const ping = await context.studio.waitForMessage(isPingMessage)

      expect(ping.type).toBe('ping')
    })
  })
})

describe.skip('studio plugin – e2e (write-enabled agent)', () => {
  const context = {} as { studio: MockStudio; agent: ChildProcess; tmpDir: string }

  beforeAll(async () => {
    context.tmpDir = makeTmpDir()
    context.studio = await createMockStudio({ isSandbox: false })
    context.agent = spawnAgent({ studioPort: context.studio.port, tmpDir: context.tmpDir, allowWrite: true })

    await waitForAgentReady(context.agent)
    await context.studio.waitForConnection()
  }, STARTUP_TIMEOUT + 2_000)

  afterAll(async () => {
    context.agent.kill()
    await context.studio.close()
    rmSync(context.tmpDir, { recursive: true, force: true })
  })

  afterEach(() => {
    context.studio.clearMessages()
  })

  it('reports write permissions in connected message', { timeout: 60_000 }, async () => {
    context.studio.send(connectCmd)

    const msg = await context.studio.waitForMessage(isConnectedMessage)

    expect(msg.payload.permissions.allowWrite).toBe(true)
    expect(msg.payload.permissions.allowAll).toBe(false)
  })

  it('persists studioConfig to disk when a payload is included in the generate command', { timeout: 60_000 }, async () => {
    const payload = { plugins: [] }
    context.studio.send({ type: 'command', command: 'generate', payload })

    await context.studio.waitForMessage((m) => isDataMessage(m, 'generation:end'))

    const { existsSync, readFileSync } = await import('node:fs')
    const studioConfigPath = path.join(context.tmpDir, 'kubb.config.studio.json')

    expect(existsSync(studioConfigPath)).toBe(true)
    expect(JSON.parse(readFileSync(studioConfigPath, 'utf-8'))).toEqual(payload)
  })
})

describe.skip('studio plugin – e2e (sandbox agent)', () => {
  const context = {} as { studio: MockStudio; agent: ChildProcess; tmpDir: string }

  beforeAll(async () => {
    context.tmpDir = makeTmpDir()
    context.studio = await createMockStudio({ isSandbox: true })
    context.agent = spawnAgent({ studioPort: context.studio.port, tmpDir: context.tmpDir, allowWrite: true })

    await waitForAgentReady(context.agent)
    await context.studio.waitForConnection()
  }, STARTUP_TIMEOUT + 2_000)

  afterAll(async () => {
    context.agent.kill()
    await context.studio.close()
    rmSync(context.tmpDir, { recursive: true, force: true })
  })

  afterEach(() => {
    context.studio.clearMessages()
  })

  it('reports false permissions on connect even when allowWrite is set', { timeout: 60_000 }, async () => {
    context.studio.send(connectCmd)

    const msg = await context.studio.waitForMessage(isConnectedMessage)

    expect(msg.payload.permissions.allowWrite).toBe(false)
    expect(msg.payload.permissions.allowAll).toBe(false)
  })

  it('uses inline input from the payload and never writes studioConfig', { timeout: 60_000 }, async () => {
    const payload = { input: 'openapi: "3.0.0"\ninfo:\n  title: Inline\n  version: "1.0.0"\npaths: {}', plugins: [] }
    context.studio.send({ type: 'command', command: 'generate', payload })

    await context.studio.waitForMessage((m) => isDataMessage(m, 'generation:end'))

    expect(existsSync(path.join(context.tmpDir, 'kubb.config.studio.json'))).toBe(false)
  })
})

// Test that multiple agents can connect to the same Studio instance without interfering with each other
describe.todo('studio plugin – e2e (multiple agents)')
