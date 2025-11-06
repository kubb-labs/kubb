export async function timeout(ms: number): Promise<unknown> {
  return new Promise((resolve) => {
    const timeout = globalThis.setTimeout(() => {
      resolve(timeout)
    }, ms)
  }).then((timeout) => {
    globalThis.clearTimeout(timeout as NodeJS.Timeout)
  })
}
