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
