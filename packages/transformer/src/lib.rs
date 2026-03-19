#![deny(clippy::all)]

use napi_derive::napi;
use std::collections::HashSet;
use std::sync::OnceLock;

use regex::Regex;

// ---------------------------------------------------------------------------
// Compiled regex accessors (compiled once, reused across calls)
// ---------------------------------------------------------------------------

fn re_camel_lower_to_upper() -> &'static Regex {
  static RE: OnceLock<Regex> = OnceLock::new();
  RE.get_or_init(|| Regex::new(r"([a-z\d])([A-Z])").unwrap())
}

fn re_consecutive_upper_to_lower() -> &'static Regex {
  static RE: OnceLock<Regex> = OnceLock::new();
  RE.get_or_init(|| Regex::new(r"([A-Z]+)([A-Z][a-z])").unwrap())
}

fn re_digit_to_lower() -> &'static Regex {
  static RE: OnceLock<Regex> = OnceLock::new();
  RE.get_or_init(|| Regex::new(r"(\d)([a-z])").unwrap())
}

fn re_word_separators() -> &'static Regex {
  static RE: OnceLock<Regex> = OnceLock::new();
  // Matches: whitespace, hyphen, underscore, dot, forward-slash, backslash, colon
  RE.get_or_init(|| Regex::new(r"[\s\-_./\\:]+").unwrap())
}

fn re_non_alnum() -> &'static Regex {
  static RE: OnceLock<Regex> = OnceLock::new();
  RE.get_or_init(|| Regex::new(r"[^a-zA-Z0-9]").unwrap())
}

fn re_snake_camel_boundary() -> &'static Regex {
  static RE: OnceLock<Regex> = OnceLock::new();
  RE.get_or_init(|| Regex::new(r"([a-z])([A-Z])").unwrap())
}

fn re_snake_separators() -> &'static Regex {
  static RE: OnceLock<Regex> = OnceLock::new();
  // Matches: whitespace, hyphen, dot
  RE.get_or_init(|| Regex::new(r"[\s.\-]+").unwrap())
}

fn re_non_alnum_underscore() -> &'static Regex {
  static RE: OnceLock<Regex> = OnceLock::new();
  RE.get_or_init(|| Regex::new(r"[^a-zA-Z0-9_]").unwrap())
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/// Uppercases the first character of `s`, leaving the rest unchanged.
fn capitalize_first(s: &str) -> String {
  let mut chars = s.chars();
  match chars.next() {
    None => String::new(),
    Some(c) => {
      let upper: String = c.to_uppercase().collect();
      upper + chars.as_str()
    }
  }
}

/// Lowercases the first character of `s`, leaving the rest unchanged.
fn lowercase_first(s: &str) -> String {
  let mut chars = s.chars();
  match chars.next() {
    None => String::new(),
    Some(c) => {
      let lower: String = c.to_lowercase().collect();
      lower + chars.as_str()
    }
  }
}

/// Shared implementation for camelCase and PascalCase conversion.
///
/// Replicates the JavaScript behaviour in `internals/utils/src/casing.ts`:
/// 1. Insert spaces at camelCase word boundaries.
/// 2. Split on whitespace / hyphens / underscores / dots / slashes / colons.
/// 3. Capitalise each word (or lowercase the first word when `pascal = false`).
/// 4. All-uppercase acronyms (e.g. "HTML") are preserved unchanged.
/// 5. Strip non-alphanumeric characters from the final result.
fn to_camel_or_pascal(text: &str, pascal: bool) -> String {
  let trimmed = text.trim();

  // Step 1 – normalise: insert spaces at camelCase boundaries
  let step1 = re_camel_lower_to_upper()
    .replace_all(trimmed, "$1 $2")
    .into_owned();
  let step2 = re_consecutive_upper_to_lower()
    .replace_all(&step1, "$1 $2")
    .into_owned();
  let step3 = re_digit_to_lower()
    .replace_all(&step2, "$1 $2")
    .into_owned();

  // Step 2 – split on word boundaries
  let words: Vec<&str> = re_word_separators()
    .split(&step3)
    .filter(|w| !w.is_empty())
    .collect();

  // Step 3 – capitalise each word
  let result: String = words
    .iter()
    .enumerate()
    .map(|(i, word)| {
      let all_upper = word.len() > 1 && word.to_uppercase() == *word;
      if all_upper {
        // Preserve acronyms (HTML, HTTPS, etc.)
        word.to_string()
      } else if i == 0 && !pascal {
        lowercase_first(word)
      } else {
        capitalize_first(word)
      }
    })
    .collect();

  // Step 4 – strip non-alphanumeric characters
  re_non_alnum().replace_all(&result, "").into_owned()
}

/// Splits `text` on `.` and applies `transform_part` to each segment,
/// then joins the results with `/` (file-path mode).
fn apply_to_file_parts(text: &str, transform_part: impl Fn(&str, bool) -> String) -> String {
  let parts: Vec<&str> = text.split('.').collect();
  let len = parts.len();
  parts
    .iter()
    .enumerate()
    .map(|(i, part)| transform_part(part, i == len - 1))
    .collect::<Vec<_>>()
    .join("/")
}

