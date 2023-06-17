export function getErrorCause(error: Error): Error {
  if (error.cause) {
    return getErrorCause(error)
  }

  return error
}
