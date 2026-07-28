import type { CursorSkill } from "@/lib/entities/cursor.type";

export type BuiltinSlashCommand = {
  commandName: "google-workspace" | "erpnext";
  subCommand: string;
  /** Chat insert text; defaults to `instructions` when omitted. */
  promptText?: string;
};

export type BuiltinSkillDefinition = {
  name: string;
  description: string;
  categoryName: string;
  content: string;
  instructions: string;
  /** When set, skill is also exposed as a `/` slash command (seeded to DB). */
  slash?: BuiltinSlashCommand;
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

const ERP_WRAPUP_INSTRUCTIONS = `# ERPNext + Gmail End of Day Wrap-Up

Use this skill when the user wants to **wrap up their day**: combine **ERPNext** work status with **Gmail/Calendar** triage (same intent as \`/google-workspace-wrapup\`, plus ERP).

## Requirements

- Provider must be **Cursor** (ERPNext MCP + Workspace custom tools together).
- ERPNext MCP connected (user logged into ERPNext in BBAI).
- Google Workspace connected with **email** and **calendar** enabled.
- Prefer: ERPNext \`get_user_profile\`, \`get_documents\`, \`run_report\` + Workspace \`list_recent_emails\`, \`list_upcoming_calendar_events\`.

## Collect before acting

Ask only if unclear:

1. **Date** — default **today** in the user's timezone (from profile or context).
2. Whether they want a **test/dry run** (no emails sent; label output \`[DRY RUN]\`).

Resolve **Employee** from \`get_user_profile\` (\`employeeId\`, \`erpnextUser\`). Do not query another employee unless asked.

## Step 1 — ERPNext day status

Call \`get_user_profile\` (sync: true) first.

Then query what the user's permissions allow (skip gracefully on permission/field errors):

| Area | DocType(s) | What to summarize |
|------|------------|-------------------|
| Time | \`Timesheet\` | Today's sheet: status, total hours, draft vs submitted |
| Attendance | \`Attendance\`, \`Employee Checkin\` | Check-in/out or attendance status for the date |
| HR | \`Leave Application\` | Open/Draft leaves; pending approvals if visible |
| Work queue | \`ToDo\` | Open items allocated to \`erpnextUser\`; highlight **due today** and **overdue** |
| Projects | \`Task\`, \`Livro Task\`, \`Sprint Backlogs\` | Only if list queries succeed; otherwise rely on ToDo references |

Flag gaps clearly (e.g. no timesheet for today, no attendance logged).

## Step 2 — Gmail + Calendar (Workspace)

1. **Email** — \`list_recent_emails\`: focus on messages from **today** (or since start of workday). Group unresolved **action items**, direct questions, and approvals/reviews.
2. **Calendar** — \`list_upcoming_calendar_events\`: list the **first three meetings tomorrow morning** (chronological) for prep, matching the Google wrap-up command behavior.

Do **not** send email unless the user explicitly asks to notify someone.

## Step 3 — Report back

Structured Markdown summary:

### ERP (date)
- Employee id + name
- Timesheet / attendance (or "none found")
- Open HR items (leave drafts, etc.)
- ToDos due today + top overdue (with reference doc if present)

### Inbox & tomorrow
- Unresolved email action items (bulleted)
- Tomorrow AM meetings (time, title)

### Suggested close-out (optional, 3–5 bullets)
Concrete next actions for tomorrow morning (e.g. log timesheet, submit leave, fix CI, prep for meeting).

Offer follow-ups: create/submit timesheet, file leave (use Leave skill), draft replies, or deep-dive one backlog item.

## Guardrails

- Read-only by default — no create/submit/cancel in ERP unless the user asks.
- Never invent ERP records or email content; say when data is missing or forbidden by permissions.
- If only one integration is connected, run what you can and state what to connect for the full wrap-up.
`;

function gws(
  subCommand: string,
  name: string,
  description: string,
  promptText: string,
): BuiltinSkillDefinition {
  return {
    name,
    description,
    categoryName: "Google Workspace",
    content: promptText,
    instructions: promptText,
    slash: { commandName: "google-workspace", subCommand, promptText },
  };
}

function erp(
  subCommand: string,
  name: string,
  description: string,
  promptText: string,
  categoryName = "ERPNext",
): BuiltinSkillDefinition {
  return {
    name,
    description,
    categoryName,
    content: promptText,
    instructions: promptText,
    slash: { commandName: "erpnext", subCommand, promptText },
  };
}

/** Built-in skills — source of truth; seed into DB via `bun run seed:skills`. */
export const BUILTIN_SKILLS: BuiltinSkillDefinition[] = [
  // ── Google Workspace ─────────────────────────────────────
  gws(
    "morning",
    "Google Workspace Morning",
    "Morning briefing (from Google Workspace)",
    "Provide my morning briefing. List my meetings for today in chronological order, and summarize any unread emails received since 5 PM yesterday. Highlight anything that looks like an action item.",
  ),
  gws(
    "wrapup",
    "Google Workspace Wrap-Up",
    "End of day review (from Google Workspace)",
    "Review my activity for today. Summarize any unresolved action items I received via email today, and list my first three meetings for tomorrow morning so I can prepare.",
  ),
  gws(
    "prep",
    "Google Workspace Meeting Prep",
    "Meeting prep (from Google Workspace)",
    "Look at my next scheduled meeting. Identify the attendees, search my inbox for the most recent email thread with them, and summarize our last conversation so I have context before joining.",
  ),
  gws(
    "catchup",
    "Google Workspace Catch Up",
    "Summarize unread emails (from Google Workspace)",
    "Summarize my unread emails from the last 24 hours. Group them by topic or project, and specifically flag any direct questions asked of me.",
  ),
  gws(
    "urgent",
    "Google Workspace Urgent",
    "Find urgent emails (from Google Workspace)",
    "Scan my unread emails for the last 3 days for keywords like 'urgent', 'ASAP', 'action required', or 'deadline'. Summarize what is needed and who is asking for it.",
  ),
  gws(
    "draft-decline",
    "Google Workspace Draft Decline",
    "Draft a polite decline (from Google Workspace)",
    "Draft a polite, professional reply to the most recent email request. Politely decline, stating that my current workload does not allow me to take this on right now.",
  ),
  gws(
    "draft-followup",
    "Google Workspace Draft Follow-Up",
    "Draft a friendly followup (from Google Workspace)",
    "Draft a short, friendly follow-up for the last email I sent. Check in to see if there are any updates or if they need any further information from my end.",
  ),
  gws(
    "agenda",
    "Google Workspace Agenda",
    "List today's remaining agenda (from Google Workspace)",
    "List all my remaining calendar events for today. Include the meeting title, time, duration, and the list of attendees.",
  ),
  gws(
    "find-time",
    "Google Workspace Find Time",
    "Find available time slots (from Google Workspace)",
    "Look at my calendar for the next 3 business days and find three available {minutes}-minute slots between 9 AM and 5 PM. Format them as a clean, bulleted list.",
  ),
  gws(
    "free-tomorrow",
    "Google Workspace Free Tomorrow",
    "Calculate free time tomorrow (from Google Workspace)",
    "Calculate exactly how much un-scheduled free time I have during working hours tomorrow, and list the specific continuous time blocks that are open.",
  ),
  gws(
    "conflicts",
    "Google Workspace Conflicts",
    "Find meeting conflicts (from Google Workspace)",
    "Scan my calendar for the rest of the week and identify any overlapping or double-booked meetings. Draft a short, polite email I can send to the organizer of the smaller meeting to request a reschedule.",
  ),

  // ── ERPNext (simple) ─────────────────────────────────────
  erp(
    "get-customer",
    "ERPNext Get Customer",
    "Get customer details (from ERPNext)",
    "Get details for customer [Name].",
  ),
  erp(
    "create-invoice",
    "ERPNext Create Invoice",
    "Create a sales invoice (from ERPNext)",
    "Create a sales invoice for customer [Name] with amount [Amount].",
  ),
  erp(
    "check-stock",
    "ERPNext Check Stock",
    "Check item stock (from ERPNext)",
    "Check the stock for item [Item Name].",
  ),

  // ── ERPNext + Gmail (long-form skills) ───────────────────
  {
    name: "ERPNext Leave + Gmail Approver",
    description:
      "File a Leave Application in ERPNext, then email the approver via Gmail. Use Cursor with ERPNext MCP and Workspace email connected.",
    categoryName: "HR & Workflows",
    content: LEAVE_PLUS_EMAIL_INSTRUCTIONS,
    instructions: LEAVE_PLUS_EMAIL_INSTRUCTIONS,
    slash: {
      commandName: "erpnext",
      subCommand: "request-leave",
      promptText:
        'Follow the skill "ERPNext Leave + Gmail Approver". Use Cursor tools: create a Leave Application in ERPNext for me, then send_email via Google Workspace to the approver. Ask me only for missing details (leave type, from/to dates, reason, approver email if unknown, and whether this is a test). After both steps, summarize document id, status (Draft vs Submitted), and email confirmation.',
    },
  },
  {
    name: "ERPNext + Gmail End of Day Wrap-Up",
    description:
      "Wrap up your day: ERPNext timesheet, attendance, todos, and HR plus Gmail action items and tomorrow's morning meetings. Cursor with ERPNext MCP and Workspace email/calendar.",
    categoryName: "HR & Workflows",
    content: ERP_WRAPUP_INSTRUCTIONS,
    instructions: ERP_WRAPUP_INSTRUCTIONS,
    slash: {
      commandName: "erpnext",
      subCommand: "wrapup",
      promptText:
        'Follow the skill "ERPNext + Gmail End of Day Wrap-Up". Use Cursor with ERPNext MCP and Google Workspace tools. Default to today. Summarize my ERP timesheet/attendance, open todos (due today and overdue), and relevant HR items; then triage today\'s email action items and list my first three meetings tomorrow morning. Read-only unless I ask to create or submit something.',
    },
  },
];

export function builtinSkillsAsCursorSkills(): CursorSkill[] {
  return BUILTIN_SKILLS.map((s) => ({
    name: s.name,
    content: s.content,
  }));
}

export function builtinSkillsWithSlash(): BuiltinSkillDefinition[] {
  return BUILTIN_SKILLS.filter((s) => Boolean(s.slash));
}
