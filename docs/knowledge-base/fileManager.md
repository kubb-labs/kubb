---
layout: doc

title: FileManager
outline: deep
---

# FileManager <Badge type="info" text="@kubb/core" />

The `FileManager` instance contains the building blocks in writing files, combining excludes or includes, creating barrel files.

::: tip
What has been written is managed by the [PluginManager](/reference/pluginManager/). The `FileManager` has no idea what has been processed and what not.
:::

### fileManager.files

An array of files has been added to the `FileManager` instance.

- **Type:** `Array<KubbFile.File>` <br/>

### fileManager.isExecuting

Check if the instance is writing a file or if we have items in the queue.

- **Type:** `boolean` <br/>

### fileManager.add

Add a file to the instance, if no `id` is added it will create an ID based on `crypto.randomUUID()`.<br/>

When creating a new instance you can set a `task` and that will be used in the queue as the executer. <br/>

Here we will also check if the file already exists and if so we will append(combining the import, exports and source). You can disable this behavior by setting `override` on the file object(`KubbFile.File`).

::: tip
`name` will be added, this is based on the baseName but without the extension.
:::

- **Type:** `(...files: Array<KubbFile.File>): Promise<Array<KubbFile.File>>` <br/>

### fileManager.addIndexes

Add `index.ts` files, we use `BarrelManager` to create all the index files needed for the folder tree(based on the output). The `BarrelManager` will go through your folder structure(based on the output) and create an index file for every folder.

::: tip
By setting the `output.exportType` to `false` you can disable the creation of barrel files.
:::

- **Type:** `(AddIndexesProps): Promise<Array<KubbFile.File> | undefined>)` <br/>

### fileManager.write

Write a file with a check on the queue to be sure no other files are being written. You can set a timeout between writing files with `timeout` when creating the instance.

- **Type:** `(...params: Parameters<typeof Read>): Promise<string>` <br/>

### fileManager.read

Read a file.

- **Type:** `(...params: Parameters<typeof write>): Promise<string | undefined>` <br/>
