/** Counts a noun, so a message never reads `1 files`. */
export function pluralize(count: number, noun: string): string {
  return `${count} ${count === 1 ? noun : `${noun}s`}`
}

/** The flag that grants a permission, such as `--allow-read-ast`. */
export function toPermissionFlag(key: string): string {
  return `--${key.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`)}`
}

/** Whether `value` starts with `http://` or `https://`. */
export function isHttpUrl(value: string): boolean {
  return /^https?:\/\//.test(value)
}
