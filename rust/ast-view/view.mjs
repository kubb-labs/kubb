// Shared-memory AST: one flat buffer, read back through lazy views that look like plain AST objects.
//
// `encode` stands in for the Rust side: it writes the TypeScript adapter's `InputNode` into the
// layout below. `view` is the part plugins would really run on: it decodes nothing up front, and
// each object or array is decoded once, the first time a plugin reads it.
//
// Layout (all little-endian u32 unless noted):
//   slot   = [tag, payload]           tag: UNDEF NULL FALSE TRUE NUM STR ARR OBJ
//   object = [shapeId, slot * keys]   keys of the shape, in insertion order
//   array  = [length, slot * length]
//   numbers live in a Float64Array side table, strings as UTF-8 bytes with an offset/length table.
// Objects are written once per identity, so shared subtrees stay shared after decoding.

const UNDEF = 0
const NULL = 1
const FALSE = 2
const TRUE = 3
const NUM = 4
const STR = 5
const ARR = 6
const OBJ = 7
const ASCII = 0x8000_0000

export function encode(root) {
  const words = []
  const numbers = []
  const strings = new Map()
  const shapes = new Map()
  const written = new Map()

  const str = (value) => {
    let id = strings.get(value)
    if (id === undefined) strings.set(value, (id = strings.size))
    return id
  }
  const shape = (keys) => {
    const key = keys.join('\0')
    let id = shapes.get(key)
    if (id === undefined) shapes.set(key, (id = shapes.size))
    return id
  }
  // Returns [tag, payload]; containers are written before their parent's slot, children before the container.
  const slot = (value) => {
    if (value === undefined) return [UNDEF, 0]
    if (value === null) return [NULL, 0]
    if (value === false) return [FALSE, 0]
    if (value === true) return [TRUE, 0]
    if (typeof value === 'number') return [NUM, numbers.push(value) - 1]
    if (typeof value === 'string') return [STR, str(value)]
    if (typeof value !== 'object' || (!Array.isArray(value) && Object.getPrototypeOf(value) !== Object.prototype)) {
      throw new TypeError(`Cannot encode ${typeof value} ${value?.constructor?.name ?? ''}`)
    }
    const done = written.get(value)
    if (done !== undefined) return [Array.isArray(value) ? ARR : OBJ, done]
    const isArray = Array.isArray(value)
    const keys = isArray ? null : Object.keys(value)
    const children = isArray ? value.map(slot) : keys.map((k) => slot(value[k]))
    const offset = words.length
    written.set(value, offset)
    words.push(isArray ? value.length : shape(keys))
    for (const [tag, payload] of children) words.push(tag, payload)
    return [isArray ? ARR : OBJ, offset]
  }

  const [rootTag, rootOffset] = slot(root)
  if (rootTag !== OBJ) throw new TypeError('The root must be an object')

  const encoder = new TextEncoder()
  const encoded = [...strings.keys()].map((s) => encoder.encode(s))
  const stringTable = new Uint32Array(encoded.length * 2)
  let byteLength = 0
  encoded.forEach((bytes, i) => {
    stringTable[i * 2] = byteLength
    stringTable[i * 2 + 1] = bytes.length | (bytes.every((b) => b < 0x80) ? ASCII : 0)
    byteLength += bytes.length
  })
  const bytes = Buffer.allocUnsafe(byteLength)
  encoded.forEach((chunk, i) => bytes.set(chunk, stringTable[i * 2]))

  return {
    words: Uint32Array.from(words),
    numbers: Float64Array.from(numbers),
    stringTable,
    bytes,
    shapes: [...shapes.keys()].map((key) => (key ? key.split('\0') : [])),
    root: rootOffset,
  }
}

/**
 * Returns the root object of an encoded AST. Objects are real plain objects: scalar fields are data
 * properties, object and array fields are own enumerable getters that decode the child on first read and
 * then turn into data properties. Spread, `Object.keys`, `JSON.stringify` and assignment all work.
 */
