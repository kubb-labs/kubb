type Data = string[][]

type Options = {
  typed?: boolean
}

export const objectToParameters = (data: Data, options: Options = {}) => {
  return data
    .reduce((acc, [key, value]) => {
      if (options.typed) {
        acc.push(`${key}: ${value}["${key}"], `)
      } else {
        acc.push(`${key},`)
      }

      return acc
    }, [] as string[])
    .join('')
}
