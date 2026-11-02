import wasmBase64 from './wasm.ts'

/** The exports of `crate/src/lib.rs`. */
export type NativeExports = {
  memory: WebAssembly.Memory
  alloc(len: number): number
  dealloc(ptr: number, len: number): void
  out_ptr(): number
  convert_case(ptr: number, len: number, pascal: number): number
}

function decodeBase64(text: string): Uint8Array<ArrayBuffer> {
  const binary = typeof Buffer !== 'undefined' ? Buffer.from(text, 'base64').toString('latin1') : atob(text)
  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

function load(): NativeExports | null {
  if (globalThis.process?.env?.KUBB_NATIVE === '0') return null
  try {
    return new WebAssembly.Instance(new WebAssembly.Module(decodeBase64(wasmBase64))).exports as NativeExports
  } catch {
    // No WebAssembly, or a main browser thread that refuses to compile synchronously. The JavaScript helpers take over.
    return null
  }
}

/**
 * The Rust helpers, or `null` when the WebAssembly module cannot load or `KUBB_NATIVE=0` is set.
 * Every helper in this package checks it and falls back to its JavaScript implementation.
 */
export const native: NativeExports | null = load()

const encoder = new TextEncoder()
const decoder = new TextDecoder()

/**
 * Runs a Rust helper on `text`: writes it into wasm memory, calls `run` with that location, and reads the result
 * the helper left at `out_ptr()`. The memory buffer is re-read after every call because it detaches when it grows.
 */
export function callWithString(exports: NativeExports, text: string, run: (ptr: number, len: number) => number): string {
  const bytes = encoder.encode(text)
  const ptr = exports.alloc(bytes.length)
  new Uint8Array(exports.memory.buffer, ptr, bytes.length).set(bytes)
  const length = run(ptr, bytes.length)
  exports.dealloc(ptr, bytes.length)
  return decoder.decode(new Uint8Array(exports.memory.buffer, exports.out_ptr(), length))
}
