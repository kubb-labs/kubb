//! The output stage: what `FileManager` + `ast.factory.createFile` + `parserTs.parse` do per file.
//!
//! Ports `packages/ast/src/utils/combineFileMembers.ts`, `packages/ast/src/utils/nodeText.ts`,
//! `createFile` in `packages/ast/src/nodes/file.ts` and the printers in `packages/parser-ts/src/utils.ts`.

use std::cmp::Ordering;
use std::collections::{HashMap, HashSet};

use rayon::prelude::*;
use serde::Deserialize;
use text_rs::port::{dedent_str, indent_with, js_trim, js_trim_end};

use crate::path::{extname, relative_specifier, resolve_output_path};
use crate::{EmitOptions, EmitResult};

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FileNode {
    path: String,
    base_name: String,
    banner: Option<String>,
    footer: Option<String>,
    #[serde(default)]
    sources: Vec<Source>,
    #[serde(default)]
    imports: Vec<Import>,
    #[serde(default)]
    exports: Vec<Export>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct Source {
    name: Option<String>,
    is_exportable: Option<bool>,
    is_type_only: Option<bool>,
    nodes: Option<Vec<CodeItem>>,
}

/// Compiled plugins may still pass bare strings where a node is expected.
#[derive(Deserialize)]
#[serde(untagged)]
enum CodeItem {
    Bare(String),
    Node(CodeNode),
}

#[derive(Deserialize)]
#[serde(tag = "kind")]
enum CodeNode {
    Text {
        value: String,
    },
    Jsx {
        value: String,
    },
    Break,
    Const {
        name: String,
        export: Option<bool>,
        r#type: Option<String>,
        #[serde(rename = "JSDoc")]
        jsdoc: Option<JsDoc>,
        #[serde(rename = "asConst")]
        as_const: Option<bool>,
        nodes: Option<Vec<CodeItem>>,
    },
    Type {
        name: String,
        export: Option<bool>,
        #[serde(rename = "JSDoc")]
        jsdoc: Option<JsDoc>,
        nodes: Option<Vec<CodeItem>>,
    },
    Function(FunctionNode),
    ArrowFunction(FunctionNode),
    #[serde(other)]
    Unknown,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct FunctionNode {
    name: String,
    default: Option<bool>,
    export: Option<bool>,
    r#async: Option<bool>,
    generics: Option<Generics>,
    params: Option<String>,
    return_type: Option<String>,
    #[serde(rename = "JSDoc")]
    jsdoc: Option<JsDoc>,
    single_line: Option<bool>,
    nodes: Option<Vec<CodeItem>>,
}

#[derive(Deserialize)]
#[serde(untagged)]
enum Generics {
    One(String),
    Many(Vec<String>),
}

#[derive(Deserialize)]
struct JsDoc {
    comments: Option<Vec<Option<String>>>,
}

#[derive(Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct Import {
    name: Option<ImportName>,
    path: String,
    root: Option<String>,
    is_type_only: Option<bool>,
    is_name_space: Option<bool>,
}

#[derive(Deserialize, Clone)]
#[serde(untagged)]
enum ImportName {
    One(String),
    Many(Vec<NameItem>),
}

#[derive(Deserialize, Clone)]
#[serde(untagged)]
enum NameItem {
    Plain(String),
    Alias {
        #[serde(rename = "propertyName")]
        property_name: String,
        name: Option<String>,
    },
}

impl NameItem {
    /// The binding the item introduces: the alias when there is one, else the imported name.
    fn local(&self) -> &str {
        match self {
            NameItem::Plain(name) => name,
            NameItem::Alias {
                property_name,
                name,
            } => name.as_deref().unwrap_or(property_name),
        }
    }

    /// Identity for deduplication: a plain name and an alias object never collapse into each other.
    fn identity(&self) -> String {
        match self {
            NameItem::Plain(name) => format!("s\0{name}"),
            NameItem::Alias {
                property_name,
                name,
            } => format!("o\0{property_name}:{}", name.as_deref().unwrap_or("")),
        }
    }
}

#[derive(Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct Export {
    name: Option<ExportName>,
    path: String,
    is_type_only: Option<bool>,
    as_alias: Option<bool>,
}

