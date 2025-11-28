import type { CounterPartyResponse } from "./CounterPartyResponse.ts";
import type { Money } from "./Money.ts";
import type { OriginatingAccountResponse } from "./OriginatingAccountResponse.ts";
import type { PaymentType } from "./PaymentType.ts";
import type { TransferCancellationReason } from "./TransferCancellationReason.ts";
import type { TransferStatus } from "./TransferStatus.ts";

export type Transfer = {
    /**
     * @description Unique ID associated with the transfer
     * @type string
    */
    id: string;
    counterparty?: CounterPartyResponse | null;
    /**
     * @description Description of the transfer
     * @type string
    */
    description?: string | null;
    /**
     * @type string
    */
    payment_type: PaymentType;
    /**
     * @description \nMoney fields can be signed or unsigned. Fields are signed (an unsigned value will be interpreted as positive). The amount of money will be represented in the smallest denomination\nof the currency indicated. For example, USD 7.00 will be represented in cents with an amount of 700.\n
     * @type object
    */
    amount: Money;
    /**
     * @description Transaction processing date
     * @type string, date
    */
    process_date?: string | null;
    /**
     * @description Originating account details for the transfer
     * @type object
    */
    originating_account: OriginatingAccountResponse;
    /**
     * @description `PROCESSING`: We have started to process the sending or receiving of this transaction.\n`SCHEDULED`: The transaction is scheduled to enter the `PROCESSING` status.\n`PENDING_APPROVAL`: The transaction requires approval before it can enter the `SCHEDULED` or `PROCESSING` status.\n`FAILED`: A grouping of multiple terminal states that prevented the transaction from completing.\nThis includes a a user-cancellation, approval being denied, insufficient funds, failed verifications, etc.\n`PROCESSED`: The money movement has been fully completed, which could mean money sent has arrived.\n
     * @type string
    */
    status: TransferStatus;
    cancellation_reason?: TransferCancellationReason | null;
    /**
     * @description Estimated delivery date for transfer
     * @type string, date
    */
    estimated_delivery_date?: string | null;
    /**
     * @description User ID of the transfer initiator
     * @type string
    */
    creator_user_id?: string | null;
    /**
     * @description Date of transfer creation
     * @type string, date
    */
    created_at?: string | null;
    /**
     * @description Human readable name for the transaction
     * @type string
    */
    display_name?: string | null;
    /**
     * @description External memo for the transfer. `Payment Instructions` for Wires and the `Entry Description` for ACH payments. \nMust be at most 90 characters for `ACH` and `WIRE` transactions\nand at most 40 characters for `CHEQUES`\n
     * @maxLength 90
     * @type string
    */
    external_memo?: string | null;
    /**
     * @description If Principal Protection (PPRO) is enabled
     * @type boolean
    */
    is_ppro_enabled?: boolean | null;
};