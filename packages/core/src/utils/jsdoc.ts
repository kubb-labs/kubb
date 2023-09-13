export function createJSDocBlockText({ comments }: { comments: Array<string> }): string {
  const filteredComments = comments.filter(Boolean)

  if (!filteredComments.length) {
    return ''
  }

  return `/**\n * ${filteredComments.join('\n * ')}\n */`
}
