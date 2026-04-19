import type { FileNode } from "@kubb/ast";
import type { AsyncEventEmitter, KubbHooks } from "@kubb/core";
import WebSocket from "ws";
import type { AgentMessage, DataMessagePayload } from "~/types/agent.ts";
import { websocketDefaults } from "../constants.ts";

type WebSocketOptions = WebSocket.ClientOptions;

/**
 * Opens a Studio WebSocket connection and closes it when the initial handshake exceeds the configured timeout.
 */
export function createWebsocket(
  url: string,
  options: WebSocketOptions,
  timeoutMs = websocketDefaults.connectTimeoutMs,
): WebSocket {
  const ws = new WebSocket(url, options);

  setTimeout(() => {
    if (ws.readyState === WebSocket.CONNECTING) {
      ws.close(
        websocketDefaults.closeCode.timeout,
        websocketDefaults.closeReason.timeout,
      );
    }
  }, timeoutMs);

  return ws;
}

/**
 * Sends a serialized agent message when the Studio socket is ready to accept frames.
 */
export function sendAgentMessage(ws: WebSocket, message: AgentMessage): void {
  try {
    if (ws.readyState !== WebSocket.OPEN) {
      return;
    }

    ws.send(JSON.stringify(message));
  } catch (error: any) {
    throw new Error("Failed to send message to Kubb Studio", { cause: error });
  }
}

/**
 * Forwards selected Kubb lifecycle events to Studio as data messages for the active session.
 */
export function setupEventsStream(
  ws: WebSocket,
  hooks: AsyncEventEmitter<KubbHooks>,
  getSource?: () => "generate" | "publish" | undefined,
): void {
  function sendDataMessage(payload: DataMessagePayload) {
    sendAgentMessage(ws, {
      type: "data",
      payload: { ...payload, source: getSource?.() },
    });
  }

  hooks.on("kubb:plugin:start", (plugin) => {
    sendDataMessage({
      type: "kubb:plugin:start",
      data: [plugin],
      timestamp: Date.now(),
    });
  });

  hooks.on("kubb:plugin:end", (plugin, meta) => {
    sendDataMessage({
      type: "kubb:plugin:end",
      data: [plugin, meta],
      timestamp: Date.now(),
    });
  });

  hooks.on("kubb:files:processing:start", (files) => {
    sendDataMessage({
      type: "kubb:files:processing:start",
      data: [{ total: files.length }],
      timestamp: Date.now(),
    });
  });

  hooks.on("kubb:file:processing:update", (meta) => {
    sendDataMessage({
      type: "kubb:file:processing:update",
      data: [
        {
          file: meta.file.path,
          processed: meta.processed,
          total: meta.total,
          percentage: meta.percentage,
        },
      ],
      timestamp: Date.now(),
    });
  });

  hooks.on("kubb:files:processing:end", (files) => {
    sendDataMessage({
      type: "kubb:files:processing:end",
      data: [{ total: files.length }],
      timestamp: Date.now(),
    });
  });

  hooks.on("kubb:info", (message, info) => {
    sendDataMessage({
      type: "kubb:info",
      data: [message, info],
      timestamp: Date.now(),
    });
  });

  hooks.on("kubb:success", (message, info) => {
    sendDataMessage({
      type: "kubb:success",
      data: [message, info],
      timestamp: Date.now(),
    });
  });

  hooks.on("kubb:warn", (message, info) => {
    sendDataMessage({
      type: "kubb:warn",
      data: [message, info],
      timestamp: Date.now(),
    });
  });

  hooks.on("kubb:generation:start", (config) => {
    sendDataMessage({
      type: "kubb:generation:start",
      data: [
        {
          name: config.name,
          plugins: config.plugins.length,
        },
      ],
      timestamp: Date.now(),
    });
  });

  hooks.on("kubb:generation:end", (config, files, sources) => {
    const sourcesRecord: Record<string, string> = {};

    sources.forEach((value, key) => {
      sourcesRecord[key] = value;
    });
    sendDataMessage({
      type: "kubb:generation:end",
      data: [config, files as unknown as FileNode[], sourcesRecord],
      timestamp: Date.now(),
    });
  });

  hooks.on("kubb:error", (error) => {
    sendDataMessage({
      type: "kubb:error",
      data: [
        {
          message: error.message,
          stack: error.stack,
        },
      ],
      timestamp: Date.now(),
    });
  });
}
