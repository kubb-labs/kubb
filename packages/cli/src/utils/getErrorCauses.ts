export function getErrorCauses(errors: Error[]): Error[] {
  return errors
    .reduce((prev, error) => {
      const causedError = error?.cause as Error
      if (causedError) {
        prev = [...prev, ...getErrorCauses([causedError])]
        return prev
      }
      prev = [...prev, error]

      return prev
    }, [] as Error[])
    .filter(Boolean)
}
