/**
 * Micro-benchmarks for `@kubb/transformer` native functions.
 *
 * These benchmarks exist to answer two questions raised about the Rust integration:
 *
 * 1. **Is native camelCase actually faster?**
 *    Run `native` and `js-fallback` variants to see the speedup.
 *
 * 2. **Is file I/O worth implementing in Rust?**
 *    The `file I/O` benchmarks demonstrate that disk throughput is the
 *    bottleneck, not JavaScript string processing — Rust would provide
 *    the same syscall throughput with additional NAPI bridge overhead.
 *
 * Run with:
 *   pnpm run test:bench
 */

import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { bench, describe } from 'vitest'

// Import native transformer (pre-built .node binary, or JS fallback)
import {
  camelCase,
  getRelativePath,
  pascalCase,
  screamingSnakeCase,
  snakeCase,
  transformReservedWord,
} from '../../packages/transformer/index.js'

// Import pure JS fallback explicitly (used for native vs. JS comparison)
import {
  camelCase as camelCaseJs,
  getRelativePath as getRelativePathJs,
  pascalCase as pascalCaseJs,
  screamingSnakeCase as screamingSnakeCaseJs,
  snakeCase as snakeCaseJs,
  transformReservedWord as transformReservedWordJs,
} from '../../packages/transformer/fallback.js'

// ---------------------------------------------------------------------------
// Realistic input data – API identifiers from a typical OpenAPI spec
// ---------------------------------------------------------------------------

/**
 * Typical operation names from a medium-sized REST API (50+ endpoints).
 * These are the identifiers that camelCase/pascalCase are called on
 * during code generation.
 */
const operationNames = [
  'createPet',
  'getPetById',
  'updatePet',
  'deletePet',
  'listPets',
  'findPetsByStatus',
  'findPetsByTags',
  'uploadFile',
  'getInventory',
  'placeOrder',
  'getOrderById',
  'deleteOrder',
  'createUser',
  'createUsersWithArrayInput',
  'loginUser',
  'logoutUser',
  'getUserByName',
  'updateUser',
  'deleteUser',
  'get-pet-by-id',
  'create_new_pet',
  'update_pet_with_form',
  'delete_pet',
  'find_pets_by_status',
  'HTTP_method_override',
  'XMLParser',
  'getHTTPSResponse',
]

/** Typical schema property names from API specs (snake_case, camelCase, mixed). */
const propertyNames = [
  'pet_id',
  'first_name',
  'last_name',
  'created_at',
  'updated_at',
  'order_id',
  'user_name',
  'api_key',
  'HTTP_status',
  'XMLDocument',
  'phone_number',
  'email_address',
  'street_address',
  'zip_code',
  'country_code',
  'ISO_date',
  'UUID',
  'base_URL',
  'callback_URL',
  'error_code',
  'status_message',
  'file_name',
  'content_type',
  'max_retries',
  'timeout_ms',
]

/** Words tested by transformReservedWord (mix of reserved and normal). */
const wordList = [
  'delete',
  'class',
  'return',
  'function',
  'interface',
  'type',
  'enum',
  'const',
  'let',
  'var',
  'myVar',
  'PetType',
  'createPet',
  'undefined',
  'null',
  'true',
  'false',
  'this',
  'super',
  'new',
  'petId',
  'orderId',
  'userId',
  '1invalid',
  '2bad',
  'validName',
]

/** Pairs of [from, to] paths used to test getRelativePath throughput. */
const pathPairs: Array<[string, string]> = [
  ['/project/src', '/project/src/gen/types.ts'],
  ['/project/src/gen', '/project/src'],
  ['/project/src', '/project/src/gen/operations/pets/createPet.ts'],
  ['/project/src/gen', '/project/src/gen/types/Pet.ts'],
  ['/project', '/project/src/gen/schemas/petSchema.ts'],
  ['/project/src/gen/types', '/project/src/gen/operations/createPet.ts'],
  ['C:\\Users\\project\\src', 'C:\\Users\\project\\src\\gen\\types.ts'],
  ['C:\\Users\\project\\src\\gen', 'C:\\Users\\project\\src'],
]

