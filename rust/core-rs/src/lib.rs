//! Proof of concept for a Rust core under TypeScript plugins.
//!
//! Two stages cross the bridge once per build, never once per node:
//! - `load_spec`: read and parse the OpenAPI file, hand the document to the TypeScript adapter.
//! - `emit_files`: take every file the plugins generated, dedupe imports, print and write on all cores.

use napi_derive::napi;

// The output stage allocates on every core at once; the system allocator made that slower than one thread.
#[global_allocator]
static GLOBAL: mimalloc::MiMalloc = mimalloc::MiMalloc;

// The napi macros expand to `unsafe`, so the ban sits on the modules that hold the logic.
#[forbid(unsafe_code)]
pub mod emit;
#[forbid(unsafe_code)]
pub mod load;
#[forbid(unsafe_code)]
pub mod path;

/// Reads a YAML or JSON spec and returns it as JSON text for `JSON.parse`.
#[napi]
pub fn load_spec(path: String) -> napi::Result<String> {
    load::load_spec(&path).map_err(napi::Error::from_reason)
}

#[napi(object)]
pub struct EmitOptions {
    /// Extension written on relative import and export specifiers, per file extension. Missing means dropped.
    pub extension: std::collections::HashMap<String, String>,
    /// Write to disk. When false, the printed sources come back instead.
    pub write: bool,
    /// Directory that was just emptied: files under it need no read-before-write.
    pub cleaned: Option<String>,
}

#[napi(object)]
pub struct EmitResult {
    /// Paths of the files that printed to something, in input order.
    pub paths: Vec<String>,
    /// Printed sources, parallel to `paths`. Empty when `write` is true.
    pub sources: Vec<String>,
    /// Paths left untouched because the disk already held the same content.
    pub unchanged: Vec<String>,
}

/// Normalizes, prints and (optionally) writes the files serialized in `files_json`.
#[napi]
pub fn emit_files(files_json: String, options: EmitOptions) -> napi::Result<EmitResult> {
    emit::emit_files(&files_json, &options).map_err(napi::Error::from_reason)
}
