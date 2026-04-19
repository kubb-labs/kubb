import { defineCommand } from "@internals/utils";
import { command as startCommand } from "./agent/start.ts";

export const command = defineCommand({
  name: "agent",
  description: "Manage the Kubb Agent server",
  subCommands: [startCommand],
});
