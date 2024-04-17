export const orderStatus = {
    "placed": "placed",
    "approved": "approved",
    "delivered": "delivered"
} as const;
export type OrderStatus = (typeof orderStatus)[keyof typeof orderStatus];
export const orderHttpStatus = {
    "200": 200,
    "400": 400,
    "500": 500
} as const;
export type OrderHttpStatus = (typeof orderHttpStatus)[keyof typeof orderHttpStatus];
export type Order = {
    /**
     * @type integer | undefined, int64
    */
    id?: number;
    /**
     * @type integer | undefined, int64
    */
    petId?: number;
    /**
     * @type integer | undefined, int32
    */
    quantity?: number;
    /**
     * @type string | undefined, date-time
    */
    shipDate?: string;
    /**
     * @description Order Status
     * @type string | undefined
    */
    status?: OrderStatus;
    /**
     * @description HTTP Status
     * @type number | undefined
    */
    http_status?: OrderHttpStatus;
    /**
     * @type boolean | undefined
    */
    complete?: boolean;
};