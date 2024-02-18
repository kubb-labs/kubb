export const throttle = <R, A extends any[]>(fn: (...args: A) => R, delay: number): [(...args: A) => R | undefined, () => void] => {
  let wait = false
  let timeout: NodeJS.Timeout
  let cancelled = false

  return [
    (...args: A) => {
      if (cancelled) {
        return undefined
      }
      if (wait) {
        return undefined
      }

      const val = fn(...args)

      wait = true

      timeout = setTimeout(() => {
        wait = false
      }, delay) as NodeJS.Timeout

      return val
    },
    () => {
      cancelled = true
      clearTimeout(timeout)
    },
  ]
}
