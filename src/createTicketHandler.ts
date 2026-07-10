import * as movidesk from './movideskClient.js';
import { validateCreateTicketPayload } from './createTicketValidation.js';
import { type ToolResult, toText, toError } from './toolResult.js';

export async function handleCreateTicket(params: Record<string, unknown>): Promise<ToolResult> {
  const validation = validateCreateTicketPayload(params);
  if (!validation.ok) {
    return toError(validation.message);
  }

  const result = await movidesk.post('/tickets', params);
  return toText(result);
}
