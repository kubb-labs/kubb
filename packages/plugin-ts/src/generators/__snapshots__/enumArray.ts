export const enumArrayIdentifierEnum2 = {
  NW: 'NW',
  NE: 'NE',
  SW: 'SW',
  SE: 'SE',
} as const

export type EnumArray = (typeof enumArrayIdentifierEnum2)[keyof typeof enumArrayIdentifierEnum2]

export type enumArray = {
  /**
   * @type array | undefined
   */
  identifier?: [number, string, EnumArray]
}
