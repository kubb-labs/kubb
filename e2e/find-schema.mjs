import { safeBuild } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginTs } from '@kubb/plugin-ts'
import fs from 'fs'

const jiraSpec = JSON.parse(fs.readFileSync('/tmp/jira-spec.json', 'utf-8'))

console.log('Jira spec loaded. Testing schemas one by one...')
console.log(`Total schemas in components: ${Object.keys(jiraSpec.components?.schemas || {}).length}`)

// Test each schema one at a time to find the problematic one
const schemas = Object.entries(jiraSpec.components?.schemas || {})

for (let i = 0; i < Math.min(schemas.length, 50); i++) {
  const [schemaName, schemaDefinition] = schemas[i]
  
  const testSpec = {
    openapi: jiraSpec.openapi,
    info: { title: 'Test', version: '1.0.0' },
    paths: {},
    components: {
      schemas: {
        [schemaName]: schemaDefinition
      }
    }
  }
  
  const result = await safeBuild({
    config: {
      root: '.',
      input: { data: testSpec },
      output: { path: './out', clean: true, write: false },
      plugins: [
        pluginOas({ validate: false }),
        pluginTs({ output: { path: './types', barrelType: false } }),
      ],
    },
  })
  
  if (result.failedPlugins && result.failedPlugins.size > 0) {
    console.log(`\n❌ FOUND IT! Schema "${schemaName}" causes error!`)
    console.log(`   Schema definition:`)
    console.log(JSON.stringify(schemaDefinition, null, 2))
    break
  } else {
    process.stdout.write(`✓ ${i + 1}/${schemas.length}: ${schemaName.substring(0, 30).padEnd(30)} `)
    if ((i + 1) % 3 === 0) console.log('')
  }
}
