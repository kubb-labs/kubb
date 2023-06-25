export function renderTemplate<TData extends Record<string, unknown> = Record<string, unknown>>(template: string, data: TData | undefined = undefined): string {
  if (!data) {
    return template.replace(/{{(.*?)}}/g, '')
  }

  return template
    .replace(/{{(.*?)}}/g, (match) => {
      const value = data[match.split(/{{|}}/).filter(Boolean)[0].trim()]

      if (typeof value === 'boolean') {
        return `${value.toString()}` || 'false'
      }

      return (value as string) || ''
    })
    .trim()
}