#[derive(Deserialize, Clone)]
#[serde(untagged)]
enum ExportName {
    One(String),
    Many(Vec<String>),
}

/// JavaScript compares strings by UTF-16 code unit; Rust by UTF-8 byte. They only disagree outside ASCII.
fn cmp_js(a: &str, b: &str) -> Ordering {
    if a.is_ascii() && b.is_ascii() {
        a.cmp(b)
    } else {
        a.encode_utf16().cmp(b.encode_utf16())
    }
}

/// Port of `sortKey`: non-array names first, type-only before value, then specifier, unnamed before named.
fn sort_key(is_array: bool, type_only: bool, specifier: &str, name: Option<String>) -> String {
    format!(
        "{}:{}:{specifier}:{}:{}",
        u8::from(is_array),
        u8::from(!type_only),
        u8::from(name.is_some()),
        name.unwrap_or_default()
    )
}

fn sorted_join(mut names: Vec<&str>) -> String {
    names.sort_by(|a, b| cmp_js(a, b));
    names.join("\0")
}

fn sort_members<T>(nodes: Vec<T>, key: impl Fn(&T) -> String) -> Vec<T> {
    let mut keyed: Vec<(String, T)> = nodes.into_iter().map(|node| (key(&node), node)).collect();
    keyed.sort_by(|a, b| cmp_js(&a.0, &b.0));
    keyed.into_iter().map(|(_, node)| node).collect()
}

/// Port of `combineExports`.
fn combine_exports(exports: Vec<Export>) -> Vec<Export> {
    let sorted = sort_members(exports, |node| {
        let name = match &node.name {
            Some(ExportName::Many(names)) => {
                Some(sorted_join(names.iter().map(String::as_str).collect()))
            }
            Some(ExportName::One(name)) => Some(name.clone()),
            None => None,
        };
        sort_key(
            matches!(node.name, Some(ExportName::Many(_))),
            node.is_type_only.unwrap_or(false),
            &node.path,
            name,
        )
    });

    let mut result: Vec<Export> = Vec::new();
    let mut by_path: HashMap<String, (usize, HashSet<String>)> = HashMap::new();
    let mut seen: HashSet<String> = HashSet::new();

    for curr in sorted {
        let type_only = curr.is_type_only.unwrap_or(false);
        match &curr.name {
            Some(ExportName::Many(names)) => {
                if names.is_empty() {
                    continue;
                }
                let key = format!("{}:{type_only}", curr.path);
                if !by_path.contains_key(&key) {
                    by_path.insert(key.clone(), (result.len(), HashSet::new()));
                    result.push(Export {
                        name: Some(ExportName::Many(Vec::new())),
                        ..curr.clone()
                    });
                }
                let (index, known) = by_path.get_mut(&key).expect("INFALLIBLE: inserted above");
                let Some(ExportName::Many(target)) = &mut result[*index].name else {
                    continue;
                };
                for name in names {
                    if known.insert(name.clone()) {
                        target.push(name.clone());
                    }
                }
            }
            other => {
                let name = match other {
                    Some(ExportName::One(name)) => name.as_str(),
                    _ => "",
                };
                let alias = curr
                    .as_alias
                    .map(|alias| alias.to_string())
                    .unwrap_or_default();
                if seen.insert(format!("{}:{name}:{type_only}:{alias}", curr.path)) {
                    result.push(curr);
                }
            }
        }
    }
    result
}

