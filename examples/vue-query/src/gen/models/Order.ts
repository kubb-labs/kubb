export const orderStatusEnum = {
    "placed": "placed",
    "approved": "approved",
    "delivered": "delivered"
} as const;

 export type OrderStatusEnum = (typeof orderStatusEnum)[keyof typeof orderStatusEnum];

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
     * @type boolean | undefined
    */
    complete?: boolean;
};