import type { VendorResponse } from "./VendorResponse.ts";

export type PageVendorResponse = {
    /**
     * @type string
    */
    next_cursor?: string | null;
    /**
     * @type array
    */
    items: VendorResponse[];
};