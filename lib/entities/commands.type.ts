// Tool / Skill command registry

export type GwsCommands = "send-email" | "list-inbox" | "get-user-info" | "list-calendar" | "create-event";
export type ErpNextCommands = "get-customer" | "create-invoice" | "check-stock";

export interface ToolSkillMap {
  "erp-next": ErpNextCommands;
  "gws": GwsCommands;
}

/**
 * Distributive conditional type that maps a tool/skill to its exact format.
 * E.g. { commandName: "gws", subCommand: "send-email" }
 */
export type ToolSkill<T extends keyof ToolSkillMap = keyof ToolSkillMap> = 
  T extends unknown
    ? { commandName: T; subCommand: ToolSkillMap[T] }
    : never;
