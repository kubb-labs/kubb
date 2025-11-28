export const approvalTypeEnum = {
    "MANUAL": "MANUAL"
} as const;

export type ApprovalTypeEnumKey = (typeof approvalTypeEnum)[keyof typeof approvalTypeEnum];

/**
 * @description Specifies the approval type for the transaction. \n`MANUAL` requires a cash admin to approve the transaction before disbursing funds. \nWhen not set, the default policy will apply.
*/
export type ApprovalType = ApprovalTypeEnumKey;