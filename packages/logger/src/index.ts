import pino from "pino";
import pretty from "pino-pretty";

const isProduction = process.env.NODE_ENV === "production";

const baseOptions: pino.LoggerOptions = {
  name: "saltwise",
  level: isProduction ? "info" : "debug",
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => ({ severity: label.toUpperCase() }),
  },
  redact: [
    "apiKey",
    "password",
    "token",
    "authorization",
    "cookie",
    "GROQ_API_KEY",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ],
};

const stream = isProduction
  ? undefined
  : pretty({
      colorize: true,
      ignore: "pid,hostname",
      translateTime: "SYS:standard",
    });

export const rootLogger = pino(baseOptions, stream);

export const authLogger = rootLogger.child({ module: "auth" });
export const aiLogger = rootLogger.child({ module: "ai" });
export const dbLogger = rootLogger.child({ module: "db" });
export const apiLogger = rootLogger.child({ module: "api" });

export const createRequestLogger = (
  requestId: string,
  userId?: string
): pino.Logger => apiLogger.child({ requestId, userId });

export type {
  AiLogContext,
  AuthLogContext,
  DbLogContext,
  RequestContext,
} from "./types";
