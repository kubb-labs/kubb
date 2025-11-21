export function buildFormData<T = unknown>(data: T): FormData {
  const formData = new FormData()

  function appendData(key: string, value: any) {
    if (value instanceof Blob) {
      formData.append(key, value)
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      formData.append(key, String(value))
    }
    if (typeof value === 'string') {
      formData.append(key, value)
    }
    if (typeof value === 'object') {
      formData.append(key, JSON.stringify(value))
    }
  }

  if (data) {
    Object.entries(data).forEach(([key, value]) => {
      if (value === undefined || value === null) return

      if (Array.isArray(value)) {
        for (const valueItem in value) {
          appendData(key, valueItem)
        }
      } else {
        appendData(key, value)
      }
    })
  }

  return formData
}