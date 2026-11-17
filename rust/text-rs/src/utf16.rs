//! JS string indexing in Rust.
//!
//! JS strings are indexed in UTF-16 code units; Rust `str` in UTF-8 bytes. A port that returns
//! or consumes offsets must use these helpers, or non-ASCII text gets wrong results silently.

#![forbid(unsafe_code)]

/// The UTF-16 code units of `s`, as JS sees the string.
pub fn units(s: &str) -> Vec<u16> {
    s.encode_utf16().collect()
}

/// The string `units[start..end]` decodes to, like JS `slice` (lone surrogates become U+FFFD).
pub fn slice(units: &[u16], start: usize, end: usize) -> String {
    let end = end.min(units.len());
    let start = start.min(end);
    String::from_utf16_lossy(&units[start..end])
}

/// JS `haystack.indexOf(needle, from)`, in UTF-16 code units.
pub fn index_of(haystack: &[u16], needle: &[u16], from: usize) -> Option<usize> {
    let from = from.min(haystack.len());
    if needle.is_empty() {
        return Some(from);
    }
    haystack[from..]
        .windows(needle.len())
        .position(|w| w == needle)
        .map(|i| i + from)
}

/// JS `haystack.lastIndexOf(needle)`, in UTF-16 code units.
pub fn last_index_of(haystack: &[u16], needle: &[u16]) -> Option<usize> {
    if needle.is_empty() {
        return Some(haystack.len());
    }
    haystack.windows(needle.len()).rposition(|w| w == needle)
}

/// UTF-8 byte offset of a UTF-16 offset in `s`, for slicing a Rust `str`.
pub fn byte_offset(s: &str, utf16_offset: usize) -> usize {
    let mut seen = 0;
    for (byte, c) in s.char_indices() {
        if seen >= utf16_offset {
            return byte;
        }
        seen += c.len_utf16();
    }
    s.len()
}

/// UTF-16 offset of a UTF-8 byte offset in `s`, for returning ranges to JS.
pub fn utf16_offset(s: &str, byte_offset: usize) -> usize {
    s[..byte_offset.min(s.len())].encode_utf16().count()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn matches_js_indexing() {
        let s = units("a👍b");
        assert_eq!(s.len(), 4);
        assert_eq!(index_of(&s, &units("b"), 0), Some(3));
        assert_eq!(last_index_of(&s, &units("a")), Some(0));
        assert_eq!(slice(&s, 3, 4), "b");
        assert_eq!(byte_offset("a👍b", 3), 5);
        assert_eq!(utf16_offset("a👍b", 5), 3);
    }
}
