export const enumNullableTypeEnum2 = {
    "first": "first",
    "second": "second"
} as const;

 export type EnumNullableTypeEnum2 = (typeof enumNullableTypeEnum2)[keyof typeof enumNullableTypeEnum2];

 export type enumNullableType = EnumNullableTypeEnum2 | null;
