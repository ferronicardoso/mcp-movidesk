import * as movidesk from './movideskClient.js';
import { validateCreateTicketPayload } from './createTicketValidation.js';
import { toText, toError } from './toolResult.js';
export async function handleCreateTicket(params) {
    const validation = validateCreateTicketPayload(params);
    if (!validation.ok) {
        return toError(validation.message);
    }
    const result = await movidesk.post('/tickets', params);
    return toText(result);
}
//# sourceMappingURL=createTicketHandler.js.map