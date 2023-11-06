import GenericException from "../generic.exception";


export default class DuplicateException extends GenericException {
    constructor(message: string | string[]) {
        if (message instanceof Array) message = message.join(", ");
        super({message, status: 409, internalStatus: "DUPLICATE"});
    }
}