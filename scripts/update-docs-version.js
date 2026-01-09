/**
 * This script updates the version in docs/config.json to match the version
 * of @kubb/core package. This ensures the docs always show the current version.
 *
 * It reads the version from packages/core/package.json and updates the
 * "v$version" placeholder in docs/config.json with the actual version number.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

try {
  // Read the version from @kubb/core package.json
  const corePackagePath = join(__dirname, '..', 'packages', 'core', 'package.json')
  const corePackage = JSON.parse(readFileSync(corePackagePath, 'utf8'))
  const version = corePackage.version

  if (!version) {
    console.error('Error: Could not find version in @kubb/core package.json')
    process.exit(1)
  }

  // Read docs/config.json
  const docsConfigPath = join(__dirname, '..', 'docs', 'config.json')
  const docsConfigContent = readFileSync(docsConfigPath, 'utf8')

  // Replace "v$version" with the actual version (e.g., "v4.14.1")
  const updatedContent = docsConfigContent.replace(/"v\$version"/g, `"v${version}"`)

  // Write back to docs/config.json
  writeFileSync(docsConfigPath, updatedContent, 'utf8')

  console.log(`✓ Updated docs/config.json with version v${version}`)
} catch (error) {
  console.error('Error updating docs version:', error.message)
  process.exit(1)
}
