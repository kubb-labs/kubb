//! Port of the read + parse half of `packages/adapter-oas/src/load/source.ts`.

use serde_json::Value;

/// Parses a spec to JSON text. A document that starts with `{` or `[` goes through the JSON parser first, like the original.
pub fn parse_spec(data: &str) -> Result<String, String> {
    if data.trim_start().starts_with(['{', '['])
        && let Ok(value) = serde_json::from_str::<Value>(data)
    {
        return serde_json::to_string(&value).map_err(|error| error.to_string());
    }
    // Streamed straight from YAML events to JSON text: no tree in between, and an integer past `u64`
    // is written out digit for digit, so `JSON.parse` rounds it to the same double `js-yaml` would.
    let mut out = Vec::with_capacity(data.len());
    serde_transcode::transcode(
        serde_yaml_ng::Deserializer::from_str(data),
        &mut serde_json::Serializer::new(&mut out),
    )
    .map_err(|error| format!("Cannot parse the spec as JSON or YAML: {error}"))?;
    String::from_utf8(out).map_err(|error| error.to_string())
}

pub fn load_spec(path: &str) -> Result<String, String> {
    let data =
        std::fs::read_to_string(path).map_err(|error| format!("Cannot read {path}: {error}"))?;
    // JSON input is already what `JSON.parse` wants: skip the parse and re-serialize round trip.
    if data.trim_start().starts_with(['{', '[']) && path.ends_with(".json") {
        return Ok(data);
    }
    parse_spec(&data)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn yaml_keeps_key_order_and_core_schema_types() {
        let json =
            parse_spec("b: 1\na: '2'\nc: [true, null, 1.5]\nbig: 18446744073709551616\n200: ok\n")
                .unwrap();
        assert_eq!(
            json,
            r#"{"b":1,"a":"2","c":[true,null,1.5],"big":18446744073709551616,"200":"ok"}"#
        );
    }
}
