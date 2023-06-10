export const uniqueId = (
  (counter) =>
  (str = '') =>
    `${str}${++counter}`
)(0)
