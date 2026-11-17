//! The Rust port of `internals/utils/src/text.ts`.

#![forbid(unsafe_code)]

/// Whitespace as `String.prototype.trim` sees it (ECMAScript WhiteSpace + LineTerminator).
/// Rust's `char::is_whitespace` differs on U+FEFF (JS: yes) and U+0085 (JS: no).
pub fn is_js_whitespace(c: char) -> bool {
    matches!(
        c,
        '\u{9}'..='\u{d}' | ' ' | '\u{a0}' | '\u{1680}' | '\u{2000}'..='\u{200a}' | '\u{2028}' | '\u{2029}' | '\u{202f}' | '\u{205f}' | '\u{3000}' | '\u{feff}'
    )
}

fn trim_start(text: &str) -> &str {
    text.trim_start_matches(is_js_whitespace)
}

/// `String.prototype.trimEnd`.
pub fn js_trim_end(text: &str) -> &str {
    text.trim_end_matches(is_js_whitespace)
}

/// `String.prototype.trim`.
pub fn js_trim(text: &str) -> &str {
    text.trim_matches(is_js_whitespace)
}

fn is_blank(text: &str) -> bool {
    text.chars().all(is_js_whitespace)
}

/// Port of `indent` (`internals/utils/src/text.ts:6`).
pub fn indent(arg0: serde_json::Value) -> Result<String, String> {
    if arg0.is_null() {
        return Err(
            "TypeError: Cannot destructure property 'text' of 'object null' as it is null.".into(),
        );
    }
    let text = arg0.get("text").and_then(|v| v.as_str()).unwrap_or("");
    let unit = arg0.get("unit").and_then(|v| v.as_str()).unwrap_or("  ");
    Ok(indent_with(text, unit))
}

pub fn indent_with(text: &str, unit: &str) -> String {
    let mut out = String::with_capacity(text.len() + text.len() / 8);
    for (i, line) in text.split('\n').enumerate() {
        if i > 0 {
            out.push('\n');
        }
        if !is_blank(line) {
            out.push_str(unit);
            out.push_str(line);
        }
    }
    out
}

/// Port of `dedent` (`internals/utils/src/text.ts:17`).
pub fn dedent(text: String) -> Result<String, String> {
    Ok(dedent_str(&text))
}

pub fn dedent_str(text: &str) -> String {
    if !text.contains('\n') {
        return trim_start(text).to_string();
    }
    let lines: Vec<&str> = text.split('\n').collect();
    // Leading whitespace is all BMP, so a char count equals the UTF-16 length JS measures.
    let indents: Vec<Option<usize>> = lines
        .iter()
        .map(|line| {
            let rest = trim_start(line);
            (!rest.is_empty()).then(|| line[..line.len() - rest.len()].chars().count())
        })
        .collect();
    let Some(start) = indents.iter().position(Option::is_some) else {
        return String::new();
    };
    let end = indents.iter().rposition(Option::is_some).unwrap_or(start);
    let min = indents.iter().flatten().copied().min().unwrap_or(0);
    let mut out = String::with_capacity(text.len());
    for i in start..=end {
        if i > start {
            out.push('\n');
        }
        if indents[i].is_some() {
            let line = lines[i];
            let cut = line
                .char_indices()
                .nth(min)
                .map_or(line.len(), |(at, _)| at);
            out.push_str(&line[cut..]);
        }
    }
    out
}

/// Port of `unquote` (`internals/utils/src/text.ts:44`).
pub fn unquote(text: String) -> Result<String, String> {
    let mut chars = text.chars();
    let (Some(first), Some(last)) = (chars.next(), chars.next_back()) else {
        return Ok(text);
    };
    if matches!(first, '"' | '\'' | '`') && last == first {
        return Ok(chars.as_str().to_string());
    }
    Ok(text)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn dedent_strips_common_indent_and_outer_blank_lines() {
        assert_eq!(dedent_str("\n    a\n      b\n\n    c\n  "), "a\n  b\n\nc");
        assert_eq!(dedent_str("  one line "), "one line ");
        assert_eq!(dedent_str(" \n \n"), "");
    }

    #[test]
    fn indent_skips_blank_lines() {
        assert_eq!(indent_with("a\n\n b", "  "), "  a\n\n   b");
    }
}
