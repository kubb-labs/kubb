// Custom banner

/**
 * @type integer
*/
export type CustomGetItemPathId = number;


/**
 * @description A simple item
 * @type object
*/
export type CustomGetItemStatus200 = Item;


/**
 * @type object
*/
export type CustomGetItemRequestConfig = {
    data?: never;
    /**
     * @type object
    */
    pathParams: {
        id: CustomGetItemPathId;
    };
    queryParams?: never;
    headerParams?: never;
    /**
     * @type string
    */
    url: `/items/${string}`;
};


/**
 * @type object
*/
export type CustomGetItemResponses = {
    "200": CustomGetItemStatus200;
};


/**
 * @description Union of all possible responses
*/
export type CustomGetItemResponse = CustomGetItemStatus200;