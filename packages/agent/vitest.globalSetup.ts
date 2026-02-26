import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'

const agentDir = path.resolve(import.meta.dirname)
const agentOutput = path.join(agentDir, '.output/server/index.mjs')

export async function setup(): Promise<void> {
  if (!existsSync(agentOutput)) {
    console.log('[globalSetup] Building agent package before E2E tests…')
    execSync('pnpm run build', { cwd: agentDir, stdio: 'inherit' })
  }
}
