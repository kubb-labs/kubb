export const transferCancellationReasonEnum = {
    "USER_CANCELLED": "USER_CANCELLED",
    "INSUFFICIENT_FUNDS": "INSUFFICIENT_FUNDS",
    "APPROVAL_DENIED": "APPROVAL_DENIED",
    "BLOCKED_BY_POSITIVE_PAY": "BLOCKED_BY_POSITIVE_PAY"
} as const;

export type TransferCancellationReasonEnumKey = (typeof transferCancellationReasonEnum)[keyof typeof transferCancellationReasonEnum];

/**
 * @description `USER_CANCELLED`: The transfer was canceled.\n`INSUFFICIENT_FUNDS`: The transfer could not be sent due to insufficient funds.\n`APPROVAL_DENIED`: The transfer was not sent because it was denied.\n`BLOCKED_BY_POSITIVE_PAY`: The transfer was blocked because of the ACH debit settings.\n
*/
export type TransferCancellationReason = TransferCancellationReasonEnumKey;