//! The slices of `node:path` (POSIX) the output stage needs.

/// `path.resolve(p)` as segments: absolute against the working directory, `.` and `..` folded.
fn resolve(path: &str) -> Vec<String> {
    let mut segments: Vec<String> = Vec::new();
    let cwd;
    let full = if path.starts_with('/') {
        path
    } else {
        cwd = format!(
            "{}/{path}",
            std::env::current_dir()
                .map(|dir| dir.to_string_lossy().into_owned())
                .unwrap_or_default()
        );
        &cwd
    };
    for segment in full.split('/') {
        match segment {
            "" | "." => {}
            ".." => {
                segments.pop();
            }
            other => segments.push(other.to_string()),
        }
    }
    segments
}

/// Port of `getRelativePath` in `packages/parser-ts/src/utils.ts`: the specifier that imports `file_path` from the file at `root`.
pub fn relative_specifier(root: &str, file_path: &str) -> String {
    let mut from = resolve(root);
    from.pop(); // dirname
    let to = resolve(file_path);
    let common = from.iter().zip(&to).take_while(|(a, b)| a == b).count();
    let mut parts: Vec<&str> = vec![".."; from.len() - common];
    parts.extend(to[common..].iter().map(String::as_str));
    let relative = parts.join("/");
    if relative.starts_with("../") {
        relative
    } else {
        format!("./{relative}")
    }
}

/// `path.extname`: the last `.` of the base name onward, empty for dotfiles.
pub fn extname(path: &str) -> &str {
    let base = path.rsplit('/').next().unwrap_or(path);
    match base.rfind('.') {
        Some(0) | None => "",
        Some(_) if base == ".." => "",
        Some(at) => &base[at..],
    }
}

/// Port of `resolveOutputPath`: swaps the extension of a relative specifier, leaves package specifiers alone.
pub fn resolve_output_path(path: &str, new_extname: &str, root_aware: bool) -> String {
    if !root_aware {
        return path.to_string();
    }
    let current = extname(path);
    if current.is_empty() {
        path.to_string()
    } else {
        format!("{}{new_extname}", &path[..path.len() - current.len()])
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn specifiers_match_node() {
        assert_eq!(
            relative_specifier("/gen/types/Pet.ts", "/gen/types/Tag.ts"),
            "./Tag.ts"
        );
        assert_eq!(
            relative_specifier("/gen/clients/getPet.ts", "/gen/types/Pet.ts"),
            "../types/Pet.ts"
        );
        assert_eq!(
            relative_specifier("/gen/a/b/c.ts", "/gen/a/d.ts"),
            "../d.ts"
        );
        assert_eq!(
            resolve_output_path("../types/Pet.ts", "", true),
            "../types/Pet"
        );
        assert_eq!(resolve_output_path("zod.v4", ".js", false), "zod.v4");
        assert_eq!(extname(".env"), "");
    }
}
