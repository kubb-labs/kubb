---
layout: doc
title: Architecture
description: Understand how Kubb converts API specifications into generated
  files through adapters, the AST, plugins, parsers, and storage.
outline:
  - 2
  - 3
order: 1
navigation:
  title: Architecture
  icon: i-iconoir-cube
---

# Architecture

Kubb separates the input specification, generated content, output syntax, and destination. Each layer has one job:

| Layer | Responsibility |
| --- | --- |
| Adapter | Read the specification and produce an `InputNode`. |
| AST | Describe schemas and operations in a shared tree. |
| Plugin | Run generators that emit `FileNode`s. |
| Parser | Convert emitted nodes into source code. |
| Storage | Persist the generated files. |

::architecture-pipeline
::

## From one operation to generated files

Consider a specification with `GET /pet/{petId}`, the operation ID `getPetById`, and a response referring to a reusable `Pet` schema.

1. The adapter reads the specification and resolves its references into schemas and operations.
2. The shared AST describes the `Pet` fields, the path parameter, and the operation's response. It does not choose Axios, Fetch, or Zod.
3. The TypeScript plugin generates model and response types. An Axios plugin generates a `getPetById` client that imports those types. A Zod plugin can generate validation schemas from the same input.
4. A parser turns each plugin's emitted nodes into source text. Storage writes the resulting files to the configured destination.

The same specification can therefore produce several outputs in one run. The [first-client tutorial](/docs/5.x/tutorials/quickstart) follows this operation using TypeScript and Axios.

## Adapters {#adapters}

An adapter resolves input-specific details, including references, nullability, discriminators, and formats. The default [OpenAPI adapter](/extensions/kubb-labs/adapter-oas) supports OpenAPI 2.0, 3.0, and 3.1. A custom adapter converts another input format into the same AST, so downstream plugins do not read that format directly.

::flow-diagram{preset="adapter"}
::

## AST {#ast}

The AST is the shared model between the adapter and plugins. Normalizing the input once means each plugin can work with schemas and operations without implementing OpenAPI reference resolution itself. A new adapter can feed the same plugins, and a new plugin can consume the same model.

An `InputNode` contains reusable schemas and operations. Operations connect parameters, request bodies, and responses to schema nodes. Request bodies and responses have one `ContentNode` per content type.

::ast-tree
::

Nodes carry a `kind` discriminant. Schemas also carry a `type` discriminant. The `transform` visitor rewrites nodes, while `collect` gathers matching nodes. Import the `ast` namespace from `kubb/kit`. See [AST reference](/docs/5.x/reference/kit/ast) for node builders, visitors, and guards.

## Plugins and generators {#plugins}

Each plugin owns an output: types, clients, hooks, validators, mocks, or custom files. Its generators handle individual schemas, individual operations, or the complete operation set.

Macros transform AST nodes before generators use them. They run per plugin, so one plugin's transformations do not modify another plugin's input. Resolvers keep names and paths consistent across generated files.

For the pet operation above, the type and client plugins need to agree on the response type's name and file path. The client reads the type plugin's resolver so its imports continue to work when names are customized.

See [Extension model](/docs/5.x/explanation/extensions) for how these pieces cooperate.

## Parsers {#parsers}

Each parser claims file extensions. Kubb selects it for the emitted file, prints nodes during generation, and assembles the final source through `parse`. The default parsers handle `.ts`, `.tsx`, and `.md`.

The TypeScript parser prints the banner, the imports, and each source node of a `FileNode` into the file's text:

::flow-diagram{preset="parsers"}
::

These responsibilities differ. The plugin chooses which files and declarations to emit. A printer chooses how an individual schema appears in that output. The parser assembles the file's source text.

A printer inside a generator handles schema-specific output. A parser handles the assembled file. See [Customize printers](/docs/5.x/how-to/printers) and [Parser reference](/docs/5.x/reference/kit/parsers).

## Storage {#storage}

Storage separates generation from its destination, so the same build runs on disk for the CLI or in memory for tests. `fsStorage()` writes to disk and `memoryStorage()` keeps results in a `Map`. A custom driver implements the [Storage interface](/docs/5.x/reference/kit/storage#storage-interface) to target another backend.

## See also

- [Extension model](/docs/5.x/explanation/extensions)
- [Generate your first client](/docs/5.x/tutorials/quickstart)
- [Kit API](/docs/5.x/reference/kit)
