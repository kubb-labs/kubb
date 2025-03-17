export type FooNumbertypeEnum2 = 'type-number'

export type fooNumber = fooBase & {
  /**
   * @type number
   */
  value: number
  $type: FooNumbertypeEnum2
}
