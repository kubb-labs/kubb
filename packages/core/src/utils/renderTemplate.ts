export function renderTemplate<TData extends Record<string, string> = Record<string, string>>(template: string, data: TData | undefined = undefined) {
  if (!data) {
    return template.replace(/{{(.*?)}}/g, '')
  }

  return template.replace(/{{(.*?)}}/g, (match) => {
    const value = data[match.split(/{{|}}/).filter(Boolean)[0].trim()]

    return value || ''
  })
}
