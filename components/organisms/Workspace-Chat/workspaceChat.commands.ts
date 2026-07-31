import type { ToolSkill } from "@/lib/entities/commands.type";
import {
  builtinSkillsWithSlash,
  type BuiltinSkillDefinition,
} from "@/lib/domain/usecases/skills/builtin_skills";

export interface CommandDefinition {
  id: string; // e.g. "/google-workspace-morning"
  label: string; // e.g. "morning"
  description: string;
  promptText: string;
}

function mcpMatches(slugs: string[], commandName: string): boolean {
  const needle = commandName.toLowerCase();
  return slugs.some((slug) => {
    const s = slug.toLowerCase();
    if (needle === "google-workspace") {
      return s.includes("google") || s.includes("gws");
    }
    if (needle === "erpnext") {
      return s.includes("erp") && !s.includes("school");
    }
    if (needle === "school-erp") {
      return s.includes("school");
    }
    return s.includes(needle);
  });
}

function commandFromBuiltin(
  skill: BuiltinSkillDefinition,
  installedSkills?: { name: string; content: string }[],
): CommandDefinition | null {
  const slash = skill.slash;
  if (!slash) return null;

  const fromDb = installedSkills?.find((s) => s.name === skill.name);

  return {
    id: `/${slash.commandName}-${slash.subCommand}`,
    label: slash.subCommand,
    description: skill.description,
    // Dedicated slash prompt, else prefer DB-seeded body, else builtin instructions
    promptText: slash.promptText ?? fromDb?.content ?? skill.instructions,
  };
}

/**
 * Generates the unified slash command definition for a given ToolSkill.
 * Resolves prompt/description from seeded built-in skills (DB source of truth).
 */
export function buildCommandDefinition(skill: ToolSkill): CommandDefinition {
  const { commandName, subCommand } = skill;
  const builtin = builtinSkillsWithSlash().find(
    (s) => s.slash?.commandName === commandName && s.slash.subCommand === subCommand,
  );

  if (builtin) {
    return (
      commandFromBuiltin(builtin) ?? {
        id: `/${commandName}-${subCommand}`,
        label: subCommand,
        description: `${subCommand} (from ${commandName})`,
        promptText: `Use the ${subCommand} tool from ${commandName}.`,
      }
    );
  }

  return {
    id: `/${commandName}-${subCommand}`,
    label: subCommand,
    description: `${subCommand} (from ${commandName})`,
    promptText: `Use the ${subCommand} tool from ${commandName}.`,
  };
}

/**
 * Slash commands from seeded DB skills (`BUILTIN_SKILLS` → `bun run seed:skills`),
 * gated by active MCP servers, plus installed custom skills and /skill-maker.
 */
export function getAvailableCommands(
  activeMcpServerSlugs: string[],
  installedSkills?: { name: string; content: string }[],
): CommandDefinition[] {
  const commands: CommandDefinition[] = [];
  const usedSkillNames = new Set<string>();

  for (const skill of builtinSkillsWithSlash()) {
    const slash = skill.slash!;
    if (!mcpMatches(activeMcpServerSlugs, slash.commandName)) continue;
    const cmd = commandFromBuiltin(skill, installedSkills);
    if (!cmd) continue;
    commands.push(cmd);
    usedSkillNames.add(skill.name);
  }

  // Universal
  commands.push({
    id: "/skill-maker",
    label: "skill-maker",
    description: "Create a reusable agent skill from our workflow.",
    promptText:
      "I want to create a new skill. Ask me one by one: 1) Name, 2) Description, 3) Instructions/Workflow. Treat my replies as plain text for those fields only — do not run other tools during Q&A. When done, optimize the text, then call skills_create_skill (or skills__create_skill) to SAVE IT IN THE DATABASE. Never edit repo files like builtin_skills.ts. Skills are Private by default unless I ask to publish.",
  });

  if (installedSkills && installedSkills.length > 0) {
    for (const skill of installedSkills) {
      if (usedSkillNames.has(skill.name)) continue;
      commands.push({
        id: `/${skill.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        label: skill.name,
        description: `Execute custom skill: ${skill.name}`,
        promptText: `[Execute Skill: ${skill.name}]\nFollow the instructions defined in this skill for my request:\n`,
      });
    }
  }

  return commands;
}
