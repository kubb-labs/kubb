import type { PaymentAccountRequest } from "./PaymentAccountRequest.ts";

export type UpdateVendorRequest = {
    /**
     * @description Name for vendor
     * @type string
    */
    company_name?: string | null;
    /**
     * @description Email for vendor
     * @type string, email
    */
    email?: string | null;
    /**
     * @description Phone number for vendor
     * @type string
    */
    phone?: string | null;
    /**
     * @description To update payment instruments, we require the entire payload for each payment instrument that is being updated.\n
     * @type array
    */
    payment_accounts?: PaymentAccountRequest[] | null;
    /**
     * @description Name for the Beneficiary
     * @type string
    */
    beneficiary_name?: string | null;
};