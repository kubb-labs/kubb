import get from 'lodash.get'

// See https://swagger.io/docs/specification/using-ref/
export function getReference(spec: unknown, ref: string) {
  const path = ref
    .slice(2)
    .split('/')
    .map((s) => unescape(s.replace(/~1/g, '/').replace(/~0/g, '~')))

  const ret = get(spec, path)
  if (typeof ret === 'undefined') {
    throw new Error(`Can't find ${path}`)
  }
  return ret
}
