# @kubb/native

Helpers that Kubb core and every plugin share through `@kubb/kit`. Each helper has a JavaScript implementation and a Rust one in `crate/src/lib.rs`, compiled to WebAssembly and embedded in `src/wasm.ts`. The Rust version runs when the module loads and the JavaScript version takes over otherwise, so callers never notice the difference.

Set `KUBB_NATIVE=0` to force the JavaScript implementations.

## Adding a helper

1. Write the JavaScript version first. It is the reference behavior.
2. Add the Rust version to `crate/src/lib.rs` as a `#[no_mangle] extern "C"` function that reads its input from `ptr`/`len`, writes its result with `reply`, and returns the result's byte length. Add it to `NativeExports` in `src/loader.ts`.
3. Route the exported helper through `native` with the JavaScript version as the fallback, as `src/convertCase.ts` does.
4. Add the inputs that matter to the comparison test in `src/casing.test.ts`, so both versions stay in step.
5. Run `pnpm build:native` and commit the regenerated `src/wasm.ts`. The npm build needs no Rust toolchain.

Building needs `rustup target add wasm32-unknown-unknown`.
