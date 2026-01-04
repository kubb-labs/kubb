---
layout: doc

title: Troubleshooting
outline: deep
---

# Troubleshooting

This guide covers common issues you might encounter when using Kubb and how to resolve them.

## Installation Issues

### Node.js Version Error

**Error**: `Kubb requires Node.js 20 or higher`

**Solution**: Update your Node.js version to 20 or higher.

```shell
# Check your Node.js version
node --version

# Update using nvm
nvm install 20
nvm use 20
```

### Package Manager Conflicts

**Error**: Package installation fails with peer dependency errors

**Solution**: Clear your package manager cache and reinstall:

::: code-group
```shell [bun]
bun pm cache rm
rm -rf node_modules bun.lockb
bun install
```

```shell [pnpm]
pnpm store prune
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

```shell [npm]
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

```shell [yarn]
yarn cache clean
rm -rf node_modules yarn.lock
yarn install
```
:::

## Configuration Issues

### Config File Not Found

**Error**: `Cannot find kubb config file`

**Solution**: Ensure your config file exists in the project root with one of these names:
- `kubb.config.ts` - TypeScript (recommended)
- `kubb.config.js` - JavaScript (requires `"type": "module"` in package.json)
- `kubb.config.mjs` - ESM JavaScript
- `kubb.config.cjs` - CommonJS JavaScript

You can also specify a custom config path:

```shell
kubb generate --config ./configs/kubb.config.ts
```

### Invalid OpenAPI File

**Error**: `Failed to parse OpenAPI specification`

**Solution**:
1. Validate your OpenAPI file using the [Swagger Editor](https://editor.swagger.io/)
2. Ensure the file path is correct in your config
3. If using a URL, verify it's accessible

```typescript twoslash [kubb.config.ts]
import { defineConfig } from '@kubb/core'

export default defineConfig({
  input: {
    // Use absolute path if relative path fails
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
})
```

### Module Type Errors

**Error**: `Cannot use import statement outside a module`

**Solution**: Ensure you have `"type": "module"` in your `package.json`, or rename your config file to use the `.mjs` extension.

```json [package.json]
{
  "type": "module"
}
```

## Generation Issues

### Missing Plugin Dependencies

**Error**: `Plugin X requires plugin Y to be installed`

**Solution**: Install the required dependency plugin. Check the plugin documentation for its prerequisites.

Most plugins require `@kubb/plugin-oas`:

```typescript twoslash [kubb.config.ts]
import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginTs } from '@kubb/plugin-ts'

export default defineConfig({
  input: { path: './petStore.yaml' },
  output: { path: './src/gen' },
  plugins: [
    pluginOas(), // Required by most plugins
    pluginTs(),
  ],
})
```

### Empty or Incomplete Output

**Problem**: Generated files are empty or missing content

**Solutions**:
1. Check if your OpenAPI file has the expected paths/schemas
2. Review the `include`/`exclude` options in your plugin config
3. Enable debug mode to see what's happening:

```shell
kubb generate --debug
```

### Type Generation Errors

**Error**: TypeScript errors in generated files

**Solutions**:
1. Check your `tsconfig.json` compiler options
2. Ensure `moduleResolution` is set to `bundler` or `node16`
3. Verify the `paths` mapping if using path aliases

```json [tsconfig.json]
{
  "compilerOptions": {
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "strict": true
  }
}
```

## Performance Issues

### Slow Generation

**Problem**: Code generation takes a long time

**Solutions**:
1. Use the `include` option to generate only what you need:

```typescript
pluginTs({
  include: [
    { type: 'tag', pattern: 'pets' },
  ],
})
```

2. Disable unused plugins
3. Use a smaller OpenAPI specification for development

### Out of Memory

**Error**: `JavaScript heap out of memory`

**Solution**: Increase Node.js memory limit (4096 = 4GB, adjust based on available system memory):

```shell
NODE_OPTIONS="--max-old-space-size=4096" kubb generate
```

## Runtime Issues

### Import Errors

**Error**: `Cannot find module` when importing generated code

**Solutions**:
1. Verify the output path matches your import path
2. Check the `output.extension` option:

```typescript twoslash [kubb.config.ts]
export default defineConfig({
  output: {
    path: './src/gen',
    extension: {
      '.ts': '.js', // For ESM compatibility
    },
  },
})
```

3. Ensure barrel files are generated (check `output.barrelType`)

### Client Request Errors

**Problem**: Generated API clients fail to make requests

**Solutions**:
1. Verify your base URL configuration:

```typescript
import { client } from './gen/client'

client.setConfig({
  baseURL: 'https://api.example.com',
})
```

2. Check if CORS is enabled on the server
3. Verify authentication headers are set correctly

## Debug Mode

Enable debug mode to get detailed logs:

```shell
kubb generate --debug
```

This creates log files in the `.kubb` directory (e.g., `.kubb/kubb-{name}-{timestamp}.log`). The CLI will display the exact location of each debug log file after generation completes.

## Getting Help

If you're still experiencing issues:

1. Check the [GitHub Issues](https://github.com/kubb-labs/kubb/issues) for similar problems
2. Join the [Discord community](https://discord.gg/shfBFeczrm) for help
3. Create a new issue with:
   - Kubb version
   - Node.js version
   - Minimal reproduction steps
   - Error messages and logs

## FAQ

### Can I use Kubb with JavaScript instead of TypeScript?

Yes, Kubb generates TypeScript by default, but you can use the output in JavaScript projects. The generated `.ts` files can be transpiled to JavaScript using your build tool.

### How do I update generated code when my OpenAPI spec changes?

Simply re-run `kubb generate`. Use the `output.clean` option to remove old files:

```typescript
output: {
  path: './src/gen',
  clean: true, // Removes old files before generating
}
```

### Can I customize the generated code?

Yes, you can use:
1. **Generators**: Create custom generators to control output
2. **Transformers**: Modify names and paths
3. **Override**: Override generation for specific operations/schemas

See [Generators](/knowledge-base/generators/) for more details.
