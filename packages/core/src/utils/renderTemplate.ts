export function renderTemplate<TData extends Record<string, unknown> = Record<string, unknown>>(template: string, data: TData | undefined = undefined): string {
  if (!data || !Object.keys(data).length) {
    return template.replace(/{{(.*?)}}/g, '')
  }

  const matches = template.match(/{{(.*?)}}/g)

  return (
    matches?.reduce((prev, curr) => {
      const value = data[curr.split(/{{|}}/).filter(Boolean)[0].trim()]

      if (value === undefined) {
        console.log({ prev })
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

  // return template
  //   .replace(/{{(.*?)}}/g, (match, ...rest) => {
  //     const value = data[match.split(/{{|}}/).filter(Boolean)[0].trim()]

  //     if (value === undefined && Object.keys(data).length) {
  //       // return template
  //     }

  //     if (typeof value === 'boolean') {
  //       return `${value.toString()}` || 'false'
  //     }

  //     template = (value as string) || ''

  //     return template
  //   })
  //   .trim()
}
