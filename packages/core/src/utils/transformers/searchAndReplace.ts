type Options = {
  text: string
  replaceBy: string
  prefix?: string
  key: string
  searchValues?: (prefix: string, key: string) => Array<RegExp | string>
}

export function searchAndReplace(options: Options): string {
  const { text, replaceBy, prefix = '', key } = options

  const searchValues = options.searchValues?.(prefix, key) || [
    `${prefix}["${key}"]`,
    `${prefix}['${key}']`,
    `${prefix}[\`${key}\`]`,
    `${prefix}"${key}"`,
    `${prefix}'${key}'`,
    `${prefix}\`${key}\``,
    new RegExp(`${prefix}${key}`, 'g'),
  ]

  return searchValues.reduce((prev, searchValue) => {
    return prev.toString().replaceAll(searchValue, replaceBy)
  }, text) as string
}
