import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { styleText } from 'node:util'
import * as clack from '@clack/prompts'
import { spawnAsync, getErrorMessage } from '@internals/utils'
import { agentDefaults } from '../../constants.ts'
import { buildTelemetryEvent, sendTelemetry } from '../../telemetry.ts'
import { isPortAvailable, resolveAgentStartEnvironment } from './utils.ts'

type AgentStartOptions = {
  /**
   * TCP port for the HTTP server. When `undefined`, falls back to `PORT` env var or the default (`3000`).
   */
  port: string | undefined
  /**
   * Hostname the HTTP server binds to.
   *
   * @default 'localhost'
   */
  host: string
  /**
   * Explicit path to the Kubb config file. When `undefined`, falls back to `KUBB_AGENT_CONFIG` or the default filename.
   */
  configPath: string | undefined
  /**
   * Grants the agent permission to write generated files to the filesystem.
   */
  allowWrite: boolean
  /**
   * Grants all agent permissions, including filesystem writes. Implies `allowWrite`.
   */
  allowAll: boolean
  /**
   * Current `@kubb/cli` version string, used for the telemetry payload.
   */
  version: string
}

/**
 * Spawns the Kubb Agent HTTP server as a Node.js subprocess.
 * Resolves config from CLI flags and environment variables, validates the port, and exits with code 1 on failure.
 */
export async function run({ port, host, configPath, allowWrite, allowAll, version }: AgentStartOptions): Promise<void> {
  const hrStart = process.hrtime()

  try {
    // Load .env file into process.env using Node.js built-in (v20.12.0+)
    try {
      process.loadEnvFile()
    } catch {
      // .env file may not exist; ignore
    }

    // Resolve the @kubb/agent package path
    let agentPkgUrl: string
    try {
      agentPkgUrl = import.meta.resolve('@kubb/agent/package.json')
    } catch (_e) {
      console.error(styleText('red', 'The @kubb/agent package is not installed.'))
      console.error('')
      console.error('Install it with:')
      console.error(styleText('cyan', '  npm install @kubb/agent'))
      console.error(styleText('cyan', '  # or'))
      console.error(styleText('cyan', '  pnpm install @kubb/agent'))
      console.error('')
      process.exit(1)
    }
    const agentPkgPath = fileURLToPath(agentPkgUrl)
    const agentDir = path.dirname(agentPkgPath)
    const serverPath = path.join(agentDir, agentDefaults.serverEntryPath)

    const resolvedEnv = resolveAgentStartEnvironment({
      port,
      host,
      configPath,
      allowWrite,
      allowAll,
    })
    const numericPort = Number(resolvedEnv.port)

    if (!Number.isInteger(numericPort) || numericPort <= 0) {
      throw new Error(`Invalid port "${resolvedEnv.port}". Provide a positive integer with --port or PORT.`)
    }

    clack.log.step(styleText('cyan', 'Starting agent server...'))
    clack.log.info(styleText('dim', `Config: ${resolvedEnv.agentConfigPath}`))
    clack.log.info(styleText('dim', `Host: ${resolvedEnv.host}`))
    clack.log.info(styleText('dim', `Port: ${resolvedEnv.port}`))
    if (!resolvedEnv.allowWrite && !resolvedEnv.allowAll) {
      clack.log.warn(styleText('yellow', 'Filesystem writes disabled. Use --allow-write or --allow-all to enable.'))
    }

    if (!(await isPortAvailable(numericPort, resolvedEnv.host))) {
      clack.log.error(styleText('red', `Port ${resolvedEnv.port} is already in use. Stop the existing process or choose a different port with --port.`))
      process.exit(1)
    }

    // Spawns the server as a detached background process so the CLI can exit independently.
    await spawnAsync('node', [serverPath], {
      env: resolvedEnv.env,
      cwd: process.cwd(),
    })

    await sendTelemetry(
      buildTelemetryEvent({
        command: 'agent',
        kubbVersion: version,
        hrStart,
        status: 'success',
      }),
    )
  } catch (error) {
    await sendTelemetry(
      buildTelemetryEvent({
        command: 'agent',
        kubbVersion: version,
        hrStart,
        status: 'failed',
      }),
    )
    clack.log.error(styleText('red', 'Failed to start agent server'))
    clack.log.error(getErrorMessage(error))
    process.exit(1)
  }
}