/// Port of `combineImports`: dedupes, merges names per path and drops what `source` never references.
fn combine_imports(imports: Vec<Import>, exports: &[Export], source: Option<&str>) -> Vec<Import> {
    let mut exported: HashSet<&str> = HashSet::new();
    for export in exports {
        match &export.name {
            Some(ExportName::Many(names)) => exported.extend(names.iter().map(String::as_str)),
            Some(ExportName::One(name)) if !name.is_empty() => {
                exported.insert(name);
            }
            _ => {}
        }
    }
    let is_used =
        |name: &str| source.is_none_or(|text| text.contains(name)) || exported.contains(name);

    let mut paths_with_used_named: HashSet<String> = HashSet::new();
    for node in &imports {
        if let Some(ImportName::Many(names)) = &node.name
            && names.iter().any(|item| is_used(item.local()))
        {
            paths_with_used_named.insert(node.path.clone());
        }
    }

    let sorted = sort_members(imports, |node| {
        let specifier = match &node.root {
            Some(root) if !root.is_empty() => relative_specifier(root, &node.path),
            _ => node.path.clone(),
        };
        let name = match &node.name {
            // `toSorted().join()` stringifies alias objects, so they all sort and print as `[object Object]`.
            Some(ImportName::Many(names)) => Some(sorted_join(
                names
                    .iter()
                    .map(|item| {
                        if let NameItem::Plain(name) = item {
                            name.as_str()
                        } else {
                            "[object Object]"
                        }
                    })
                    .collect(),
            )),
            Some(ImportName::One(name)) => Some(name.clone()),
            None => None,
        };
        sort_key(
            matches!(node.name, Some(ImportName::Many(_))),
            node.is_type_only.unwrap_or(false),
            &specifier,
            name,
        )
    });

    let mut result: Vec<Import> = Vec::new();
    let mut by_path: HashMap<String, (usize, HashSet<String>)> = HashMap::new();
    let mut seen: HashSet<String> = HashSet::new();

    for curr in sorted {
        if curr.root.as_deref() == Some(curr.path.as_str()) {
            continue;
        }
        let type_only = curr.is_type_only.unwrap_or(false);
        match &curr.name {
            Some(ImportName::Many(names)) => {
                let mut local_seen: HashSet<String> = HashSet::new();
                let names: Vec<&NameItem> = names
                    .iter()
                    .filter(|item| local_seen.insert(item.identity()))
                    .filter(|item| is_used(item.local()))
                    .collect();
                if names.is_empty() {
                    continue;
                }
                let key = format!("{}:{type_only}", curr.path);
                if !by_path.contains_key(&key) {
                    by_path.insert(key.clone(), (result.len(), HashSet::new()));
                    result.push(Import {
                        name: Some(ImportName::Many(Vec::new())),
                        ..curr.clone()
                    });
                }
                let (index, known) = by_path.get_mut(&key).expect("INFALLIBLE: inserted above");
                let Some(ImportName::Many(target)) = &mut result[*index].name else {
                    continue;
                };
                for item in names {
                    if known.insert(item.identity()) {
                        target.push(item.clone());
                    }
                }
            }
            Some(ImportName::One(name)) => {
                if !is_used(name) && !paths_with_used_named.contains(&curr.path) {
                    continue;
                }
                if seen.insert(format!("{}:{name}:{type_only}", curr.path)) {
                    result.push(curr);
                }
            }
            // An import without a name is not a valid `ImportNode`; the original prints `undefined` for it.
            None => {}
        }
    }
    result
}

/// Port of `combineSources`. Unnamed sources always stay: object identity does not survive the bridge.
fn combine_sources(sources: Vec<Source>) -> Vec<Source> {
    let mut seen: HashSet<String> = HashSet::new();
    sources
        .into_iter()
        .filter(|source| match &source.name {
            Some(name) => seen.insert(format!(
                "{name}:{}:{}",
                source.is_exportable.unwrap_or(false),
                source.is_type_only.unwrap_or(false)
            )),
            None => true,
        })
        .collect()
}

