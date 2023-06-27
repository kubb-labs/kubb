export const uniqueIdFactory =
  (counter: number) =>
  (str = ''): string =>
    `${str}${++counter}`
