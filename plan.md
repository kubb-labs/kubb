# Plan: closing the gap against the v4 codegen review

Findings from the dev.to comparison "Which OpenAPI Codegen Should You Choose?
openapi-typescript vs hey-api vs Orval vs Kubb" by nyaomaru, walked section by
section. The article rated Kubb v4. This plan records, per section, what the
article claims, where Kubb v5 (`5.0.0-beta.95`) already stands, and the concrete
gap left to close.

Source: https://dev.to/nyaomaru/which-openapi-codegen-should-you-choose-openapi-typescript-vs-hey-api-vs-orval-vs-kubb-100p

## How these findings were gathered

This session's network policy blocks `dev.to` (and every reader, cache, and
archive host), so the article could not be fetched directly. Each section below
was reconstructed from search snippets of the article, cross-checked against the
skmtc benchmark it cites and the current repo. Lines tagged `[verified]` are
grounded in the benchmark or this repo. Lines tagged `[reconstructed]` come from
search snippets and should be confirmed against the live article before acting.

Status legend: `lead` Kubb is ahead, `improved` v5 changed it but the win is not
yet proven publicly, `open` still a gap.

## Section 1: framing and thesis

Article: the tools are compared on a large real-world schema across four axes,
generated files, DX, error handling, and daily frontend usage. The recurring
thesis is that OpenAPI codegen "is not only about what a tool can generate", so
breadth alone does not win the piece. `[reconstructed]`

v5 today: Kubb's whole pitch is breadth and structure, which is the axis the
article deliberately discounts. Nothing in the codebase answers the framing.

Finding: the review is graded on ergonomics, speed, and fit, not on the plugin
count Kubb optimizes for. Every gap below follows from this thesis.

- [ ] Treat speed and first-run fit as first-class, not as a footnote to breadth.

## Section 2: openapi-typescript

Article: zero-runtime types written to a single `types.gen.ts`, minimal file
I/O, generation around 1.5 seconds, "fast, thin, and easy to understand." It is
the recommended baseline to stay on until there is concrete pain. `[reconstructed]`

v5 today: Kubb emits many files by design, one per operation and schema, so it
starts from the opposite end of the file-I/O and simplicity curve.

Finding: the single-file, sub-two-second baseline is the yardstick every other
tool is measured against. Kubb has no comparable "types only, one file, minimal"
mode to meet a reader who only wants types.

- [ ] Offer a types-only, few-files preset that lands near the openapi-typescript baseline for the simple case.

## Section 3: hey-api

Article: the current frontrunner, positioned as the spiritual successor to
openapi-typescript-codegen, fully rewritten with a plugin-based architecture. It
is the recommended next step once openapi-typescript is outgrown. `[reconstructed]`

v5 today: Kubb matches and exceeds hey-api on outputs and on response and error
modeling, but hey-api owns the "obvious upgrade" slot and the adoption momentum
(millions of weekly downloads, named production users).

Finding: Kubb is not in the reader's consideration set at the moment they feel
the first pain. That is a positioning and mindshare gap, not a feature gap.

- [ ] Publish a "migrating from hey-api" guide that leads with Kubb's response and codec advantages.

## Section 4: Orval

Article: the batteries-included option, generating React Query, SWR, and Axios
code with CRUD, mock data, and Zod validation from one config. Recommended when
"OpenAPI becomes more than API client generation." `[reconstructed]`

v5 today: this is the slot nearest to Kubb, and Kubb covers everything Orval does
plus Cypress, Redoc, MCP, and custom adapters and parsers. Orval is also ~1.6x
faster in the cited benchmark. `[verified]`

Finding: Kubb wins the batteries-included comparison on capability but loses on
speed and on the one-config simplicity Orval is praised for.

- [ ] Make the multi-output path a single concise config, and close the speed gap to Orval (see section 8).

## Section 5: Kubb

Article: the modular powerhouse, closer to a codegen platform than a client
generator. Generates types, Zod, React Query hooks, MSW mocks and more through
composable plugins on a shared engine, with an OpenAPI adapter, an AST, a JSX
renderer, a CLI, and an MCP server. The `init` wizard creates `package.json` if
needed, guides plugin selection, installs packages, and writes `kubb.config.ts`.
Verdict: high potential, but it needs commitment. `[reconstructed]`

v5 today: the description is accurate and current. `kubb init` was reworked to
scaffold a v5 project. `[verified]` The JSX renderer, the exact thing the article
flags as extra machinery, was rewritten as a synchronous path 2 to 4x faster than
the old async fiber. `[verified]`

Finding: the article's picture of Kubb is right, and "needs commitment" is the
sentence to overturn. The engine is no longer slow; the perception has not caught
up.

- [ ] Reframe the JSX renderer and plugin system as opt-in depth, not a required on-ramp.

## Section 6: generated files

Article: file count and file I/O are treated as a cost. openapi-typescript's
single file is the ideal; more files means more to read and slower generation. `[reconstructed]`

v5 today: Kubb's default is one file per operation and per schema, which reads as
sprawl on a small spec. There is no first-class "group into fewer files" default.

Finding: for a small or medium app the default output looks heavy next to a
single `types.gen.ts`.

