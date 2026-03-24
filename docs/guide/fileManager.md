---
layout: doc

title: Kubb File Manager - Control Generated Files
description: Custom paths, naming conventions, and file organization strategies.
outline: deep
---

# FileManager <a href="/plugins/core"><Badge type="info" text="@kubb/core" /></a>

The `FileManager` instance contains building blocks for writing files, combining excludes or includes, and creating barrel files.

> [!TIP]
> What has been written is managed by the [PluginManager](/reference/pluginManager/). The `FileManager` has no idea what has been processed and what not.

### fileManager.files

 An array of files added to the `FileManager` instance.

- **Type:** `Array<KubbFile.File>` <br/>

### fileManager.isExecuting

Check if the instance is writing a file or if items exist in the queue.

- **Type:** `boolean` <br/>

### fileManager.add

Add a file to the instance. If no `id` is added, the system creates an ID based on `crypto.randomUUID()`.

When creating a new instance, set a `task` to use in the queue as the executor.

The system checks if the file already exists. If so, it appends (combining imports, exports, and source). Disable this behavior by setting `override` on the file object (`KubbFile.File`).

> [!TIP]
> The system adds `name`, based on the basename without extension.


- **Type:** `(...files: Array<KubbFile.File>): Promise<Array<KubbFile.File>>` <br/>

### fileManager.addIndexes

Add `index.ts` files using `BarrelManager` to create index files for the folder tree (based on output). The `BarrelManager` traverses your folder structure and creates an index file for each folder.

> [!TIP]
> Set `output.exportType` to `false` to disable barrel file creation.


- **Type:** `(AddIndexesProps): Promise<Array<KubbFile.File> | undefined>)` <br/>

### fileManager.write

Write a file with a queue check to ensure no other files are writing. Set a timeout between writing files when creating the instance.

- **Type:** `(...params: Parameters<typeof Read>): Promise<string>` <br/>

### fileManager.read

Read a file.

- **Type:** `(...params: Parameters<typeof write>): Promise<string | undefined>` <br/>
