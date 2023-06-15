export async function timeout(ms: number): Promise<unknown> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true)
    }, ms)
  })
}
