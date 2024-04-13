import { Address } from "./Address";

 export type Customer = {
    /**
     * @type integer | undefined, int64
    */
    id?: number;
    /**
     * @type string | undefined
    */
    username?: string;
    /**
     * @type array | undefined
    */
    address?: Address[];
};