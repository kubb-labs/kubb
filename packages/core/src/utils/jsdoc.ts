export function createJSDocBlockText({ comments }: { comments: Array<string> }): string {
  const filteredComments = comments.filter(Boolean)

  if (!filteredComments.length) {
    return ''
  }

  const text = filteredComments.reduce((acc, comment) => {
    return `${acc}\n* ${comment}`
  }, '/**')

  return `${text}\n*/`
}
