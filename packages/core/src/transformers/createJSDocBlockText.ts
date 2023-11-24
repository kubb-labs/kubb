export function createJSDocBlockText({ comments, newLine }: { comments: Array<string>; newLine?: boolean }): string {
  const filteredComments = comments.filter(Boolean)

  if (!filteredComments.length) {
    return ''
  }

  const source = `/**\n * ${filteredComments.join('\n * ')}\n */`

  if (newLine) {
    return `${source}\n`
  }

  return source
}
