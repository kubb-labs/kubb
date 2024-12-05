/**
 * @description successful operation
*/
export type GetInventory200 = {
    [key: string]: number;
};

 export type GetInventoryQueryResponse = GetInventory200;

 export type GetInventoryQuery = {
    Response: GetInventory200;
    Errors: any;
};