import { ToolSkill } from "@/lib/entities/commands.type";

export interface CommandDefinition {
  id: string; // e.g. "/gws-send-email"
  label: string; // e.g. "send-email"
  description: string; // e.g. "Draft an email (from GWS)"
  promptText: string; // The predefined text to insert when selected
}

const COMMAND_REGISTRY: Record<string, { description: string; promptText: string }> = {
  "gws:send-email": {
    description: "Draft an email (from GWS)",
    promptText: "Draft an email to [Name] about [Topic].",
  },
  "gws:list-inbox": {
    description: "Check your recent emails (from GWS)",
    promptText: "Check my recent emails and summarize the unread ones.",
  },
  "gws:get-user-info": {
    description: "Get my user info (from GWS)",
    promptText: "Get my user information from Google Workspace.",
  },
  "gws:list-calendar": {
    description: "Check my schedule (from GWS)",
    promptText: "What is on my schedule for today?",
  },
  "gws:create-event": {
    description: "Create a calendar event (from GWS)",
    promptText: "Create a calendar event on [Date] at [Time] for [Topic].",
  },
  "erp-next:get-customer": {
    description: "Get customer details (from erp-next)",
    promptText: "Get details for customer [Name].",
  },
  "erp-next:create-invoice": {
    description: "Create a sales invoice (from erp-next)",
    promptText: "Create a sales invoice for customer [Name] with amount [Amount].",
  },
  "erp-next:check-stock": {
    description: "Check item stock (from erp-next)",
    promptText: "Check the stock for item [Item Name].",
  },
};

/**
 * Generates the unified slash command definition for a given ToolSkill.
 * Ensures type safety across the MCP tools.
 */
export function buildCommandDefinition(skill: ToolSkill): CommandDefinition {
  const { commandName, subCommand } = skill;
  const key = `${commandName}:${subCommand}`;
  const registryEntry = COMMAND_REGISTRY[key];
  
  const description = registryEntry?.description ?? `${subCommand} (from ${commandName})`;
  const promptText = registryEntry?.promptText ?? `Use the ${subCommand} tool from ${commandName}.`;

  return {
    id: `/${commandName}-${subCommand}`,
    label: subCommand,
    description,
    promptText,
  };
}

/**
 * A statically defined list of all available commands to populate the menu.
 */
export const AVAILABLE_COMMANDS: CommandDefinition[] = [
  buildCommandDefinition({ commandName: "gws", subCommand: "send-email" }),
  buildCommandDefinition({ commandName: "gws", subCommand: "list-inbox" }),
  buildCommandDefinition({ commandName: "gws", subCommand: "get-user-info" }),
  buildCommandDefinition({ commandName: "gws", subCommand: "list-calendar" }),
  buildCommandDefinition({ commandName: "gws", subCommand: "create-event" }),
  buildCommandDefinition({ commandName: "erp-next", subCommand: "get-customer" }),
  buildCommandDefinition({ commandName: "erp-next", subCommand: "create-invoice" }),
  buildCommandDefinition({ commandName: "erp-next", subCommand: "check-stock" }),
];