- [ ] Ship a grouping or single-file output mode and consider it the default for small specs.

## Section 7: developer experience and setup

Article: DX centers on setup and config. Kubb's wizard is credited, but the
plugin selection plus `kubb.config.ts` plus the JSX renderer read as overhead
next to "install one package, generate one file." `[reconstructed]`

v5 today: `kubb init` scaffolds a working v5 project, which narrows the gap. `[verified]`
The remaining distance is the shape of the minimal config and how much a first
timer must understand before the first successful generate.

Finding: the on-ramp is heavier than the baseline tools because the smallest
useful config still exposes the plugin model.

- [ ] Provide a zero-config or one-line preset and a five-minute quickstart that is types plus one client, not the full plugin grid.

## Section 8: performance and heaviness

Article: Kubb is "powerful, but at a large schema size, it was also heavy", and
the piece leans on the skmtc benchmark for the number. `[reconstructed]` On the
GitHub REST v3 spec (11.1 MB, Zod v4) the benchmark ranks Kubb third of four at
7.632 s, 14.9x slower than skmtc and about 1.6x slower than Orval. `[verified]`

v5 today: the hot-path work that attacks exactly this has already landed.
A per-`parse` `$ref` cache took the Stripe spec (~1,400 schemas) from out of
memory at 8 GB to about 840 ms and 15 MB. Plus parallel per-node dispatch,
streaming file writes, a synchronous JSX renderer, a process-wide WeakMap
signature cache, and adapter-scoped OAS reuse. `[verified]` None of this is
represented in the public benchmark, which reflects the reviewed build.

Finding: this is the single highest-leverage gap. The code is faster; there is no
reproducible, published head-to-head proving it, so the loudest number in
circulation is still the v4 `7.632 s` at `14.9x`. The repo has `.github/bench.sh`
(times test runners) and `adapter.bench.ts` (a micro-bench), but no
competitor-comparison codegen benchmark.

- [ ] Add a benchmark harness that regenerates from the same GitHub REST v3 spec against Kubb v5, Orval, hey-api, and skmtc.
- [ ] Publish the numbers next to the comparison page and, once verified, in response to the skmtc benchmark.

## Section 9: error handling

Article: error handling is one of the four graded axes. `[reconstructed]` The
article's specific per-tool wording could not be confirmed from search; several
snippets attributed to it were traced back to Kubb's own comparison page, so the
exact claims here need a read of the live article.

v5 today: this is a Kubb strength. A call returns a status-discriminated result
narrowed by one `switch`, `throwOnError` picks throw or return per call, error
bodies are typed, and multiple content types per response are modeled. `[verified,
from repo comparison doc]`

Finding: likely an under-credited win in the v4 review. Confirm what the article
actually says, then make sure the v5 error-handling story is visible where a
comparison shopper lands.

- [ ] Confirm the article's error-handling verdict against the live text.
- [ ] Surface the status-discriminated result and per-call throw or return prominently in the getting-started path, not only in the comparison page.

## Section 10: daily frontend usage

Article: on everyday frontend work Kubb "may not be the first choice for a normal
frontend app", though it is "very interesting if you want to design codegen
itself." `[reconstructed]`

v5 today: nothing in the product speaks to the "normal frontend app" reader; the
docs lead with the platform, the plugins, and the AST.

Finding: Kubb is positioned as a tool for people who build codegen, not people
who consume an API in a React app. That narrows the audience by default.

- [ ] Write a "Kubb for a normal frontend app" narrative that starts from a React or Vue data-fetching use case.

## Section 11: recommendation and verdict

Article: the tiering is stay on openapi-typescript while it works, move to hey-api
at the first real pain, reach for Orval when OpenAPI grows past client
generation, and choose Kubb only when there is a clear reason for it, accepting
that the potential is high but it needs commitment. `[reconstructed]`

v5 today: the repo comparison page argues the capability case well, but it is not
where the reviewer or a comparison shopper looks, and it does not answer speed or
first-run fit.

Finding: Kubb is the last resort in the reader's decision tree. Moving up that
tree needs the speed proof (section 8), the light on-ramp (section 7), and the
frontend-first narrative (section 10), not more features.

- [ ] Re-argue placement with a benchmark, a five-minute path, and a normal-app story rather than a longer capability table.

## Priority summary

P0, biggest score movers:

- [ ] Reproducible v5 vs Orval, hey-api, and skmtc codegen benchmark on the GitHub REST v3 spec, then publish it (section 8).
- [ ] Low-config preset and a genuine five-minute quickstart to answer "needs commitment" (sections 5, 7).

P1:

- [ ] Fewer-files or grouped output mode for small specs (section 6).
- [ ] "Kubb for a normal frontend app" narrative plus migrate-from-hey-api and migrate-from-openapi-typescript guides (sections 2, 3, 10).
- [ ] Make the v5 error-handling and response story visible in the getting-started path (section 9).

P2:

- [ ] Confirm each `[reconstructed]` claim against the live article and correct any mischaracterization.
- [ ] Types-only, single-file preset that meets the openapi-typescript baseline for the simple case (section 2).
