export const orderStatusEnum = {
    "placed": "placed",
    "approved": "approved",
    "delivered": "delivered"
} as const;

 export type OrderStatusEnum = (typeof orderStatusEnum)[keyof typeof orderStatusEnum];

 export const orderHttpStatusEnum = {
    "200": 200,
    "400": 400,
    "500": 500
} as const;

 export type OrderHttpStatusEnum = (typeof orderHttpStatusEnum)[keyof typeof orderHttpStatusEnum];

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
    status?: OrderStatusEnum;
    /**
     * @description HTTP Status
     * @type number | undefined
    */
    http_status?: OrderHttpStatusEnum;
    /**
     * @type boolean | undefined
    */
    complete?: boolean;
};