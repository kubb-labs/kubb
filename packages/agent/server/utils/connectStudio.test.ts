import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MockWebSocket } from "../mocks/websocket.ts";
import type { AgentConnectResponse } from "../types/agent.ts";
import type { ConnectToStudioOptions } from "./connectStudio.ts";
import { connectToStudio } from "./connectStudio.ts";

vi.mock("./api.ts", () => ({
  createAgentSession: vi.fn(),
  disconnect: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("./generate.ts", () => ({
  generate: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("./loadConfig.ts", () => ({
  loadConfig: vi.fn(),
}));

vi.mock("./setupHookListener.ts", () => ({
  setupHookListener: vi.fn(),
}));

vi.mock("./resolvePlugins.ts", () => ({
  resolvePlugins: vi.fn().mockReturnValue([]),
}));

vi.mock("./agentCache.ts", () => ({
  saveStudioConfigToStorage: vi.fn().mockResolvedValue(undefined),
  getLatestStudioConfigFromStorage: vi.fn().mockResolvedValue(null),
}));

vi.mock("./logger.ts", () => ({
  logger: { info: vi.fn(), success: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock("./ws.ts", () => ({
  createWebsocket: vi.fn(),
  sendAgentMessage: vi.fn(),
  setupEventsStream: vi.fn(),
}));

vi.mock("~~/package.json", () => ({
  default: { version: "1.0.0" },
  version: "1.0.0",
}));

import {
  getLatestStudioConfigFromStorage,
  saveStudioConfigToStorage,
} from "./agentCache.ts";
import { createAgentSession, disconnect } from "./api.ts";
import { generate } from "./generate.ts";
import { loadConfig } from "./loadConfig.ts";
import { logger } from "./logger.ts";
import { resolvePlugins } from "./resolvePlugins.ts";
import { createWebsocket, sendAgentMessage } from "./ws.ts";

// Shared test helpers

const makeSession = (
  overrides: Partial<AgentConnectResponse> = {},
): AgentConnectResponse => ({
  sessionId: "session-abc",
  wsUrl: "ws://localhost:3000/ws/session-abc",
  isSandbox: false,
  expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
  revokedAt: null,
  ...overrides,
});

const makeConfig = (overrides = {}) => ({
  name: "test",
  input: { path: "spec.yaml" },
  output: { path: "./gen", write: false },
  plugins: [],
  ...overrides,
});

describe("connectToStudio", () => {
  let mockWs: MockWebSocket;
  let options: ConnectToStudioOptions;

  beforeEach(() => {
    mockWs = new MockWebSocket();

    vi.mocked(createWebsocket).mockReturnValue(mockWs as any);
    vi.mocked(createAgentSession).mockResolvedValue(makeSession());
    vi.mocked(loadConfig).mockResolvedValue(makeConfig() as any);

    options = {
      token: "my-token",
      studioUrl: "https://studio.kubb.dev",
      configPath: "kubb.config.ts",
      resolvedConfigPath: "/project/kubb.config.ts",
      allowAll: false,
      allowWrite: false,
      allowPublish: false,
      root: "/project",
      retryInterval: 100,
      nitro: { hooks: { hook: vi.fn() } } as any,
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  // Session creation

  it("creates an agent session with the provided credentials", async () => {
    await connectToStudio(options);

    expect(createAgentSession).toHaveBeenCalledWith({
      token: "my-token",
      studioUrl: "https://studio.kubb.dev",
    });
  });

  it("creates a WebSocket with the session wsUrl and Bearer auth header", async () => {
    await connectToStudio(options);

    expect(createWebsocket).toHaveBeenCalledWith(
      "ws://localhost:3000/ws/session-abc",
      {
        headers: { Authorization: "Bearer my-token" },
      },
    );
  });

  it("throws when createAgentSession rejects", async () => {
    vi.mocked(createAgentSession).mockRejectedValueOnce(
      new Error("Network error"),
    );

    await expect(connectToStudio(options)).rejects.toThrow("Network error");
  });

  // WebSocket messages

  it("logs info when a pong message is received", async () => {
    await connectToStudio(options);

    await mockWs.trigger("message", { data: JSON.stringify({ type: "pong" }) });

    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('Received "pong" from Studio'),
    );
  });

  it("logs a warning for unknown message types", async () => {
    await connectToStudio(options);

    await mockWs.trigger("message", {
      data: JSON.stringify({ type: "unknown" }),
    });

    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("Unknown message type"),
    );
  });

  // generate command

  it("calls generate with the resolved config on a generate command", async () => {
    await connectToStudio(options);

    await mockWs.trigger("message", {
      data: JSON.stringify({ type: "command", command: "generate" }),
    });

    expect(generate).toHaveBeenCalledWith(
      expect.objectContaining({
        config: expect.objectContaining({ name: "test" }),
      }),
    );
  });

  it("calls resolvePlugins with payload plugins when the generate command includes a payload", async () => {
    const payload = { plugins: [{ name: "@kubb/plugin-ts", options: {} }] };

    await connectToStudio(options);

    await mockWs.trigger("message", {
      data: JSON.stringify({ type: "command", command: "generate", payload }),
    });

    expect(resolvePlugins).toHaveBeenCalledWith(payload.plugins);
  });

  it("disables write in sandbox mode even when allowWrite is true", async () => {
    vi.mocked(createAgentSession).mockResolvedValue(
      makeSession({ isSandbox: true }),
    );

    await connectToStudio({ ...options, allowWrite: true });

    await mockWs.trigger("message", {
      data: JSON.stringify({ type: "command", command: "generate" }),
    });

    expect(generate).toHaveBeenCalledWith(
      expect.objectContaining({
        config: expect.objectContaining({
          output: expect.objectContaining({ write: false }),
        }),
      }),
    );
  });

  it("uses inline input from payload in sandbox mode", async () => {
    // Use a fresh connectToStudio call with isSandbox=true baked into the session
    vi.mocked(createAgentSession).mockResolvedValue(
      makeSession({ isSandbox: true }),
    );
    const sandboxWs = new MockWebSocket();
    vi.mocked(createWebsocket).mockReturnValue(sandboxWs as any);

    const payload = { input: 'openapi: "3.0.0"', plugins: [] };

    await connectToStudio(options);

    await sandboxWs.trigger("message", {
      data: JSON.stringify({ type: "command", command: "generate", payload }),
    });

    expect(generate).toHaveBeenCalledWith(
      expect.objectContaining({
        config: expect.objectContaining({
          input: { data: 'openapi: "3.0.0"' },
        }),
      }),
    );
  });

  it("ignores inline input from payload when not in sandbox mode", async () => {
    const payload = { input: 'openapi: "3.0.0"', plugins: [] };

    await connectToStudio(options);

    await mockWs.trigger("message", {
      data: JSON.stringify({ type: "command", command: "generate", payload }),
    });

    // Input override is only applied in sandbox; config.input should remain unchanged
    expect(generate).toHaveBeenCalledWith(
      expect.objectContaining({
        config: expect.objectContaining({ input: { path: "spec.yaml" } }),
      }),
    );
  });

  it("persists the payload to storage when allowWrite is true and payload is provided", async () => {
    const payload = { plugins: [] };

    await connectToStudio({ ...options, allowWrite: true });

    await mockWs.trigger("message", {
      data: JSON.stringify({ type: "command", command: "generate", payload }),
    });

    expect(saveStudioConfigToStorage).toHaveBeenCalledWith({
      sessionId: "session-abc",
      config: payload,
    });
  });

  it("does not persist studioConfig when there is no payload", async () => {
    await connectToStudio({ ...options, allowWrite: true });

    await mockWs.trigger("message", {
      data: JSON.stringify({ type: "command", command: "generate" }),
    });

    expect(saveStudioConfigToStorage).not.toHaveBeenCalled();
  });

  it("does not persist studioConfig when allowWrite is false", async () => {
    const payload = { plugins: [] };

    await connectToStudio(options); // allowWrite: false

    await mockWs.trigger("message", {
      data: JSON.stringify({ type: "command", command: "generate", payload }),
    });

    expect(saveStudioConfigToStorage).not.toHaveBeenCalled();
  });

  it("falls back to stored studio config when generate command has no payload", async () => {
    const storedConfig = {
      plugins: [{ name: "@kubb/plugin-ts", options: { enumType: "asConst" } }],
    };
    vi.mocked(getLatestStudioConfigFromStorage).mockResolvedValueOnce(
      storedConfig,
    );

    await connectToStudio(options);

    await mockWs.trigger("message", {
      data: JSON.stringify({ type: "command", command: "generate" }),
    });

    expect(getLatestStudioConfigFromStorage).toHaveBeenCalledWith({
      sessionId: "session-abc",
    });
    expect(resolvePlugins).toHaveBeenCalledWith(storedConfig.plugins);
  });

  it("uses the payload plugins over the stored studio config when both are present", async () => {
    const storedConfig = {
      plugins: [{ name: "@kubb/plugin-ts", options: { enumType: "asConst" } }],
    };
    vi.mocked(getLatestStudioConfigFromStorage).mockResolvedValueOnce(
      storedConfig,
    );

    const payload = { plugins: [{ name: "@kubb/plugin-oas", options: {} }] };

    await connectToStudio(options);

    await mockWs.trigger("message", {
      data: JSON.stringify({ type: "command", command: "generate", payload }),
    });

    // resolvePlugins is called with the payload plugins (not the stored ones)
    expect(resolvePlugins).toHaveBeenCalledWith(payload.plugins);
  });

  // connect command

  it("sends a connected message with agent info on a connect command", async () => {
    await connectToStudio(options);

    await mockWs.trigger("message", {
      data: JSON.stringify({ type: "command", command: "connect" }),
    });

    expect(sendAgentMessage).toHaveBeenCalledWith(
      mockWs,
      expect.objectContaining({
        type: "connected",
        payload: expect.objectContaining({
          version: "1.0.0",
          configPath: "kubb.config.ts",
        }),
      }),
    );
  });

  it("reflects allowWrite and allowAll separately in permissions on connect command", async () => {
    await connectToStudio({ ...options, allowWrite: true, allowAll: false });

    await mockWs.trigger("message", {
      data: JSON.stringify({ type: "command", command: "connect" }),
    });

    expect(sendAgentMessage).toHaveBeenCalledWith(
      mockWs,
      expect.objectContaining({
        payload: expect.objectContaining({
          permissions: {
            allowAll: false,
            allowWrite: true,
            allowPublish: false,
          },
        }),
      }),
    );
  });

  it("reflects allowAll=true in permissions when allowAll is set", async () => {
    await connectToStudio({ ...options, allowWrite: true, allowAll: true });

    await mockWs.trigger("message", {
      data: JSON.stringify({ type: "command", command: "connect" }),
    });

    expect(sendAgentMessage).toHaveBeenCalledWith(
      mockWs,
      expect.objectContaining({
        payload: expect.objectContaining({
          permissions: {
            allowAll: true,
            allowWrite: true,
            allowPublish: false,
          },
        }),
      }),
    );
  });

  it("reports zero permissions in sandbox mode regardless of allowWrite", async () => {
    vi.mocked(createAgentSession).mockResolvedValue(
      makeSession({ isSandbox: true }),
    );
    const sandboxWs = new MockWebSocket();
    vi.mocked(createWebsocket).mockReturnValue(sandboxWs as any);

    await connectToStudio({ ...options, allowWrite: true });

    await sandboxWs.trigger("message", {
      data: JSON.stringify({ type: "command", command: "connect" }),
    });

    expect(sendAgentMessage).toHaveBeenCalledWith(
      sandboxWs,
      expect.objectContaining({
        payload: expect.objectContaining({
          permissions: {
            allowAll: false,
            allowWrite: false,
            allowPublish: false,
          },
        }),
      }),
    );
  });

  // Reconnect on close / error

  it("calls disconnect when the WebSocket closes", async () => {
    vi.useFakeTimers();

    await connectToStudio(options);

    await mockWs.trigger("close");

    expect(disconnect).toHaveBeenCalledWith({
      sessionId: "session-abc",
      studioUrl: "https://studio.kubb.dev",
      token: "my-token",
    });
  });

  it('closes the WebSocket without reconnecting when a disconnect message with reason "revoked" is received', async () => {
    vi.useFakeTimers();

    await connectToStudio(options);

    await mockWs.trigger("message", {
      data: JSON.stringify({ type: "disconnect", reason: "revoked" }),
    });

    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("revoked"),
    );
    expect(mockWs.closed).toBe(true);
    // disconnect API must NOT be called — server already knows about the closure
    expect(disconnect).not.toHaveBeenCalled();
    // revoked sessions must NOT trigger a reconnect
    expect(logger.info).not.toHaveBeenCalledWith(
      expect.stringContaining("Retrying connection"),
    );
  });

  it('cleans up and reconnects when a disconnect message with reason "expired" is received', async () => {
    vi.useFakeTimers();

    await connectToStudio(options);

    await mockWs.trigger("message", {
      data: JSON.stringify({ type: "disconnect", reason: "expired" }),
    });

    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("expired"),
    );
    expect(mockWs.closed).toBe(true);
    expect(disconnect).not.toHaveBeenCalled();
    // expired sessions trigger a reconnect (unlike revoked)
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining("Retrying connection"),
    );
  });

  it("reconnects on WS error", async () => {
    vi.useFakeTimers();

    await connectToStudio(options);

    await mockWs.trigger("error");

    expect(logger.error).toHaveBeenCalled();
  });
});
