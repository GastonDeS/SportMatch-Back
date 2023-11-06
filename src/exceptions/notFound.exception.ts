import GenericException from "./generic.exception";

export default class NotFoundException extends GenericException {
    constructor(itemName: string) {
        super({
            status: 404,
            internalStatus: "NOT_FOUND",
            message: `${itemName} not found`,
        });
    }
}