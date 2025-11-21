export async function timeout(ms: number): Promise<unknown> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve(timeout)
    }, ms)
  }).then((timeout) => {
    clearTimeout(timeout as NodeJS.Timeout)

    return true
  })
}
