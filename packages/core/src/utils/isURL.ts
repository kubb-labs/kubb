export function isURL(data: string): boolean {
  try {
    const url = new URL(data)
    if (url?.href) {
      return true
    }
  } catch (error) {
    return false
  }
  return false
}
