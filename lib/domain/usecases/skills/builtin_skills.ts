import type { CursorSkill } from "@/lib/entities/cursor.type";

export type BuiltinSkillDefinition = {
  name: string;
  description: string;
  categoryName: string;
  content: string;
  instructions: string;
};

const LEAVE_PLUS_EMAIL_INSTRUCTIONS = `# ERPNext Leave Application + Gmail Approver

Use this skill when the user wants to file leave (vacation, sick, etc.): create a **Leave Application** in ERPNext, then **email the approver** via Gmail.

## Requirements

- Provider must be **Cursor** (needs ERPNext MCP + Workspace custom tools together).
- ERPNext MCP must be connected (user logged into ERPNext in BBAI).
- Google Workspace must be connected with **email** capability enabled.
- Prefer tools: ERPNext MCP document tools + Workspace \`send_email\` (first-party custom tool, not remote Google MCP).

## Collect before acting

Ask only for missing fields. Do not invent dates, leave type, or approver email.

1. **Leave type** (e.g. Vacation Leave, Sick Leave) — match ERPNext Leave Type names.
2. **From date** and **To date** (inclusive). Single day → same date for both.
3. **Reason / description** (short plain text).
4. **Approver email** if not already known from ERPNext leave approver / employee record.
5. Whether this is a **test** (mark subject/body clearly if yes).

Resolve **Employee** from the signed-in ERPNext user / linked Employee (e.g. EMP/xxxxx). Do not guess another employee unless the user explicitly asks.

## Step 1 — Create Leave Application (ERPNext)

Create DocType \`Leave Application\` with at least:

- \`employee\` — employee id
- \`leave_type\` — exact Leave Type name
- \`from_date\` / \`to_date\` — \`YYYY-MM-DD\`
- \`description\` — reason
- leave approver fields if the DocType requires them

Then:

1. Try to **submit** the document if the API/tools allow.
2. If submit fails with a permission error (common: user can create but not submit), **keep the Draft/Open document** and tell the user clearly. Do not delete it.
3. Capture: document name/id (e.g. \`HR-LAP-2026-00697\`), employee, leave type, dates, status, approver.

## Step 2 — Email the approver (Gmail)

Call Workspace \`send_email\`:

- **to**: approver email
- **subject**: include leave type + date range; prefix \`[TEST ONLY]\` when the user said it is a test
- **body** (plain text): employee name/id, leave type, dates, document id, status (Draft vs Submitted), reason, and that they should review/approve in ERPNext

Do **not** claim the leave was submitted if it is still Draft/Open.

## Step 3 — Report back

Give a short summary table/list:

- Document ID
- Employee
- Leave type + dates
- Approver
- Status (Submitted vs Open/Draft + permission note if needed)
- Confirmation that Gmail was sent (to + subject)

Offer optional follow-ups: cancel/delete a test leave, or help with submit permissions.

## Guardrails

- Never send email before the leave doc exists (or creation failed).
- Never email a real approver for a test without \`[TEST ONLY]\` labeling when the user marked it as a test.
- If ERPNext or Gmail tools are missing, stop and tell the user what to connect (ERPNext login + Workspace email) and to use **Cursor** provider.
`;

export const BUILTIN_SKILLS: BuiltinSkillDefinition[] = [
  {
    name: "ERPNext Leave + Gmail Approver",
    description:
      "File a Leave Application in ERPNext, then email the approver via Gmail. Use Cursor with ERPNext MCP and Workspace email connected.",
    categoryName: "HR & Workflows",
    content: LEAVE_PLUS_EMAIL_INSTRUCTIONS,
    instructions: LEAVE_PLUS_EMAIL_INSTRUCTIONS,
  },
];

export function builtinSkillsAsCursorSkills(): CursorSkill[] {
  return BUILTIN_SKILLS.map((s) => ({
    name: s.name,
    content: s.content,
  }));
}