export function view({ words, numbers, stringTable, bytes, shapes, root }) {
  const stringCache = new Array(stringTable.length / 2)
  const objectCache = new Map()

  const string = (id) => {
    let value = stringCache[id]
    if (value === undefined) {
      const start = stringTable[id * 2]
      const length = stringTable[id * 2 + 1]
      value = stringCache[id] = length & ASCII ? bytes.latin1Slice(start, start + (length & ~ASCII)) : bytes.utf8Slice(start, start + length)
    }
    return value
  }

  const value = (at) => {
    const payload = words[at + 1]
    switch (words[at]) {
      case UNDEF:
        return undefined
      case NULL:
        return null
      case FALSE:
        return false
      case TRUE:
        return true
      case NUM:
        return numbers[payload]
      case STR:
        return string(payload)
      case ARR:
        return array(payload)
      default:
        return object(payload)
    }
  }

  const array = (offset) => {
    let out = objectCache.get(offset)
    if (out) return out
    const length = words[offset]
    out = new Array(length)
    objectCache.set(offset, out)
    for (let i = 0; i < length; i++) out[i] = value(offset + 1 + i * 2)
    return out
  }

  const lazy = (target, key, at) => {
    Object.defineProperty(target, key, {
      enumerable: true,
      configurable: true,
      get() {
        const resolved = value(at)
        Object.defineProperty(target, key, { value: resolved, writable: true, enumerable: true, configurable: true })
        return resolved
      },
      set(next) {
        Object.defineProperty(target, key, { value: next, writable: true, enumerable: true, configurable: true })
      },
    })
  }

  const object = (offset) => {
    let out = objectCache.get(offset)
    if (out) return out
    out = {}
    objectCache.set(offset, out)
    const keys = shapes[words[offset]]
    for (let i = 0; i < keys.length; i++) {
      const at = offset + 1 + i * 2
      const tag = words[at]
      if (tag === OBJ || tag === ARR) lazy(out, keys[i], at)
      else out[keys[i]] = value(at)
    }
    return out
  }

  return object(root)
}

/** Total bytes the encoded AST occupies. */
export const byteSize = (encoded) => encoded.words.byteLength + encoded.numbers.byteLength + encoded.stringTable.byteLength + encoded.bytes.byteLength

/**
 * Decodes the whole AST at once into plain objects. Each shape gets one generated constructor, so
 * objects of a shape share a hidden class the way object literals do.
 */
export function decode({ words, numbers, stringTable, bytes, shapes, root }) {
  const strings = new Array(stringTable.length / 2)
  for (let id = 0; id < strings.length; id++) {
    const start = stringTable[id * 2]
    const length = stringTable[id * 2 + 1]
    strings[id] = length & ASCII ? bytes.latin1Slice(start, start + (length & ~ASCII)) : bytes.utf8Slice(start, start + length)
  }
  const done = new Map()
  const value = (at) => {
    const payload = words[at + 1]
    switch (words[at]) {
      case UNDEF:
        return undefined
      case NULL:
        return null
      case FALSE:
        return false
      case TRUE:
        return true
      case NUM:
        return numbers[payload]
      case STR:
        return strings[payload]
      case ARR: {
        let out = done.get(payload)
        if (out) return out
        const length = words[payload]
        out = new Array(length)
        done.set(payload, out)
        for (let i = 0; i < length; i++) out[i] = value(payload + 1 + i * 2)
        return out
      }
      default:
        return object(payload)
    }
  }
  const object = (offset) => {
    let out = done.get(offset)
    if (out) return out
    out = make[words[offset]](value, offset + 1)
    done.set(offset, out)
    return out
  }
  // shortcut: children are decoded before the parent is cached, so a cycle would recurse forever; the adapter's AST has none.
  const make = shapes.map((keys) => new Function('v', 'o', `return {${keys.map((k, i) => `${JSON.stringify(k)}: v(o + ${i * 2})`).join(', ')}}`))
  return object(root)
}

/**
 * Rebuilds a plain AST without a buffer, to tell apart what makes the eager decode faster:
 * `objects` rebuilds every object through one literal constructor per key list, `strings` gives equal
 * strings one shared instance. Shared subtrees stay shared.
 */
export function reshape(root, { objects, strings }) {
  const done = new Map()
  const canonical = new Map()
  const makers = new Map()
  const maker = (keys) => {
    const id = keys.join('\0')
    let make = makers.get(id)
    if (!make) makers.set(id, (make = new Function('s', `return {${keys.map((k) => `${JSON.stringify(k)}: s[${JSON.stringify(k)}]`).join(', ')}}`)))
    return make
  }
  const walk = (value) => {
    if (typeof value === 'string') {
      if (!strings) return value
      const seen = canonical.get(value)
      if (seen !== undefined) return seen
      canonical.set(value, value)
      return value
    }
    if (!value || typeof value !== 'object') return value
    let out = done.get(value)
    if (out) return out
    if (Array.isArray(value)) {
      out = new Array(value.length)
      done.set(value, out)
      for (let i = 0; i < value.length; i++) out[i] = walk(value[i])
      return out
    }
    const keys = Object.keys(value)
    const walked = {}
    for (const key of keys) walked[key] = walk(value[key])
    out = objects ? maker(keys)(walked) : Object.assign(value, walked)
    done.set(value, out)
    return out
  }
  return walk(root)
}