// ---------------------------------------------------------------------------
// Helper: run a function 10,000 times in a loop (reasonable batch size)
// ---------------------------------------------------------------------------

function repeat(fn: () => void, n = 10_000): void {
  for (let i = 0; i < n; i++) fn()
}

// ---------------------------------------------------------------------------
// 1. camelCase – native vs JS fallback
//    Answers: "Will camelCase really speed up the codebase?"
// ---------------------------------------------------------------------------

describe('camelCase throughput (10 000 calls / iteration)', () => {
  bench('native (Rust)', () => {
    repeat(() => {
      for (const name of operationNames) camelCase(name)
    })
  })

  bench('js fallback', () => {
    repeat(() => {
      for (const name of operationNames) camelCaseJs(name)
    })
  })
})

// ---------------------------------------------------------------------------
// 2. All string-case functions combined – native vs JS fallback
// ---------------------------------------------------------------------------

describe('all case transforms combined (10 000 calls / iteration)', () => {
  bench('native (Rust)', () => {
    repeat(() => {
      for (const name of propertyNames) {
        camelCase(name)
        pascalCase(name)
        snakeCase(name)
        screamingSnakeCase(name)
      }
    })
  })

  bench('js fallback', () => {
    repeat(() => {
      for (const name of propertyNames) {
        camelCaseJs(name)
        pascalCaseJs(name)
        snakeCaseJs(name)
        screamingSnakeCaseJs(name)
      }
    })
  })
})

// ---------------------------------------------------------------------------
// 3. transformReservedWord – native vs JS fallback
//    (O(1) HashSet in Rust vs O(1) Set in JS fallback vs original O(n) Array.includes)
// ---------------------------------------------------------------------------

describe('transformReservedWord throughput (10 000 calls / iteration)', () => {
  bench('native (Rust – O(1) HashSet)', () => {
    repeat(() => {
      for (const word of wordList) transformReservedWord(word)
    })
  })

  bench('js fallback (O(1) Set)', () => {
    repeat(() => {
      for (const word of wordList) transformReservedWordJs(word)
    })
  })
})

// ---------------------------------------------------------------------------
// 4. getRelativePath – native vs JS fallback
// ---------------------------------------------------------------------------

describe('getRelativePath throughput (10 000 calls / iteration)', () => {
  bench('native (Rust)', () => {
    repeat(() => {
      for (const [from, to] of pathPairs) getRelativePath(from, to)
    })
  })

  bench('js fallback', () => {
    repeat(() => {
      for (const [from, to] of pathPairs) getRelativePathJs(from, to)
    })
  })
})

// ---------------------------------------------------------------------------
// 5. File I/O throughput
//    Answers: "Would Rust-based reader/writer be faster?"
//
//    File reads and writes are fundamentally I/O-bound: the cost is the
//    OS kernel syscall + disk latency, which is the same whether you call
//    it from Rust or JavaScript.  Node.js already delegates I/O to libuv,
//    which uses epoll/kqueue/IOCP – the same kernel APIs Rust would use.
//
//    What we measure here: the CPU-side overhead of the write() helper
//    (trim + dedup check) vs actual disk I/O, to show that the
//    string-processing part is negligible compared to the I/O part.
// ---------------------------------------------------------------------------

describe('file I/O – CPU vs disk cost analysis', () => {
  /**
   * CPU-only: the string processing that write() does before touching the disk.
   * This represents the maximum benefit Rust could provide for file processing.
   */
  bench('CPU cost only – trim + equality check (10 000 iterations)', () => {
    const content = 'export const hello = "world"\n'.repeat(20)
    repeat(() => {
      const trimmed = content.trim()
      if (trimmed === '') return
      if (trimmed === content) return // dedup check (identity case)
    })
  })

  /**
   * Actual disk write: measures the total cost including OS syscall + disk I/O.
   * This will dominate the CPU cost by orders of magnitude.
   */
  bench('disk write – actual fs.writeFile (10 iterations)', { time: 5000 }, async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'kubb-bench-'))
    try {
      const content = 'export const hello = "world"\n'.repeat(20)
      for (let i = 0; i < 10; i++) {
        await writeFile(path.join(dir, `file${i}.ts`), content, 'utf-8')
      }
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
})
