export const bankTypeEnum = {
    "CHECKING": "CHECKING",
    "SAVING": "SAVING"
} as const;

export type BankTypeEnumKey = (typeof bankTypeEnum)[keyof typeof bankTypeEnum];

export type BankType = BankTypeEnumKey;