/// Port of `getNodeText`: every string a code tree holds, for the unused-import check.
fn node_text(nodes: &[CodeItem]) -> String {
    let mut collected: Vec<String> = Vec::new();
    for item in nodes {
        let node = match item {
            CodeItem::Bare(text) => {
                if !text.is_empty() {
                    collected.push(text.clone());
                }
                continue;
            }
            CodeItem::Node(node) => node,
        };
        let mut parts: Vec<String> = Vec::new();
        fn push(parts: &mut Vec<String>, value: Option<&str>) {
            if let Some(value) = value.filter(|value| !value.is_empty()) {
                parts.push(value.to_string());
            }
        }
        let nested = match node {
            CodeNode::Break | CodeNode::Unknown => continue,
            CodeNode::Text { value } | CodeNode::Jsx { value } => {
                push(&mut parts, Some(value));
                None
            }
            CodeNode::Const { r#type, nodes, .. } => {
                push(&mut parts, r#type.as_deref());
                nodes.as_ref()
            }
            CodeNode::Type { nodes, .. } => nodes.as_ref(),
            CodeNode::Function(function) | CodeNode::ArrowFunction(function) => {
                push(&mut parts, function.params.as_deref());
                match &function.generics {
                    Some(Generics::One(generics)) => push(&mut parts, Some(generics)),
                    // An array joins unconditionally in the original, even to an empty string.
                    Some(Generics::Many(generics)) => parts.push(generics.join(", ")),
                    None => {}
                }
                push(&mut parts, function.return_type.as_deref());
                function.nodes.as_ref()
            }
        };
        if let Some(nested) = nested
            .map(|nodes| node_text(nodes))
            .filter(|text| !text.is_empty())
        {
            parts.push(nested);
        }
        if !parts.is_empty() {
            collected.push(parts.join("\n"));
        }
    }
    collected.join("\n")
}

/// Port of `printNodes`: a `Break` widens the next separator to a blank line.
fn print_nodes(nodes: Option<&Vec<CodeItem>>, separator: &str) -> String {
    let mut result = String::new();
    let mut pending_break = false;
    for item in nodes.into_iter().flatten() {
        let CodeItem::Node(node) = item else { continue };
        if matches!(node, CodeNode::Break) {
            pending_break = !result.is_empty();
            continue;
        }
        let text = print_code_node(node);
        if text.is_empty() {
            continue;
        }
        if !result.is_empty() {
            result.push_str(if pending_break { "\n\n" } else { separator });
        }
        result.push_str(&text);
        pending_break = false;
    }
    result
}

fn print_jsdoc(jsdoc: Option<&JsDoc>) -> String {
    let lines: Vec<String> = jsdoc
        .and_then(|doc| doc.comments.as_ref())
        .into_iter()
        .flatten()
        .flatten()
        .flat_map(|comment| comment.split('\n'))
        .map(|line| line.replace("*/", "* /").replace('\r', ""))
        .filter(|line| !js_trim(line).is_empty())
        .collect();
    if lines.is_empty() {
        return String::new();
    }
    let mut out = String::from("/**");
    for line in lines {
        out.push_str("\n * ");
        out.push_str(&line);
    }
    out.push_str("\n */");
    out
}

fn with_jsdoc(jsdoc: Option<&JsDoc>, declaration: String) -> String {
    let doc = print_jsdoc(jsdoc);
    if doc.is_empty() {
        declaration
    } else {
        format!("{doc}\n{declaration}")
    }
}

fn flag(value: Option<bool>, text: &'static str) -> &'static str {
    if value.unwrap_or(false) { text } else { "" }
}

/// Port of `signature`: `<T>(params): ReturnType`, an async function wraps its return type in `Promise<>`.
fn signature(function: &FunctionNode) -> String {
    let generics = match &function.generics {
        Some(Generics::One(generics)) if !generics.is_empty() => format!("<{generics}>"),
        Some(Generics::Many(generics)) => format!("<{}>", generics.join(", ")),
        _ => String::new(),
    };
    let return_type = match function
        .return_type
        .as_deref()
        .filter(|value| !value.is_empty())
    {
        Some(value) if function.r#async.unwrap_or(false) => format!(": Promise<{value}>"),
        Some(value) => format!(": {value}"),
        None => String::new(),
    };
    format!(
        "{generics}({}){return_type}",
        function.params.as_deref().unwrap_or("")
    )
}

fn print_code_node(node: &CodeNode) -> String {
    match node {
        CodeNode::Break | CodeNode::Unknown => String::new(),
        CodeNode::Text { value } | CodeNode::Jsx { value } => dedent_str(value),
        CodeNode::Const {
            name,
            export,
            r#type,
            jsdoc,
            as_const,
            nodes,
        } => {
            let annotation = r#type
                .as_deref()
                .filter(|value| !value.is_empty())
                .map(|value| format!(": {value}"))
                .unwrap_or_default();
            let declaration = format!(
                "{}const {name}{annotation} = {}{}",
                flag(*export, "export "),
                print_nodes(nodes.as_ref(), "\n"),
                flag(*as_const, " as const")
            );
            with_jsdoc(jsdoc.as_ref(), declaration)
        }
        CodeNode::Type {
            name,
            export,
            jsdoc,
            nodes,
        } => with_jsdoc(
            jsdoc.as_ref(),
            format!(
                "{}type {name} = {}",
                flag(*export, "export "),
                print_nodes(nodes.as_ref(), "\n")
            ),
        ),
        CodeNode::Function(function) => {
            let body = indent_with(&print_nodes(function.nodes.as_ref(), "\n"), "  ");
            let body = if body.is_empty() {
                String::new()
            } else {
                format!("\n{body}\n")
            };
            let declaration = format!(
                "{}{}{}function {}{} {{{body}}}",
                flag(function.export, "export "),
                flag(function.default, "default "),
                flag(function.r#async, "async "),
                function.name,
                signature(function)
            );
            with_jsdoc(function.jsdoc.as_ref(), declaration)
        }
        CodeNode::ArrowFunction(function) => {
            let body = print_nodes(function.nodes.as_ref(), "\n");
            let arrow = if function.single_line.unwrap_or(false) {
                format!(" => {body}")
            } else if body.is_empty() {
                " => {}".to_string()
            } else {
                format!(" => {{\n{}\n}}", indent_with(&body, "  "))
            };
            let declaration = format!(
                "{}{}const {} = {}{}{arrow}",
                flag(function.export, "export "),
                flag(function.default, "default "),
                function.name,
                flag(function.r#async, "async "),
                signature(function)
            );
            with_jsdoc(function.jsdoc.as_ref(), declaration)
        }
    }
}

fn quote_module_path(path: &str) -> String {
    format!("'{}'", path.replace('\\', "\\\\").replace('\'', "\\'"))
}

fn print_import(import: &Import, path: &str) -> String {
    let type_prefix = flag(import.is_type_only, "type ");
    let from = quote_module_path(path);
    match &import.name {
        Some(ImportName::Many(names)) => {
            let specifiers: Vec<String> = names
                .iter()
                .map(|item| match item {
                    NameItem::Plain(name) => name.clone(),
                    NameItem::Alias {
                        property_name,
                        name: Some(name),
                    } if !name.is_empty() => format!("{property_name} as {name}"),
                    NameItem::Alias { property_name, .. } => property_name.clone(),
                })
                .collect();
            format!(
                "import {type_prefix}{{ {} }} from {from}",
                specifiers.join(", ")
            )
        }
        Some(ImportName::One(name)) if import.is_name_space.unwrap_or(false) => {
            format!("import {type_prefix}* as {name} from {from}")
        }
        Some(ImportName::One(name)) => format!("import {type_prefix}{name} from {from}"),
        None => format!("import {type_prefix}undefined from {from}"),
    }
}

fn print_export(export: &Export, path: &str) -> String {
    let type_prefix = flag(export.is_type_only, "type ");
    let from = quote_module_path(path);
    match &export.name {
        Some(ExportName::Many(names)) => {
            format!("export {type_prefix}{{ {} }} from {from}", names.join(", "))
        }
        Some(ExportName::One(name)) if !name.is_empty() && export.as_alias.unwrap_or(false) => {
            // An identifier cannot start with a digit, so the digit becomes `_`.
            let mut chars = name.chars();
            let parsed = match chars.next() {
                Some(first) if first.is_ascii_digit() => format!("_{}", chars.as_str()),
                _ => name.clone(),
            };
            format!("export {type_prefix}* as {parsed} from {from}")
        }
        Some(ExportName::One(name)) if !name.is_empty() => {
            format!("export {type_prefix}{{ {name} }} from {from}")
        }
        _ => format!("export {type_prefix}* from {from}"),
    }
}

/// `createFile` followed by `parserTs.parse`: one raw, merged file in, its source text out.
pub fn print_file(file: FileNode, extension: &HashMap<String, String>) -> String {
    let new_extname = extension
        .get(extname(&file.base_name))
        .map(String::as_str)
        .unwrap_or("");
    let exports = combine_exports(file.exports);
    let sources = combine_sources(file.sources);

    let imports = if file.imports.is_empty() {
        Vec::new()
    } else {
        let mut parts: Vec<String> = Vec::new();
        let mut local_names: HashSet<&str> = HashSet::new();
        for source in &sources {
            let text = source
                .nodes
                .as_ref()
                .map(|nodes| node_text(nodes))
                .unwrap_or_default();
            if !text.is_empty() {
                parts.push(text);
            }
            if let Some(name) = source.name.as_deref().filter(|name| !name.is_empty()) {
                local_names.insert(name);
            }
        }
        let text = parts.join("\n");
        let combined = combine_imports(
            file.imports,
            &exports,
            (!text.is_empty()).then_some(text.as_str()),
        );
        // `mode: 'file'` can put a symbol's definition and an import of it in the same file.
        combined
            .into_iter()
            .filter_map(|mut import| {
                if import.path == file.path {
                    return None;
                }
                match &mut import.name {
                    Some(ImportName::One(name)) if local_names.contains(name.as_str()) => None,
                    Some(ImportName::Many(names)) => {
                        names.retain(|item| !local_names.contains(item.local()));
                        (!names.is_empty()).then_some(import)
                    }
                    _ => Some(import),
                }
            })
            .collect()
    };

    let source = sources
        .iter()
        .map(|source| print_nodes(source.nodes.as_ref(), "\n\n"))
        .filter(|text| !text.is_empty())
        .map(|text| js_trim_end(&text).to_string())
        .collect::<Vec<_>>()
        .join("\n\n");

    let mut lines: Vec<String> = Vec::with_capacity(imports.len() + exports.len());
    for import in &imports {
        let path = match import.root.as_deref().filter(|root| !root.is_empty()) {
            Some(root) => {
                resolve_output_path(&relative_specifier(root, &import.path), new_extname, true)
            }
            None => import.path.clone(),
        };
        lines.push(print_import(import, &path));
    }
    for export in &exports {
        lines.push(print_export(
            export,
            &resolve_output_path(&export.path, new_extname, export.path.starts_with('.')),
        ));
    }
    let block = lines.join("\n");

    [
        file.banner.as_deref(),
        Some(block.as_str()),
        Some(source.as_str()),
        file.footer.as_deref(),
    ]
    .into_iter()
    .flatten()
    .filter(|part| !part.is_empty())
    .map(js_trim_end)
    .collect::<Vec<_>>()
    .join("\n\n")
}

/// Path, printed source (empty when written to disk) and whether the disk already held it.
type Emitted = Option<(String, String, bool)>;

enum Outcome {
    Written,
    Unchanged,
}

/// Port of `write` in `internals/utils/src/fs.ts`: trimmed content plus one newline, skipped when the disk already holds it.
fn write_changed(path: &str, source: &str, cleaned: bool) -> Result<Outcome, String> {
    let trimmed = js_trim(source);
    if !cleaned
        && let Ok(stored) = std::fs::read_to_string(path)
        && js_trim(&stored) == trimmed
    {
        return Ok(Outcome::Unchanged);
    }
    let content = format!("{trimmed}\n");
    let target = std::path::Path::new(path);
    if std::fs::write(target, &content).is_err() {
        if let Some(parent) = target.parent() {
            std::fs::create_dir_all(parent)
                .map_err(|error| format!("Cannot create {}: {error}", parent.display()))?;
        }
        std::fs::write(target, &content)
            .map_err(|error| format!("Cannot write {path}: {error}"))?;
    }
    Ok(Outcome::Written)
}

pub fn emit_files(files_json: &str, options: &EmitOptions) -> Result<EmitResult, String> {
    let files: Vec<FileNode> = serde_json::from_str(files_json)
        .map_err(|error| format!("Cannot read the generated files: {error}"))?;
    let cleaned = options
        .cleaned
        .as_deref()
        .map(|dir| format!("{}/", dir.trim_end_matches('/')));

    // Each file is independent, so printing and writing fan out over every core.
    let printed: Vec<Result<Emitted, String>> = files
        .into_par_iter()
        .map(|file| {
            let path = file.path.clone();
            let source = print_file(file, &options.extension);
            if js_trim(&source).is_empty() {
                return Ok(None);
            }
            if !options.write {
                return Ok(Some((path, source, false)));
            }
            let in_cleaned = cleaned.as_deref().is_some_and(|dir| path.starts_with(dir));
            let outcome = write_changed(&path, &source, in_cleaned)?;
            Ok(Some((
                path,
                String::new(),
                matches!(outcome, Outcome::Unchanged),
            )))
        })
        .collect();

    let mut result = EmitResult {
        paths: Vec::new(),
        sources: Vec::new(),
        unchanged: Vec::new(),
    };
    for entry in printed {
        let Some((path, source, unchanged)) = entry? else {
            continue;
        };
        if unchanged {
            result.unchanged.push(path.clone());
        }
        if !options.write {
            result.sources.push(source);
        }
        result.paths.push(path);
    }
    Ok(result)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn print(json: &str) -> String {
        let file: FileNode = serde_json::from_str(json).unwrap();
        print_file(file, &HashMap::new())
    }

    #[test]
    fn merges_imports_per_path_and_drops_unused() {
        let out = print(
            r#"{"path":"/gen/a.ts","baseName":"a.ts","banner":"// banner",
            "imports":[
              {"name":["Pet"],"path":"/gen/types/Pet.ts","root":"/gen/a.ts","isTypeOnly":true},
              {"name":["Tag","Pet"],"path":"/gen/types/Pet.ts","root":"/gen/a.ts","isTypeOnly":true},
              {"name":["z"],"path":"zod"},
              {"name":"client","path":"./client.ts"}],
            "sources":[{"name":"getPet","nodes":[{"kind":"Function","name":"getPet","export":true,"async":true,"returnType":"Pet","nodes":[{"kind":"Text","value":"  return client<Pet>()"}]}]}]}"#,
        );
        assert_eq!(
            out,
            "// banner\n\nimport client from './client.ts'\nimport type { Pet } from './types/Pet'\n\nexport async function getPet(): Promise<Pet> {\n  return client<Pet>()\n}"
        );
    }

    #[test]
    fn breaks_widen_the_separator() {
        let out = print(
            r#"{"path":"/gen/b.ts","baseName":"b.ts","sources":[{"nodes":[{"kind":"Text","value":"a"},{"kind":"Break"},{"kind":"Break"},{"kind":"Type","name":"B","export":true,"JSDoc":{"comments":["@deprecated",null]},"nodes":[{"kind":"Text","value":"string"}]}]}],
            "exports":[{"name":["x","y"],"path":"./x.ts"},{"name":["y","z"],"path":"./x.ts"}]}"#,
        );
        assert_eq!(
            out,
            "export { x, y, z } from './x'\n\na\n\n/**\n * @deprecated\n */\nexport type B = string"
        );
    }
}
