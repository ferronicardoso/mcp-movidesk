import * as movidesk from './movideskClient.js';
import { validateUpdateTicketPayload } from './updateTicketValidation.js';
import { type ToolResult, toText, toError } from './toolResult.js';

export async function handleUpdateTicket(params: Record<string, unknown>): Promise<ToolResult> {
  const { id, ...ticket } = params as { id: number; [key: string]: unknown };

  const validation = validateUpdateTicketPayload(ticket);
  if (!validation.ok) {
    return toError(validation.message);
  }

  const result = await movidesk.patch('/tickets', ticket, { id });
  return toText(result);
}
