//! Rust implementations behind the `@kubb/native` helpers, built to WebAssembly.
//!
//! Every helper takes a UTF-8 string the JavaScript side wrote into memory it got from `alloc`,
//! writes its result to a shared output buffer, and returns that result's byte length. JavaScript
//! then reads the result from `out_ptr()` before the next call. Keeping strings as plain bytes
//! avoids a binding generator and keeps the JavaScript fallback the source of truth for behavior.

use std::cell::RefCell;

thread_local! {
    static OUT: RefCell<Vec<u8>> = const { RefCell::new(Vec::new()) };
}

/// Reserves `len` bytes for the caller to write a string into. Release it with `dealloc`.
#[no_mangle]
pub extern "C" fn alloc(len: usize) -> *mut u8 {
    let mut buffer = Vec::<u8>::with_capacity(len);
    let ptr = buffer.as_mut_ptr();
    std::mem::forget(buffer);
    ptr
}

/// Releases memory from `alloc` with the same `len`.
///
/// # Safety
/// `ptr` and `len` must come from one `alloc` call, and the memory must not be used afterwards.
#[no_mangle]
pub unsafe extern "C" fn dealloc(ptr: *mut u8, len: usize) {
    drop(Vec::from_raw_parts(ptr, 0, len))
}

/// Where the last helper wrote its result. Valid until the next helper call.
#[no_mangle]
pub extern "C" fn out_ptr() -> *const u8 {
    OUT.with(|out| out.borrow().as_ptr())
}

fn reply(text: &str) -> usize {
    OUT.with(|out| {
        let mut out = out.borrow_mut();
        out.clear();
        out.extend_from_slice(text.as_bytes());
        out.len()
    })
}

/// camelCase (`pascal == 0`) or PascalCase (`pascal != 0`) of the string at `ptr`/`len`. Mirrors `convertCaseJs`.
///
/// # Safety
/// The caller must have written `len` bytes at `ptr`, in memory it got from `alloc`.
#[no_mangle]
pub unsafe extern "C" fn convert_case(ptr: *const u8, len: usize, pascal: u32) -> usize {
    let input = std::slice::from_raw_parts(ptr, len);
    let text = String::from_utf8_lossy(input);
    reply(&convert_case_str(&text, pascal != 0))
}

/// What JavaScript's `\s` and `trim()` treat as whitespace: Unicode White_Space without NEL, plus the BOM.
fn is_js_space(c: char) -> bool {
    (c.is_whitespace() && c != '\u{85}') || c == '\u{feff}'
}

fn is_separator(c: char) -> bool {
    is_js_space(c) || matches!(c, '-' | '_' | '.' | '/' | '\\' | ':')
}

/// Inserts a space before every character at index `i > 0` where `boundary(previous, current, next)` holds.
fn space_before(chars: &[char], boundary: impl Fn(char, char, Option<char>) -> bool) -> Vec<char> {
    let mut out = Vec::with_capacity(chars.len() + 8);
    for (i, &c) in chars.iter().enumerate() {
        if i > 0 && boundary(chars[i - 1], c, chars.get(i + 1).copied()) {
            out.push(' ');
        }
        out.push(c);
    }
    out
}

fn convert_case_str(text: &str, pascal: bool) -> String {
    let chars: Vec<char> = text.trim_matches(is_js_space).chars().collect();
    // The three word-boundary passes of the JavaScript version, in the same order.
    let chars = space_before(&chars, |prev, c, _| {
        c.is_ascii_uppercase() && (prev.is_ascii_lowercase() || prev.is_ascii_digit())
    });
    let chars = space_before(&chars, |prev, c, next| {
        c.is_ascii_uppercase()
            && prev.is_ascii_uppercase()
            && next.is_some_and(|n| n.is_ascii_lowercase())
    });
    let chars = space_before(&chars, |prev, c, _| {
        c.is_ascii_lowercase() && prev.is_ascii_digit()
    });
    let spaced: String = chars.into_iter().collect();

    let mut out = String::with_capacity(spaced.len());
    for (i, word) in spaced
        .split(is_separator)
        .filter(|word| !word.is_empty())
        .enumerate()
    {
        if word.chars().nth(1).is_some() && word == word.to_uppercase() {
            out.push_str(word);
            continue;
        }
        let mut rest = word.chars();
        let head = rest.next().expect("word is not empty");
        if i == 0 && !pascal {
            out.extend(head.to_lowercase());
        } else {
            out.extend(head.to_uppercase());
        }
        out.push_str(rest.as_str());
    }
    out.retain(|c| c.is_ascii_alphanumeric());
    out
}

#[cfg(test)]
mod tests {
    use super::convert_case_str;

    #[test]
    fn matches_the_javascript_cases() {
        assert_eq!(convert_case_str("hello-world", false), "helloWorld");
        assert_eq!(convert_case_str("HelloWorld", false), "helloWorld");
        assert_eq!(
            convert_case_str("getHTTPSResponse", false),
            "getHTTPSResponse"
        );
        assert_eq!(convert_case_str("123invalid", false), "123Invalid");
        assert_eq!(convert_case_str("get2pet", false), "get2Pet");
        assert_eq!(convert_case_str("hello@world", false), "helloworld");
        assert_eq!(convert_case_str("pet.petId", false), "petPetId");
        assert_eq!(convert_case_str("is HTML test", true), "IsHTMLTest");
        assert_eq!(convert_case_str("aiType", true), "AiType");
        assert_eq!(convert_case_str("", false), "");
    }
}
