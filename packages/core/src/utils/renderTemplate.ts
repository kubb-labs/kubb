export function renderTemplate<TData extends Record<string, unknown> = Record<string, unknown>>(template: string, data: TData | undefined = undefined): string {
  if (!data || !Object.keys(data).length) {
    return template.replace(/{{(.*?)}}/g, '')
  }

  const matches = template.match(/{{(.*?)}}/g)

  return (
    matches?.reduce((prev, curr) => {
      const index = curr.split(/{{|}}/).filter(Boolean)[0]?.trim()
      if (index === undefined) {
        return prev
      }
      const value = data[index]

      if (value === undefined) {
        return prev
      }

      return prev
        .replace(curr, () => {
          if (typeof value === 'boolean') {
            return `${value.toString()}` || 'false'
          }

          return (value as string) || ''
        })
        .trim()
    }, template) || ''
  )
}
