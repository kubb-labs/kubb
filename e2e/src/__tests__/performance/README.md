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

# Run specific benchmark file directly
node --expose-gc ./e2e/src/__tests__/performance/plugin-generation.bench.ts
```

## Benchmark Tool

We use **[Mitata](https://github.com/evanwashere/mitata)** for benchmarking. Mitata is a fast, accurate, and user-friendly benchmarking library that provides:
- High-resolution timing measurements
- Statistical analysis of results
- Automatic garbage collection control
- Beautiful terminal output
- Support for async benchmarks

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

Mitata provides detailed benchmark results showing:
- **avg (mean)**: Average execution time (lower is better)
- **min/max**: Minimum and maximum execution times
- **p75/p99/p995/p999**: Percentile timings
- **runs**: Number of benchmark iterations
- Visual histogram showing timing distribution

Example output:
```
┌─────────────────────────────────────────────────┬──────────┬──────────┬──────────┬──────────┐
│                   Benchmark                     │  avg     │  min     │  max     │  runs    │
├─────────────────────────────────────────────────┼──────────┼──────────┼──────────┼──────────┤
│ single plugin generation (plugin-ts)            │ 52.39 ms │ 38.14 ms │ 136.95ms │   50     │
│ multiple plugins (plugin-ts + plugin-client)    │ 105.82ms │ 85.08 ms │ 315.47ms │   25     │
│ comprehensive plugin suite generation           │ 201.69ms │ 171.37ms │ 256.42ms │   15     │
└─────────────────────────────────────────────────┴──────────┴──────────┴──────────┴──────────┘
```

## Adding New Benchmarks

To add a new benchmark:

1. Add to the existing `plugin-generation.bench.ts` file or create a new `.bench.ts` file in this directory
2. Use `bench()` and `group()` functions from Mitata:

```typescript
import { bench, group, run } from 'mitata'
import { build } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
// ... other imports

group('My Benchmark Suite', () => {
  bench('my benchmark', async () => {
    // Your code to benchmark
    await build({ config, events })
  })
})

await run()
```

3. Run with `pnpm perf:bench` or directly with Node.js

## Configuration Options

Mitata supports various configuration options:

```typescript
// Custom time limits and warmup
bench('my benchmark', async () => {
  // code
}).time(5000) // Run for 5 seconds

// Manual garbage collection control
bench('lots of allocations', async () => {
  // code
}).gc('inner') // Run GC before each iteration

// For better results, run with garbage collection enabled
// node --expose-gc ./e2e/src/__tests__/performance/plugin-generation.bench.ts
```

## Notes

- Benchmarks use the `petStore.yaml` OpenAPI spec from `e2e/schemas/`
- File writing is disabled (`write: false`) to focus on generation performance
- Running with `--expose-gc` enables manual garbage collection for more accurate measurements
- Mitata automatically runs warmup iterations before collecting benchmark data

## See Also

- [Mitata Documentation](https://github.com/evanwashere/mitata)
- [Main Performance Script](../../../../package.json) - `pnpm perf:bench`
- [LLVM Benchmarking Tips](https://llvm.org/docs/Benchmarking.html)
