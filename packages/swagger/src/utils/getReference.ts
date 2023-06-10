import { get } from 'typedash'

// See https://swagger.io/docs/specification/using-ref/
export function getReference(spec: unknown, ref: string) {
  const path = ref
    .slice(2)
    .split('/')
    .map((s) => unescape(s.replace(/~1/g, '/').replace(/~0/g, '~')))

  const result = get(spec, path)
  if (!result) {
    throw new Error(`Can't find ${path}`)
  }
  return result
}
