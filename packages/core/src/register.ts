/**
 * Registers the Kubb virtual-module loader for Node.js ESM.
 *
 * Usage (add to your build/test command):
 *   node --import @kubb/core/register your-plugin.ts
 *
 * Or programmatically (must be the first import in your entry file):
 *   import '@kubb/core/register'
 *
 * After registration, you can import Kubb virtual modules:
 *   import { files } from 'kubb:files'
 *   import { driver } from 'kubb:driver'
 *
 * Requires Node.js >= 22 (module.register is available since Node 18.19).
 */
import { register } from 'node:module'

register('./loader.js', import.meta.url)
