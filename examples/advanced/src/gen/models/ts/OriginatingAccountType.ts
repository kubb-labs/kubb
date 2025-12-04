export const originatingAccountTypeEnum = {
  BREX_CASH: 'BREX_CASH',
} as const

export type OriginatingAccountTypeEnumKey = (typeof originatingAccountTypeEnum)[keyof typeof originatingAccountTypeEnum]

export type OriginatingAccountType = OriginatingAccountTypeEnumKey
