export const accountClassEnum = {
    "BUSINESS": "BUSINESS",
    "PERSONAL": "PERSONAL"
} as const;

export type AccountClassEnumKey = (typeof accountClassEnum)[keyof typeof accountClassEnum];

export type AccountClass = AccountClassEnumKey;