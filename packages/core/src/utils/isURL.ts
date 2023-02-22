export const isURL = (data: string) => {
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
