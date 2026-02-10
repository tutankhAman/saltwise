export interface RequestContext {
  requestId: string;
  userId?: string;
  path?: string;
  method?: string;
}

export interface AiLogContext {
  model?: string;
  conversationId?: string;
  messageCount?: number;
  tokens?: number;
  durationMs?: number;
}

export interface AuthLogContext {
  userId?: string;
  provider?: string;
  event?: "sign_in" | "sign_out" | "session_refresh" | "session_expired";
}

export interface DbLogContext {
  table?: string;
  operation?: "insert" | "select" | "update" | "delete";
  rowCount?: number;
  durationMs?: number;
}
