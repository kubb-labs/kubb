import { Logtail } from "@logtail/node";
import { consola } from "consola";

type LogContext = Record<string, string | number | boolean | null | undefined>;
type LogLevel = "info" | "success" | "warn" | "error";

let logtail: Logtail | null = null;

function getLogtail(): Logtail | null {
  if (logtail) {
    return logtail;
  }

  const token = process.env.OTLP_TOKEN;

  if (!token) {
    return null;
  }

  try {
    logtail = new Logtail(token, {
      endpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
    });

    return logtail;
  } catch {
    return null;
  }
}

function toBetterStackContext(
  ctx?: LogContext,
): Record<string, unknown> | undefined {
  if (!ctx) return undefined;
  const filtered = Object.fromEntries(
    Object.entries(ctx).filter(([, v]) => v !== undefined && v !== null),
  );

  return Object.keys(filtered).length
    ? (filtered as Record<string, unknown>)
    : undefined;
}

function sendToBetterStack(
  level: LogLevel,
  tag: string,
  message?: string,
  ctx?: LogContext,
) {
  const client = getLogtail();
  if (!client) {
    return;
  }

  try {
    const fullMessage = message !== undefined ? `[${tag}] ${message}` : tag;
    const context = toBetterStackContext(ctx);
    if (level === "error") {
      client.error(fullMessage, context).then(() => client.flush());
    } else if (level === "warn") {
      client.warn(fullMessage, context).then(() => client.flush());
    } else {
      client.info(fullMessage, context).then(() => client.flush());
    }
  } catch (_e) {
    // Never let BetterStack break the app
  }
}

function log(level: LogLevel, tag: string, message?: string, ctx?: LogContext) {
  const displayMessage = message !== undefined ? `[${tag}] ${message}` : tag;
  consola[level](displayMessage);

  if (ctx) {
    const filtered = Object.fromEntries(
      Object.entries(ctx).filter(([, v]) => v !== undefined && v !== null),
    );
    if (Object.keys(filtered).length) {
      console.table(filtered);
    }
  }

  if (process.env.OTEL_EXPORTER_OTLP_ENDPOINT && process.env.OTLP_TOKEN) {
    sendToBetterStack(level, tag, message, ctx);
  }
}

export const logger = {
  info: (tag: string, message?: string, ctx?: LogContext) =>
    log("info", tag, message, ctx),
  success: (tag: string, message?: string, ctx?: LogContext) =>
    log("success", tag, message, ctx),
  warn: (tag: string, message?: string, ctx?: LogContext) =>
    log("warn", tag, message, ctx),
  error: (tag: string, message?: string, ctx?: LogContext) =>
    log("error", tag, message, ctx),
};
