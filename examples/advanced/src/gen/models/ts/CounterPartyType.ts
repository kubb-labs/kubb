export const counterPartyTypeEnum = {
  VENDOR: 'VENDOR',
  BOOK_TRANSFER: 'BOOK_TRANSFER',
} as const

export type CounterPartyTypeEnumKey = (typeof counterPartyTypeEnum)[keyof typeof counterPartyTypeEnum]

export type CounterPartyType = CounterPartyTypeEnumKey
