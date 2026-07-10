import * as movidesk from './movideskClient.js';
import { validateUpdateTicketPayload } from './updateTicketValidation.js';
import { toText, toError } from './toolResult.js';
export async function handleUpdateTicket(params) {
    const { id, ...ticket } = params;
    const validation = validateUpdateTicketPayload(ticket);
    if (!validation.ok) {
        return toError(validation.message);
    }
    const result = await movidesk.patch('/tickets', ticket, { id });
    return toText(result);
}
//# sourceMappingURL=updateTicketHandler.js.map