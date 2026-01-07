# Performance Benchmarks

This directory contains performance benchmarks for Kubb plugin generation.

## Overview

The benchmarks test the performance of generating code from OpenAPI specifications using different plugin configurations. These help:
- Track performance regressions over time
- Identify optimization opportunities
- Compare performance of different plugin combinations

## Running Benchmarks

From the repository root:

```bash
# Run all benchmarks
pnpm perf:bench

# Run specific benchmark file
pnpm vitest bench --config ./configs/vitest.bench.config.ts tests/performance/main.bench.ts
```

## Benchmark Scenarios

### Single Plugin Generation (plugin-ts)
Tests performance of TypeScript type generation from an OpenAPI specification.

**Plugins used:**
- `plugin-oas` - OpenAPI specification parser
- `plugin-ts` - TypeScript types generator

### Multiple Plugins Generation (plugin-ts + plugin-client)
Tests performance with multiple code generators running simultaneously.

**Plugins used:**
- `plugin-oas` - OpenAPI specification parser
- `plugin-ts` - TypeScript types generator
- `plugin-client` - API client generator

### Comprehensive Plugin Suite
Tests performance with a full suite of generators including validation and mocking.

**Plugins used:**
- `plugin-oas` - OpenAPI specification parser
- `plugin-ts` - TypeScript types generator
- `plugin-client` - API client generator
- `plugin-zod` - Zod validation schemas
- `plugin-faker` - Mock data generators

## Understanding Results

Benchmark results show:
- **hz**: Operations per second (higher is better)
- **min/max/mean**: Execution time in milliseconds (lower is better)
- **p75/p99/p995/p999**: Percentile timings
- **rme**: Relative margin of error (lower is better)
- **samples**: Number of benchmark iterations

Example output:
```
✓ test/performance/main.bench.ts
    name                                                          hz      min     max     mean      p75     p99
  · single plugin generation (plugin-ts)                     19.0873  38.1352  136.95  52.3908  55.1142  113.74
  · multiple plugins generation (plugin-ts + plugin-client)   9.4499  85.0752  315.47   105.82   112.78  315.47
  · comprehensive plugin suite generation                     4.9581   171.37  256.42   201.69   221.47  256.42
```

## Adding New Benchmarks

To add a new benchmark:

1. Create a new `.bench.ts` file in this directory
2. Use the `bench()` function from `vitest`:

```typescript
import { bench, describe } from 'vitest'
import { build } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
// ... other imports

describe('My Benchmark Suite', () => {
  bench('my benchmark', async () => {
    // Your code to benchmark
    await build({ config, events })
  }, {
    time: 10000, // Run for 10 seconds
  })
})
```

3. Run with `pnpm perf:bench`

## Notes

- Benchmarks use the `petStore.yaml` OpenAPI spec from `schemas/`
- File writing is disabled (`write: false`) to focus on generation performance
- The `time` option specifies how long (in milliseconds) to run the benchmark
- Benchmarks are excluded from regular test coverage

## See Also

- [Vitest Benchmark Documentation](https://vitest.dev/guide/features.html#benchmarking)
- [Main Performance Script](../../../../package.json) - `pnpm perf:bench`
- [Benchmark Configuration](../../../../configs/vitest.bench.config.ts)
