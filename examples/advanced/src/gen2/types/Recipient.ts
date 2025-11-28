import type { RecipientType } from "./RecipientType.ts";

export type Recipient = {
    /**
     * @description Specifies the type of the recipient. \n`ACCOUNT_ID` is the ID of a Brex Business account.\n`PAYMENT_INSTRUMENT_ID` is the ID of Payment Instrument of the receiving Brex account.\n
     * @type string
    */
    type: RecipientType;
    /**
     * @type string
    */
    id: string;
};