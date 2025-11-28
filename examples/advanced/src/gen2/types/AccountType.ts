export const accountTypeEnum = {
    "CHECKING": "CHECKING",
    "SAVING": "SAVING"
} as const;

export type AccountTypeEnumKey = (typeof accountTypeEnum)[keyof typeof accountTypeEnum];

export type AccountType = AccountTypeEnumKey;