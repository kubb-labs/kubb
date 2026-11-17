//! JS values that JSON cannot express, and the JSON transport of the bindings.

#![forbid(unsafe_code)]

/// Reads a structured argument sent by `index.cjs`.
pub fn from_json<T: serde::de::DeserializeOwned>(text: &str) -> Result<T, String> {
    serde_json::from_str(text).map_err(|e| format!("TypeError: {e}"))
}

/// Writes a structured result for `index.cjs`.
pub fn to_json<T: serde::Serialize>(value: &T) -> Result<String, String> {
    serde_json::to_string(value).map_err(|e| e.to_string())
}

/// JS `undefined` inside a structured value: `{ a: undefined }` is not `{ a: null }`.
pub fn undefined() -> serde_json::Value {
    serde_json::json!({ "$undefined": true })
}

/// Whether a structured value received from JS was `undefined`.
pub fn is_undefined(value: &serde_json::Value) -> bool {
    value.as_object().is_some_and(|o| {
        o.len() == 1 && o.get("$undefined") == Some(&serde_json::Value::Bool(true))
    })
}

/// A JS string from UTF-16 code units: a plain string when well-formed, else a marker that
/// `index.cjs` turns into the exact JS string, lone surrogates included.
pub fn utf16_string(units: &[u16]) -> serde_json::Value {
    match String::from_utf16(units) {
        Ok(s) => serde_json::Value::String(s),
        Err(_) => serde_json::json!({ "$utf16": units }),
    }
}

/// The UTF-16 code units of a string received from JS, plain or marked.
pub fn string_units(value: &serde_json::Value) -> Option<Vec<u16>> {
    match value {
        serde_json::Value::String(s) => Some(s.encode_utf16().collect()),
        serde_json::Value::Object(o) if o.len() == 1 => o
            .get("$utf16")?
            .as_array()?
            .iter()
            .map(|u| u.as_u64().and_then(|u| u16::try_from(u).ok()))
            .collect(),
        _ => None,
    }
}

/// A JS number inside a structured value. JSON has no NaN, Infinity or -0: those cross as
/// `{"$num": "NaN"}` and friends, which `index.cjs` turns back into numbers.
pub fn number(n: f64) -> serde_json::Value {
    if n.is_nan() {
        serde_json::json!({ "$num": "NaN" })
    } else if n.is_infinite() {
        serde_json::json!({ "$num": if n > 0.0 { "Infinity" } else { "-Infinity" } })
    } else if n == 0.0 && n.is_sign_negative() {
        serde_json::json!({ "$num": "-0" })
    } else if n.fract() == 0.0 && n.abs() < 9_007_199_254_740_992.0 {
        serde_json::Value::from(n as i64)
    } else {
        serde_json::Value::from(n)
    }
}

/// JS `Array.prototype.sort(compare)`, as V8 runs it.
///
/// With a consistent comparator any stable sort agrees with JS. With one that returns NaN or
/// contradicts itself, the order depends on the algorithm: under 64 elements this reproduces
/// V8's TimSort exactly (one run, then binary insertion); longer arrays use Rust's stable sort.
pub fn sort<T>(items: &mut [T], mut compare: impl FnMut(&T, &T) -> f64) {
    let n = items.len();
    if n < 2 {
        return;
    }
    if n >= 64 {
        items.sort_by(|a, b| {
            compare(a, b)
                .partial_cmp(&0.0)
                .unwrap_or(std::cmp::Ordering::Equal)
        });
        return;
    }
    // CountAndMakeRun: the leading ascending run, or strictly descending run (reversed).
    let mut run = 2;
    let descending = compare(&items[1], &items[0]) < 0.0;
    while run < n {
        let order = compare(&items[run], &items[run - 1]);
        if (descending && order >= 0.0) || (!descending && order < 0.0) {
            break;
        }
        run += 1;
    }
    if descending {
        items[..run].reverse();
    }
    // BinaryInsertionSort of the rest.
    for start in run..n {
        let (mut left, mut right) = (0, start);
        while left < right {
            let mid = left + ((right - left) >> 1);
            if compare(&items[start], &items[mid]) < 0.0 {
                right = mid;
            } else {
                left = mid + 1;
            }
        }
        items[left..=start].rotate_right(1);
    }
}

/// A number received from JS inside a structured value, plain or marked.
pub fn as_number(value: &serde_json::Value) -> Option<f64> {
    match value {
        serde_json::Value::Number(n) => n.as_f64(),
        serde_json::Value::Object(o) if o.len() == 1 => match o.get("$num")?.as_str()? {
            "NaN" => Some(f64::NAN),
            "Infinity" => Some(f64::INFINITY),
            "-Infinity" => Some(f64::NEG_INFINITY),
            "-0" => Some(-0.0),
            _ => None,
        },
        _ => None,
    }
}
