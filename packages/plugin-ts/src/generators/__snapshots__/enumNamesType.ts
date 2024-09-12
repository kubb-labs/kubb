export const enumNamesType = {
    "Pending": 0,
    "Received": 1
} as const;

 export type EnumNamesTypeEnum2 = (typeof enumNamesType)[keyof typeof enumNamesType];

 export type enumNamesType = EnumNamesTypeEnum2;
