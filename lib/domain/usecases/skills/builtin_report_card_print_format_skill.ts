import type { BuiltinSkillDefinition } from "./builtin_skills";

/** Canonical template skill name — full Jinja/CSS lives in DB; fetch via skills MCP. */
export const BED_REPORT_CARD_SF9_TEMPLATE_SKILL_NAME =
  "BED Report Card SF9 Template";

/**
 * Thin skill: no HTML/CSS in the repo. Agent must load the template record via MCP.
 */
export const BED_REPORT_CARD_PRINT_FORMAT_INSTRUCTIONS = `# Generate Report Card Print Format (SF9) — NON-NEGOTIABLE

When the user asks to **generate / create a Print Format for Report Card**, do **not** invent school-branded layouts and **do not** read or edit this codebase.

## How to get the canonical template

1. Call **skills MCP** \`get_skill\` (or Cursor tool \`skills_get_skill\`) with:
   - \`name\`: \`${BED_REPORT_CARD_SF9_TEMPLATE_SKILL_NAME}\`
2. That record’s \`instructions\` contain the exact Jinja HTML + CSS.
3. Also follow skill **BED Report Card Layout (SF9)** (load via \`get_skill\` if not already in context).

## What to create on School ERP (via School MCP only)

| Field | Value |
|-------|--------|
| DocType | \`Print Format\` |
| \`name\` | \`BED Report Card SF9\` (school-neutral; never \`SCSHS …\` unless user insists on rename of same SF9 template) |
| \`doc_type\` | \`Class\` |
| \`custom_format\` | \`1\` |
| \`print_format_type\` | \`Jinja\` |
| \`standard\` | \`No\` |
| \`html\` / \`css\` | **Exact** values from \`${BED_REPORT_CARD_SF9_TEMPLATE_SKILL_NAME}\` |

Then \`school_erp_open_output\` with \`kind=print_format\`, \`format=BED Report Card SF9\`, and a sample \`Class\` name.

## Hard rules

0. **Do not alter any codebase.** Template source of truth = skills DB/MCP record, not local files.
1. Branding from **General Settings** in Jinja — never hardcode one school.
2. Keep SF9 blocks from the layout skill.
3. Print Format only — not a Web Page.
`;

export function builtinReportCardPrintFormatSkill(): BuiltinSkillDefinition {
  return {
    name: "Generate Report Card Print Format (SF9)",
    description:
      "Create a School ERP Print Format for BED Report Card (SF9). Loads canonical HTML/CSS from skills MCP — not from the repo.",
    categoryName: "School ERP Grading",
    content: BED_REPORT_CARD_PRINT_FORMAT_INSTRUCTIONS,
    instructions: BED_REPORT_CARD_PRINT_FORMAT_INSTRUCTIONS,
    slash: {
      commandName: "school-erp",
      subCommand: "generate-report-card-print-format",
      promptText: `Follow "Generate Report Card Print Format (SF9)". Call skills_get_skill name="${BED_REPORT_CARD_SF9_TEMPLATE_SKILL_NAME}" for HTML/CSS. Do NOT alter any codebase. Write Print Format on the school site via School MCP only, then school_erp_open_output.`,
    },
  };
}

/** Seed-only metadata; instructions filled from scripts/seed-data at seed time. */
export function builtinReportCardSf9TemplateSkillStub(): BuiltinSkillDefinition {
  return {
    name: BED_REPORT_CARD_SF9_TEMPLATE_SKILL_NAME,
    description:
      "Canonical Jinja HTML + CSS for BED Report Card SF9 Print Format. Access via skills MCP get_skill only — not prompt dump.",
    categoryName: "School ERP Grading",
    content: "",
    instructions: "",
    omitFromPrompt: true,
  };
}
