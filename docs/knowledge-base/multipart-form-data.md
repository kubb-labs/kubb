---
layout: doc

title: Multipart Form Data with Arrays
outline: deep
---

# Multipart Form Data with Arrays <a href="/plugins/plugin-client"><Badge type="info" text="@kubb/plugin-client" /></a>

Kubb automatically handles `multipart/form-data` requests, including proper support for arrays, files, and complex data types.

## Overview

When your OpenAPI specification defines an endpoint with `multipart/form-data` content type, Kubb generates code that uses the `buildFormData` utility function to properly serialize your request data into FormData format.

## Features

The `buildFormData` utility provides:

- **Array Support**: Properly iterates over array elements and appends each value
- **File Handling**: Automatically detects and handles `Blob` and `File` objects
- **Date Handling**: Converts `Date` objects to ISO strings
- **Type Safety**: Handles primitives (strings, numbers, booleans) and complex objects
- **Null/Undefined Filtering**: Automatically filters out `null` and `undefined` values from arrays

## How It Works

### Generated Code

When you have an endpoint that accepts `multipart/form-data`, Kubb generates code like this:

```typescript
import { buildFormData } from './.kubb/config'

export async function uploadFile(data: UploadFileRequest) {
  const formData = buildFormData(data)
  
  return client({
    method: 'post',
    url: '/upload',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}
```

### The buildFormData Utility

The `buildFormData` function is automatically generated in `.kubb/config.ts` and handles various data types:

```typescript
export function buildFormData<T = unknown>(data: T): FormData {
  const formData = new FormData()

  function appendData(key: string, value: any) {
    if (value instanceof Blob) {
      formData.append(key, value)
      return
    }
    if (value instanceof Date) {
      formData.append(key, value.toISOString())
      return
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      formData.append(key, String(value))
      return
    }
    if (typeof value === 'string') {
      formData.append(key, value)
      return
    }
    if (typeof value === 'object') {
      // Wrap JSON data in a Blob with application/json content type to ensure
      // servers correctly interpret the data. Without this, many servers return
      // 415 Unsupported Media Type errors when receiving JSON in multipart requests.
      formData.append(key, new Blob([JSON.stringify(value)], { type: 'application/json' }))
      return
    }
  }

  if (data) {
    Object.entries(data).forEach(([key, value]) => {
      if (value === undefined || value === null) return

      if (Array.isArray(value)) {
        for (const valueItem of value) {
          if (valueItem === undefined || valueItem === null) continue
          appendData(key, valueItem)
        }
      } else {
        appendData(key, value)
      }
    })
  }

  return formData
}
```

## Usage Examples

### Uploading Files with Metadata

```typescript
import { uploadFile } from './gen/uploadFile'

// Upload a single file with metadata
const file = new File(['content'], 'document.pdf', { type: 'application/pdf' })

await uploadFile({
  file: file,
  title: 'My Document',
  tags: ['important', 'work', 'pdf'],
  uploadDate: new Date()
})
```

### Uploading Multiple Files

```typescript
import { uploadFiles } from './gen/uploadFiles'

const files = [
  new File(['content1'], 'doc1.pdf', { type: 'application/pdf' }),
  new File(['content2'], 'doc2.pdf', { type: 'application/pdf' })
]

await uploadFiles({
  files: files,
  category: 'documents'
})
```

### Complex Data with Arrays

```typescript
import { createPost } from './gen/createPost'

await createPost({
  title: 'My Post',
  tags: ['javascript', 'typescript', 'kubb'],
  images: [
    new File(['img1'], 'image1.jpg', { type: 'image/jpeg' }),
    new File(['img2'], 'image2.jpg', { type: 'image/jpeg' })
  ],
  metadata: {
    author: 'John Doe',
    publishDate: new Date()
  }
})
```

## Data Type Handling

### Primitives
- **Strings**: Appended as-is
- **Numbers**: Converted to string
- **Booleans**: Converted to string ("true" or "false")

### Special Types
- **Blob/File**: Appended directly to FormData
- **Date**: Converted to ISO string format
- **Objects**: Wrapped in a Blob with `Content-Type: application/json` to ensure proper server-side parsing. This prevents 415 (Unsupported Media Type) errors that can occur when JSON data is sent without the correct content type in multipart requests.

### Arrays
- Each array element is appended individually with the same key
- `null` and `undefined` elements are automatically filtered out
- Nested arrays and objects within arrays are handled recursively

### Null/Undefined Values
- Top-level `null` or `undefined` values are skipped
- Array elements that are `null` or `undefined` are filtered out
- This prevents "null" or "undefined" string literals in FormData

## OpenAPI Schema Example

Here's an example OpenAPI specification that generates multipart/form-data handling:

```yaml
paths:
  /upload:
    post:
      requestBody:
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              properties:
                files:
                  type: array
                  items:
                    type: string
                    format: binary
                title:
                  type: string
                tags:
                  type: array
                  items:
                    type: string
                metadata:
                  type: object
                  properties:
                    author:
                      type: string
                    date:
                      type: string
                      format: date-time
```

## Best Practices

1. **File Validation**: Validate file types and sizes before calling the generated functions
2. **Error Handling**: Wrap calls in try-catch blocks to handle upload errors
3. **Progress Tracking**: Use the underlying client's progress events for large uploads
4. **Array Limits**: Be mindful of server-side limits on array sizes

## Troubleshooting

### Arrays Not Working

If arrays aren't being sent correctly, ensure you're using a recent version of Kubb (4.5.14+) which includes the array support fixes.

### Files Not Uploading

Make sure you're passing actual `File` or `Blob` objects, not file paths or base64 strings.

### Date Format Issues

Dates are automatically converted to ISO strings. If your server expects a different format, you may need to pre-process the date before passing it to the generated function.

### JSON Object Content-Type

When sending JSON objects in multipart form data, Kubb automatically wraps them in a `Blob` with `Content-Type: application/json`. This ensures that web servers can correctly parse the JSON data. Without the proper content type, many servers will return a 415 (Unsupported Media Type) error.

If you need to customize how objects are serialized, you can pre-process them before passing to the generated function, or provide your own implementation of `buildFormData`.

## Related Documentation

- [Custom HTTP Client](/knowledge-base/fetch)
- [Plugin Client](/plugins/plugin-client)
- [File Manager](/knowledge-base/fileManager)