// ---------------------------------------------------------------------------
// NAPI-RS exported types
// ---------------------------------------------------------------------------

/// Options shared by `camelCase` and `pascalCase`.
#[napi(object)]
pub struct CaseOptions {
  /// When `true`, dot-separated segments are split on `.` and joined with `/` after casing.
  pub is_file: Option<bool>,
  /// Text prepended before casing is applied.
  pub prefix: Option<String>,
  /// Text appended before casing is applied.
  pub suffix: Option<String>,
}

/// Options for `snakeCase` and `screamingSnakeCase`.
#[napi(object)]
pub struct SnakeCaseOptions {
  /// Text prepended before casing is applied.
  pub prefix: Option<String>,
  /// Text appended before casing is applied.
  pub suffix: Option<String>,
}

// ---------------------------------------------------------------------------
// NAPI-RS exported functions
// ---------------------------------------------------------------------------

/// Converts `text` to camelCase.
///
/// When `isFile` is `true`, dot-separated segments are each cased independently
/// and joined with `/`.
///
/// @example
/// ```js
/// camelCase('hello-world')                   // 'helloWorld'
/// camelCase('pet.petId', { isFile: true })   // 'pet/petId'
/// ```
#[napi(js_name = "camelCase")]
pub fn camel_case(text: String, options: Option<CaseOptions>) -> String {
  let is_file = options.as_ref().and_then(|o| o.is_file).unwrap_or(false);
  let prefix = options
    .as_ref()
    .and_then(|o| o.prefix.as_deref())
    .unwrap_or("")
    .to_owned();
  let suffix = options
    .as_ref()
    .and_then(|o| o.suffix.as_deref())
    .unwrap_or("")
    .to_owned();

  if is_file {
    apply_to_file_parts(&text, |part, is_last| {
      if is_last {
        to_camel_or_pascal(&format!("{prefix} {part} {suffix}"), false)
      } else {
        to_camel_or_pascal(part, false)
      }
    })
  } else {
    to_camel_or_pascal(&format!("{prefix} {text} {suffix}"), false)
  }
}

/// Converts `text` to PascalCase.
///
/// When `isFile` is `true`, the last dot-separated segment is PascalCased
/// and earlier segments are camelCased.
///
/// @example
/// ```js
/// pascalCase('hello-world')                  // 'HelloWorld'
/// pascalCase('pet.petId', { isFile: true })  // 'pet/PetId'
/// ```
#[napi(js_name = "pascalCase")]
pub fn pascal_case(text: String, options: Option<CaseOptions>) -> String {
  let is_file = options.as_ref().and_then(|o| o.is_file).unwrap_or(false);
  let prefix = options
    .as_ref()
    .and_then(|o| o.prefix.as_deref())
    .unwrap_or("")
    .to_owned();
  let suffix = options
    .as_ref()
    .and_then(|o| o.suffix.as_deref())
    .unwrap_or("")
    .to_owned();

  if is_file {
    apply_to_file_parts(&text, |part, is_last| {
      if is_last {
        to_camel_or_pascal(&format!("{prefix} {part} {suffix}"), true)
      } else {
        to_camel_or_pascal(part, false)
      }
    })
  } else {
    to_camel_or_pascal(&format!("{prefix} {text} {suffix}"), true)
  }
}

/// Converts `text` to snake_case.
///
/// @example
/// ```js
/// snakeCase('helloWorld')  // 'hello_world'
/// snakeCase('Hello-World') // 'hello_world'
/// ```
#[napi(js_name = "snakeCase")]
pub fn snake_case(text: String, options: Option<SnakeCaseOptions>) -> String {
  let prefix = options
    .as_ref()
    .and_then(|o| o.prefix.as_deref())
    .unwrap_or("")
    .to_owned();
  let suffix = options
    .as_ref()
    .and_then(|o| o.suffix.as_deref())
    .unwrap_or("")
    .to_owned();

  let combined = format!("{prefix} {text} {suffix}");
  let processed = combined.trim();

  let step1 = re_snake_camel_boundary()
    .replace_all(processed, "${1}_${2}")
    .into_owned();
  let step2 = re_snake_separators()
    .replace_all(&step1, "_")
    .into_owned();
  let step3 = re_non_alnum_underscore()
    .replace_all(&step2, "")
    .into_owned();

  let lowered = step3.to_lowercase();

  lowered
    .split('_')
    .filter(|s| !s.is_empty())
    .collect::<Vec<_>>()
    .join("_")
}

/// Converts `text` to SCREAMING_SNAKE_CASE.
///
/// @example
/// ```js
/// screamingSnakeCase('helloWorld') // 'HELLO_WORLD'
/// ```
#[napi(js_name = "screamingSnakeCase")]
pub fn screaming_snake_case(text: String, options: Option<SnakeCaseOptions>) -> String {
  snake_case(text, options).to_uppercase()
}

