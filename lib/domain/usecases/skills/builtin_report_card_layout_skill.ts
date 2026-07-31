import type { BuiltinSkillDefinition } from "./builtin_skills";

/**
 * Canonical BED Report Card layout (DepEd SF9 / Form 138).
 * Derived from Livro school samples (CORE, SAAI, RMB, EXEL, SCSHS, AMSAI,
 * MHRPS, HCJC, SHS Hijas, preschool EXEL). NON-NEGOTIABLE for Giya.
 */
export const BED_REPORT_CARD_LAYOUT_INSTRUCTIONS = `# BED Report Card Layout (SF9) — NON-NEGOTIABLE

This skill is the **only allowed general layout** for K–12 / BED **Report Cards** in Giya.

It is based on real school samples (DepEd SF9 / Form 138 family): CORE (new format), SAAI JHS, RMB, EXEL G1–JHS, SCSHS JHS, AMSAI Gensan GS, MHRPS, HCJC, SHS Hijas (conduct-per-subject), EXEL Preschool.

## NON-NEGOTIABLE (do not break)

0. **Do not alter any codebase** (Giya repo, School ERP app source, local templates under \`lib/\` or \`.tmp/\`). Report Card work is **School ERP documents only** (Print Format / Script Report via MCP). Never “fix” the card by editing Giya files.
1. **Never invent** a different report-card design (no dashboards, cards, “modern” one-pagers, Web Page mockups, or AI restyles).
2. **Never** invent a new Print Format / Web Page design. If the user asks to **generate a Print Format** for Report Card → follow skill **Generate Report Card Print Format (SF9)** and write HTML/CSS **into the school’s Print Format doc via MCP** — not into this repo.
3. When the user asks to **run / print** an existing Report Card → prefer School ERP **Script Report** \`Report Card\` / \`Report Card Senior High\` / \`Preschool Report Card\` (see School ERP Grading skills). Layout = ERP template + **this** structure.
4. School logos, names, addresses, principals = from **School ERP General Settings / Letter Head** — do not invent branding.
5. If a school requests a variant (e.g. conduct per subject, preschool domains, honors scale), **keep the SF9 block structure**; only swap the allowed school options listed below.

## Canonical structure (default = SAAI / CORE / MHRPS style)

Treat the card as **DepEd Progress Report Card (SF9) / Form 138**. Typical **2 faces** (front identity + back academics), unless the school's installed template is single-sheet (HCJC-style still keeps the same blocks).

### A. Identity / front (or left)

| Block | Required content |
|-------|------------------|
| Gov / DepEd strip | Republic of the Philippines · Department of Education · Region · Division · (District optional) |
| School identity | School name, address, optional logos (school + DepEd) |
| Document title | \`REPORT CARD\` or \`PROGRESS REPORT CARD (SF9)\` or \`FORM 138: REPORT CARD\` |
| Level band | Grade School / Junior High School / Senior High School / Preschool |
| School Year | e.g. SY 2024-2025 |
| Learner | **Name**, **LRN**, **Age**, **Sex**, **Grade**, **Section** (Curriculum optional, e.g. K to 12) |
| Adviser line | Class Adviser name |
| Parent letter | Short “Dear Parent/Parents…” progress + partnership message |
| Signatories | Class Adviser + School Principal (names + titles) |
| Transfer block | Certificate of Transfer / Eligibility for Admission / Cancellation of Eligibility (Admitted to Grade, Section, dates, signatures) |

### B. Academics / back (or right) — fixed order

**1. REPORT ON LEARNING PROGRESS AND ACHIEVEMENT**

- Table columns (mandatory): **Learning Areas / Subjects** · **Quarter 1–4** (or trimesters if school is trimestral) · **Final Grade** · **Remarks** (PASSED / FAILED).
- Parent subjects may show child rows (e.g. MAPEH → Music & Arts, PE & Health) without Final/Remarks on children when school settings hide them.
- Footer row: **GENERAL AVERAGE** + Final + Remarks.
- Below table: **Grading Scale** legend.

Default DepEd descriptor scale (use unless school uses honors scale):

| Description | Grading Scale | Remarks |
|-------------|---------------|---------|
| Outstanding | 90 – 100 | Passed |
| Very Satisfactory | 85 – 89 | Passed |
| Satisfactory | 80 – 84 | Passed |
| Fairly Satisfactory | 75 – 79 | Passed |
| Did Not Meet Expectations | Below 75 | Failed |

Allowed alternate (school option, e.g. HCJC): honors bands (With Highest / High / Honors) **plus** Satisfactory bands — still a legend under the grades table, not a redesign.

**2. REPORT ON LEARNER'S OBSERVED VALUES** (Core Values)

- Core values (DepEd): **Maka-Diyos**, **Maka-Tao**, **Maka-Kalikasan**, **Maka-Bansa** with official behavior statements.
- Columns: Quarter 1–4 (or equivalent).
- Marks only: **AO** Always Observed · **SO** Sometimes Observed · **RO** Rarely Observed · **NO** Not Observed.
- Include the marking legend.

**3. REPORT ON ATTENDANCE**

- Months across the school year (typically Jul–Jun or school calendar).
- Rows: **No. of School Days**, **Days Present**, **Days Absent**, **Days Tardy** (tardy optional if school omits).
- Totals column.

**4. Parent / Guardian signatures**

- Signature lines per quarter (1st–4th / terms).

### C. Allowed school options (still SF9 — not new layouts)

| Option | When |
|--------|------|
| Conduct / behavior **per subject** | SHS Hijas-style — add columns or a conduct sub-block; do not remove SF9 sections |
| Preschool / kindergarten domains | EXEL Preschool — replace academic subject list with developmental domains; keep identity, attendance, parent signatures |
| Letter grades / transmuted | Only if School ERP filters / General Settings say so — still same tables |
| Data privacy footer | Optional school legal note (HCJC) |
| Watermark / letter head | From General Settings only |

### D. Forbidden

- Inventing sections (QR codes, emoji, “AI summary”, grade charts as the main card).
- Dropping Observed Values or Attendance for a “simpler” card.
- Using Web Page / marketing landing layouts for report cards.
- Mixing college TOR / Form 10 layout into Report Card (those are different skills/reports).

## How to respond in Giya

1. Confirm which report: GS/JHS \`Report Card\`, SHS \`Report Card Senior High\`, or \`Preschool Report Card\`.
2. Collect filters from the School ERP Grading skill (school year, quarter, section, student range, etc.).
3. Open/run the Desk Script Report — **print layout is the ERP HTML**, constrained by **this** SF9 structure.
4. If the user asks “design a report card”, describe or enforce **this** layout only; refuse freestyle redesigns.

## Reference samples (layout family)

CORE · SAAI (best default JHS) · RMB · EXEL G1–JHS · SCSHS · AMSAI Gensan · MHRPS · HCJC · SHS Hijas · EXEL Preschool

Default mental model when unsure: **SAAI / CORE / MHRPS two-face SF9**.
`;

export function builtinReportCardLayoutSkill(): BuiltinSkillDefinition {
  return {
    name: "BED Report Card Layout (SF9)",
    description:
      "NON-NEGOTIABLE DepEd SF9 / Form 138 report card layout for BED (from school samples). All Report Card work must follow this — no AI redesigns.",
    categoryName: "School ERP Grading",
    content: BED_REPORT_CARD_LAYOUT_INSTRUCTIONS,
    instructions: BED_REPORT_CARD_LAYOUT_INSTRUCTIONS,
    slash: {
      commandName: "school-erp",
      subCommand: "report-card-layout",
      promptText:
        'Follow the skill "BED Report Card Layout (SF9)" — NON-NEGOTIABLE. Do NOT alter any codebase (Giya or School ERP apps). Use only School ERP MCP/Print Format/Script Reports. Enforce DepEd SF9 / Form 138 structure from that skill only — no inventing layouts or editing local repo files.',
    },
  };
}
