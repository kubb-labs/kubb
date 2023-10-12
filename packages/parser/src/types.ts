export type ArrayTwoOrMore<T> = {
  0: T
  1: T
} & Array<T>
