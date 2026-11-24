---
'@kubb/adapter-oas': patch
'@kubb/cli': patch
---

Guard specs that a sandboxed host does not trust, and specs that would hang or crash the loader.

- On a Kubb Studio agent, a `$ref` URL on a host that is not public, such as `localhost`, a private network address, or `169.254.169.254`, is refused and never fetched, and a `$ref` URL that redirects fails. `kubb studio --allow-file-refs` lifts this limit, and `kubb generate` is unchanged.
- A request for a URL input or a `$ref` URL stops after 30 seconds, and canceling a build now stops its requests.
- A YAML alias inside its own anchor, or aliases that expand into a huge document, report `KUBB_INVALID_DOCUMENT` instead of overflowing the stack or running for minutes. So does an `input` object that contains itself.
- An error while converting a referenced schema is thrown instead of turning the schema into an empty ref.