// ---------------------------------------------------------------------------
// Reserved-word transformation
// ---------------------------------------------------------------------------

/// Returns a reference to the static set of JavaScript/Java reserved words.
/// Compiled once with `OnceLock`; O(1) average lookup thereafter.
fn reserved_words() -> &'static HashSet<&'static str> {
  static SET: OnceLock<HashSet<&'static str>> = OnceLock::new();
  SET.get_or_init(|| {
    [
      "abstract",
      "arguments",
      "boolean",
      "break",
      "byte",
      "case",
      "catch",
      "char",
      "class",
      "const",
      "continue",
      "debugger",
      "default",
      "delete",
      "do",
      "double",
      "else",
      "enum",
      "eval",
      "export",
      "extends",
      "false",
      "final",
      "finally",
      "float",
      "for",
      "function",
      "goto",
      "if",
      "implements",
      "import",
      "in",
      "instanceof",
      "int",
      "interface",
      "let",
      "long",
      "native",
      "new",
      "null",
      "package",
      "private",
      "protected",
      "public",
      "return",
      "short",
      "static",
      "super",
      "switch",
      "synchronized",
      "this",
      "throw",
      "throws",
      "transient",
      "true",
      "try",
      "typeof",
      "var",
      "void",
      "volatile",
      "while",
      "with",
      "yield",
      "Array",
      "Date",
      "hasOwnProperty",
      "Infinity",
      "isFinite",
      "isNaN",
      "isPrototypeOf",
      "length",
      "Math",
      "name",
      "NaN",
      "Number",
      "Object",
      "prototype",
      "String",
      "toString",
      "undefined",
      "valueOf",
    ]
    .into()
  })
}

/// Prefixes `word` with `_` when it is a reserved JavaScript/Java identifier
/// or starts with a digit (ASCII 0–9).
///
/// Replicates `transformReservedWord` from `internals/utils/src/reserved.ts`
/// but uses an O(1) hash-set lookup instead of O(n) `Array.includes()`.
///
/// @example
/// ```js
/// transformReservedWord('delete')  // '_delete'
/// transformReservedWord('1test')   // '_1test'
/// transformReservedWord('myVar')   // 'myVar'
/// ```
#[napi(js_name = "transformReservedWord")]
pub fn transform_reserved_word(word: String) -> String {
  if word.is_empty() {
    return word;
  }
  let first = word.as_bytes()[0];
  // Digit: ASCII '0'=48 … '9'=57
  if (48..=57).contains(&first) || reserved_words().contains(word.as_str()) {
    format!("_{word}")
  } else {
    word
  }
}

// ---------------------------------------------------------------------------
// Path utilities
// ---------------------------------------------------------------------------

/// Converts all backslashes to forward slashes.
/// Extended-length Windows paths (`\\?\...`) are left unchanged.
fn to_slash(p: &str) -> String {
  if p.starts_with(r"\\?\") {
    p.to_owned()
  } else {
    p.replace('\\', "/")
  }
}

/// Replicates `node:path/posix`'s `relative(from, to)`:
/// finds the relative path from `from` to `to` using forward slashes only.
fn posix_relative(from: &str, to: &str) -> String {
  // Normalise: split on '/' and drop empty segments (handles duplicate slashes)
  let from_parts: Vec<&str> = from.split('/').filter(|s| !s.is_empty()).collect();
  let to_parts: Vec<&str> = to.split('/').filter(|s| !s.is_empty()).collect();

  // Find length of common prefix
  let common = from_parts
    .iter()
    .zip(to_parts.iter())
    .take_while(|(a, b)| a == b)
    .count();

  let up_count = from_parts.len() - common;
  let down = &to_parts[common..];

  let mut parts: Vec<&str> = Vec::with_capacity(up_count + down.len());
  for _ in 0..up_count {
    parts.push("..");
  }
  for part in down {
    parts.push(part);
  }

  parts.join("/")
}

/// Returns the relative path from `root_dir` to `file_path`, always using
/// forward slashes and prefixed with `./` when not already traversing upward.
///
/// Replicates `getRelativePath` from `internals/utils/src/fs.ts`.
///
/// @example
/// ```js
/// getRelativePath('/project/src', '/project/src/gen/types.ts')  // './gen/types.ts'
/// getRelativePath('/project/src/gen', '/project/src')            // './..'
/// ```
#[napi(js_name = "getRelativePath")]
pub fn get_relative_path(root_dir: String, file_path: String) -> napi::Result<String> {
  if root_dir.is_empty() || file_path.is_empty() {
    return Err(napi::Error::new(
      napi::Status::InvalidArg,
      format!(
        "Root and file should be filled in when retrieving the relativePath, {} {}",
        root_dir, file_path
      ),
    ));
  }

  let root = to_slash(&root_dir);
  let file = to_slash(&file_path);
  let relative = posix_relative(&root, &file);

  if relative.starts_with("../") {
    Ok(relative)
  } else {
    Ok(format!("./{relative}"))
  }
}
