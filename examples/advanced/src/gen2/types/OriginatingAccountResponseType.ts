export const originatingAccountResponseTypeEnum = {
    "BREX_CASH": "BREX_CASH"
} as const;

export type OriginatingAccountResponseTypeEnumKey = (typeof originatingAccountResponseTypeEnum)[keyof typeof originatingAccountResponseTypeEnum];

export type OriginatingAccountResponseType = OriginatingAccountResponseTypeEnumKey;