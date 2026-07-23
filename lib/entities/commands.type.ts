// Tool / Skill command registry

export type GwsCommands = 
  | "morning"
  | "wrapup"
  | "prep"
  | "catchup"
  | "urgent"
  | "draft-decline"
  | "draft-followup"
  | "agenda"
  | "find-time"
  | "free-tomorrow"
  | "conflicts";

export type ErpNextCommands = "get-customer" | "create-invoice" | "check-stock";

export interface ToolSkillMap {
  "erpnext": ErpNextCommands;
  "google-workspace": GwsCommands;
}

/**
 * Distributive conditional type that maps a tool/skill to its exact format.
 * E.g. { commandName: "google-workspace", subCommand: "search_threads" }
 */
export type ToolSkill<T extends keyof ToolSkillMap = keyof ToolSkillMap> = 
  T extends unknown
    ? { commandName: T; subCommand: ToolSkillMap[T] }
    : never;
