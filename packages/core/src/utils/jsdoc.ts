export const createJSDocBlockText = ({ comments }: { comments: Array<string | undefined> }) => {
  const filteredComments = comments.filter(Boolean)

  if (!filteredComments.length) {
    return undefined
  }

  const text = filteredComments.reduce((acc, comment) => {
    return `${acc}\n* ${comment}`
  }, '/**')

  return `${text}\n*/`
}
