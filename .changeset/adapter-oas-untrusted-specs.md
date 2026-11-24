---
'@kubb/adapter-oas': patch
'@kubb/cli': patch
---

Guard specs that a sandboxed host does not trust, and requests that would hang the loader.

- On a Kubb Studio agent, a `$ref` URL on a host that is not public, such as `localhost`, a private network address, or `169.254.169.254`, is refused before Kubb requests it, and a `$ref` URL that redirects fails. Kubb resolves the host again when it connects, so a host that changes its DNS answer in between can still reach a private address. `kubb studio --allow-file-refs` lifts this limit, and `kubb generate` is unchanged.
- A request for a URL input or a `$ref` URL stops after 30 seconds, and so does the host check before it, and canceling a build now stops its requests.
- An error while converting a referenced schema is thrown instead of turning the schema into an empty ref.
