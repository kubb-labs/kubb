type Data = string[][]

type Options = {
  typed?: boolean
}

export function objectToParameters(data: Data, options: Options = {}) {
  const { typed } = options

  return data
    .reduce((acc, [key, value]) => {
      if (typed) {
        acc.push(`${key}: ${value}["${key}"]`)
      } else {
        acc.push(`${key}`)
      }

      return acc
    }, [] as string[])
    .join(', ')
}
