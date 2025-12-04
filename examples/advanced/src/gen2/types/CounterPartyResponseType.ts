export const counterPartyResponseTypeEnum = {
  VENDOR: 'VENDOR',
  BOOK_TRANSFER: 'BOOK_TRANSFER',
  BANK_ACCOUNT: 'BANK_ACCOUNT',
} as const

export type CounterPartyResponseTypeEnumKey = (typeof counterPartyResponseTypeEnum)[keyof typeof counterPartyResponseTypeEnum]

export type CounterPartyResponseType = CounterPartyResponseTypeEnumKey
