import type { BuiltinSkillDefinition } from "./builtin_skills";

/**
 * School ERP (wela_bed_v15) Grading Script Reports.
 * Source: wela_bed_v15/grading/report/* report_name from each *.json
 */
export const SCHOOL_GRADING_REPORTS: ReadonlyArray<{
  folder: string;
  reportName: string;
  refDoctype: string;
  /** Slash subCommand after generate- → /school-erp-generate-{slug} */
  slug: string;
  /** Print template under wela_bed_v15/grading/report/{folder}/ — source of truth for layout. */
  layoutFile?: string;
  /** Compact layout contract from that template (not AI design). */
  layout?: string;
  /** When true, also expose a dedicated slash shortcut (popular reports). */
  slash?: boolean;
  tip?: string;
}> = [
  {
    folder: "report_card",
    reportName: "Report Card",
    refDoctype: "Master Grade",
    slug: "report-card",
    layoutFile: "report_card.html",
    layout:
      "NON-NEGOTIABLE SF9: follow skill BED Report Card Layout (SF9). Print engine = report_card.html (letter_head, 2-col, LEARNING AREAS + quarters/final/remarks, observed values, attendance). Never redesign.",
    slash: true,
    tip: "GS/JHS. MUST follow BED Report Card Layout (SF9). Filters: school_year, quarter, section, date_issued, show_quarterly, range_from/range_to, show_transmuted, show_numeric, optional student_name, letter_head. Use Refresh Data.",
  },
  {
    folder: "report_card_senior_high",
    reportName: "Report Card Senior High",
    refDoctype: "Master Grade Senior High",
    slug: "report-card-shs",
    layoutFile: "old_html.html",
    layout:
      "NON-NEGOTIABLE SF9 (+ SHS fields: semester, strand). Follow BED Report Card Layout (SF9). Print = SHS report HTML. Conduct-per-subject allowed as school option only.",
    slash: true,
    tip: "SHS. MUST follow BED Report Card Layout (SF9). Filters: school_year, quarter, semester, section, strand, date_issued, range_from/range_to, advisers_copy, show_average_1, show_transmuted.",
  },
  {
    folder: "preschool_report_card",
    reportName: "Preschool Report Card",
    refDoctype: "Master Grade",
    slug: "preschool-report-card",
    layoutFile: "preschool_report_card.html",
    layout:
      "NON-NEGOTIABLE SF9 family: follow BED Report Card Layout (SF9) preschool option (developmental domains). Print = preschool_report_card.html only.",
    slash: true,
  },
  {
    folder: "report_card_letter",
    reportName: "Report Card Letter",
    refDoctype: "Master Grade",
    slug: "report-card-letter",
    layoutFile: "report_card_letter.html",
    layout: "Print = report_card_letter.html only.",
  },
  {
    folder: "report_card_remedial",
    reportName: "Report Card Remedial",
    refDoctype: "Master Grade",
    slug: "report-card-remedial",
    layoutFile: "report_card_remedial.html",
    layout: "Print = report_card_remedial.html only.",
  },
  {
    folder: "grade_slip",
    reportName: "Grade Slip",
    refDoctype: "Master Grade",
    slug: "grade-slip",
    layoutFile: "grade_slip.html",
    layout:
      "Print = grade_slip.html: multi-slip per page via grade_slip_per_page + page-break; LEARNING AREAS header; subject rows until *** conduct grade ***; optional remarks_table. Never invent slip CSS.",
    slash: true,
    tip: "Filters like Report Card + grade_slip_per_page, remarks_table.",
  },
  {
    folder: "grade_slip_shs",
    reportName: "Grade Slip SHS",
    refDoctype: "Master Grade Senior High",
    slug: "grade-slip-shs",
    layoutFile: "grade_slip_shs.html",
    layout: "Print = grade_slip_shs.html only.",
    slash: true,
  },
  {
    folder: "progress_report",
    reportName: "Progress Report",
    refDoctype: "Master Grade",
    slug: "progress-report",
    layoutFile: "progress_report.html",
    layout: "Print = progress_report.html only.",
    slash: true,
  },
  {
    folder: "progress_report_preschool",
    reportName: "Progress Report Preschool",
    refDoctype: "Master Grade",
    slug: "progress-report-preschool",
    layoutFile: "progress_report_preschool.html",
    layout: "Print = progress_report_preschool.html only.",
  },
  {
    folder: "form_10",
    reportName: "Transcript of Records",
    refDoctype: "Master Grade",
    slug: "form-10",
    layoutFile: "form_10.html",
    layout:
      "Print = form_10.html (DepEd Form 10 / TOR): credential/school blocks from filters; subject tables between *** subject grade *** / *** subject start *** markers; page-break after subject chunks. Never invent Form 10 columns.",
    slash: true,
    tip: "Student-centric: student_name, credential, elementary, school_year, add_school, admission, date_issued, school_id, lrn, rating, date_exam, name_add.",
  },
  {
    folder: "jhs_form_10",
    reportName: "Transcript of Records Junior High",
    refDoctype: "Master Grade",
    slug: "jhs-form-10",
    layoutFile: "jhs_form_10.html",
    layout: "Print = jhs_form_10.html only.",
    slash: true,
  },
  {
    folder: "jhs_transcript_of_records",
    reportName: "JHS Transcript of Records",
    refDoctype: "Master Grade",
    slug: "jhs-tor",
    layoutFile: "jhs_transcript_of_records.html",
    layout: "Print = jhs_transcript_of_records.html only.",
  },
  {
    folder: "junior_high_form_10",
    reportName: "Junior High Form 10",
    refDoctype: "Master Grade",
    slug: "junior-high-form-10",
    layoutFile: "junior_high_form_10.html",
    layout: "Print = junior_high_form_10.html only.",
  },
  {
    folder: "es_form_10",
    reportName: "ES Form 10",
    refDoctype: "Master Grade",
    slug: "es-form-10",
    layoutFile: "es_form_10.html",
    layout: "Print = es_form_10.html only.",
  },
  {
    folder: "senior_high_form_10",
    reportName: "Senior High Form 10",
    refDoctype: "Master Grade",
    slug: "senior-high-form-10",
    layoutFile: "senior_high_form_10.html",
    layout: "Print = senior_high_form_10.html only.",
  },
  {
    folder: "shs_form_10",
    reportName: "SHS Transcript of Records",
    refDoctype: "Master Grade",
    slug: "shs-form-10",
    layoutFile: "shs_form_10.html",
    layout: "Print = shs_form_10.html only.",
    slash: true,
  },
  {
    folder: "school_form_4_(sf4)",
    reportName: "School Form 4 (SF4)",
    refDoctype: "Enrollees",
    slug: "sf4",
    layoutFile: "school_form_4_(sf4).html",
    layout: "Print = school_form_4_(sf4).html (SF4 enrolment/attendance grid from Enrollees). Never invent SF4 columns.",
    slash: true,
  },
  {
    folder: "school_form_5_(sf5)",
    reportName: "School Form 5 (SF5)",
    refDoctype: "Master Grade",
    slug: "sf5",
    slash: true,
    tip: "Desk Script Report School Form 5 (SF5). Prefer this name; layout is the installed report print format — do not invent SF5 HTML.",
  },
  {
    folder: "school_form_5_sf5",
    reportName: "School Form 5 SF5",
    refDoctype: "Master Grade",
    slug: "sf5-alt",
    layoutFile: "school_form_5_sf5.html",
    layout: "Print = school_form_5_sf5.html only (alternate SF5).",
  },
  {
    folder: "school_form_5a_shs",
    reportName: "School Form 5A SHS",
    refDoctype: "Master Grade Senior High",
    slug: "sf5a-shs",
    layoutFile: "school_form_5a_shs.html",
    layout: "Print = school_form_5a_shs.html only.",
  },
  {
    folder: "school_form_5b_shs",
    reportName: "School Form 5B SHS",
    refDoctype: "Master Grade Senior High",
    slug: "sf5b-shs",
    layoutFile: "school_form_5b_shs.html",
    layout: "Print = school_form_5b_shs.html only.",
  },
  {
    folder: "school_form_6",
    reportName: "School Form 6",
    refDoctype: "Master Grade",
    slug: "sf6",
    layoutFile: "school_form_6.html",
    layout: "Print = school_form_6.html only.",
    slash: true,
  },
  {
    folder: "school_form_6_(sf6)",
    reportName: "School Form 6 (SF6)",
    refDoctype: "Master Grade",
    slug: "sf6-alt",
  },
  {
    folder: "school_form_6_shs",
    reportName: "School Form 6 SHS",
    refDoctype: "Master Grade Senior High",
    slug: "sf6-shs",
    layoutFile: "school_form_6_shs.html",
    layout: "Print = school_form_6_shs.html only.",
  },
  {
    folder: "quarterly_ranking",
    reportName: "Quarterly Ranking",
    refDoctype: "Master Grade",
    slug: "quarterly-ranking",
    layoutFile: "quarterly_ranking.html",
    layout:
      "Print = quarterly_ranking.html: school logos/DepEd logo; bordered ranking table (Student + averages/ranks); honor bands e.g. WITH HIGHEST HONORS. Never invent ranking certificates unless user asked for Quarterly Ranking Certificate.",
    slash: true,
    tip: "Filters: school_year, quarter, section/level, initial_not_below, not_below.",
  },
  {
    folder: "quarterly_ranking_certificate",
    reportName: "Quarterly Ranking Certificate",
    refDoctype: "Master Grade",
    slug: "quarterly-ranking-certificate",
  },
  {
    folder: "student_ranking",
    reportName: "Student Ranking",
    refDoctype: "Master Grade",
    slug: "student-ranking",
    layoutFile: "student_ranking.html",
    layout: "Print = student_ranking.html only.",
    slash: true,
  },
  {
    folder: "student_ranking_final",
    reportName: "Student Ranking Final",
    refDoctype: "Master Grade",
    slug: "student-ranking-final",
    layoutFile: "student_ranking_final.html",
    layout: "Print = student_ranking_final.html only.",
  },
  {
    folder: "student_ranking_shs",
    reportName: "Student Ranking SHS",
    refDoctype: "Master Grade",
    slug: "student-ranking-shs",
    layoutFile: "student_ranking_shs.html",
    layout: "Print = student_ranking_shs.html only.",
  },
  {
    folder: "quarterly_averaging",
    reportName: "Quarterly Averaging",
    refDoctype: "Quarterly Grade",
    slug: "quarterly-averaging",
  },
  {
    folder: "quarterly_averaging_by_subject",
    reportName: "Quarterly Averaging By Subject",
    refDoctype: "Quarterly Grade",
    slug: "quarterly-averaging-by-subject",
  },
  {
    folder: "subject_averaging",
    reportName: "Subject Averaging",
    refDoctype: "Master Grade",
    slug: "subject-averaging",
    layoutFile: "subject_averaging.html",
    layout: "Print = subject_averaging.html only.",
  },
  {
    folder: "subject_averaging_shs",
    reportName: "Subject Averaging SHS",
    refDoctype: "Master Grade",
    slug: "subject-averaging-shs",
    layoutFile: "subject_averaging_shs.html",
    layout: "Print = subject_averaging_shs.html only.",
  },
  {
    folder: "subject_final_rating",
    reportName: "Subject Final Rating",
    refDoctype: "Master Grade",
    slug: "subject-final-rating",
    layoutFile: "subject_final_rating.html",
    layout: "Print = subject_final_rating.html only.",
  },
  {
    folder: "subject_grading_report",
    reportName: "Subject Grading Report",
    refDoctype: "Weighted Grade Sheet",
    slug: "subject-grading-report",
    layoutFile: "subject_grading_report.html",
    layout: "Print = subject_grading_report.html only.",
  },
  {
    folder: "subject_needs_upload",
    reportName: "Subject Needs Upload",
    refDoctype: "Submit Grading Sheet",
    slug: "subject-needs-upload",
    layoutFile: "subject_needs_upload.html",
    layout: "Print/list = subject_needs_upload.html — status grid only; do not invent a report card.",
    slash: true,
    tip: "Filters: school_year, quarter, level/subject, status (for Approval / Needs Upload / For Consolidation).",
  },
  {
    folder: "master_grades_report",
    reportName: "Master Grades Report",
    refDoctype: "Master Grade",
    slug: "master-grades",
    layoutFile: "master_grades_report.html",
    layout: "Print = master_grades_report.html only.",
  },
  {
    folder: "master_grading_report",
    reportName: "Master Grading Report",
    refDoctype: "Master Grade",
    slug: "master-grading",
    layoutFile: "master_grading_report.html",
    layout: "Print = master_grading_report.html only.",
  },
  {
    folder: "mastersheets_shs",
    reportName: "Mastersheets SHS",
    refDoctype: "Master Grade Senior High",
    slug: "mastersheets-shs",
    layoutFile: "mastersheets_shs.html",
    layout: "Print = mastersheets_shs.html only.",
    slash: true,
  },
  {
    folder: "class_subject_grade_performance",
    reportName: "Class Subject Grade Performance",
    refDoctype: "Master Grade",
    slug: "class-subject-performance",
  },
  {
    folder: "student_subject_grade_performance",
    reportName: "Student Subject Grade Performance",
    refDoctype: "Master Grade",
    slug: "student-subject-performance",
  },
  {
    folder: "students_with_failed_or_inc",
    reportName: "Students with Failed or INC",
    refDoctype: "Master Grade",
    slug: "failed-or-inc",
    layoutFile: "students_with_failed_or_inc.html",
    layout: "Print = students_with_failed_or_inc.html only.",
    slash: true,
  },
  {
    folder: "student_attendance_report",
    reportName: "Student Attendance Report",
    refDoctype: "Master Grade",
    slug: "student-attendance",
  },
  {
    folder: "shs_average_of_semesters",
    reportName: "SHS Average of Semesters",
    refDoctype: "Final General Average",
    slug: "shs-average-semesters",
  },
  {
    folder: "view_grades_bed",
    reportName: "View Grades BED",
    refDoctype: "Dummy Doctype for Report K12",
    slug: "view-grades-bed",
    layoutFile: "view_grades_bed.html",
    layout: "Print = view_grades_bed.html only.",
  },
];

function deskReportPath(reportName: string): string {
  return `/app/query-report/${encodeURIComponent(reportName)}`;
}

function catalogMarkdown(): string {
  return SCHOOL_GRADING_REPORTS.map(
    (r) =>
      `| ${r.reportName} | \`${r.refDoctype}\` | \`${deskReportPath(r.reportName)}\` | \`/school-erp-generate-${r.slug}\` |`,
  ).join("\n");
}

export const SCHOOL_GRADING_REPORTS_INSTRUCTIONS = `# School ERP Grading Reports (wela_bed_v15)

Use this skill when the user wants to **generate / open / run** a BED grading Script Report from School ERP (\`wela_bed_v15/grading/report\`).

## Layout source of truth (CRITICAL)

- **Report Cards (GS/JHS/SHS/Preschool):** structure is **NON-NEGOTIABLE** — follow skill **BED Report Card Layout (SF9)** (DepEd SF9 / Form 138 from school samples). Print still comes from the installed Script Report HTML; the SF9 skill defines the only allowed block order and sections.
- **Other grading reports:** print layout = installed Frappe template under \`wela_bed_v15/grading/report/{folder}/*.html\` — **not AI**.
- **Never invent** report-card HTML, CSS, Web Pages, Web Forms, or Print Formats that "look like" these reports.
- **Never** call \`school_erp_set_web_page_html\` / Output webpage builders for grading reports unless the user explicitly asks to edit a *different* Web Page (not the report).
- Your job: pick the catalog report → collect **filters from this skill** → open/run the **Desk** report so Frappe renders **its** HTML.
- If the user asks "redesign the layout", refuse freestyle — for Report Cards, restate **BED Report Card Layout (SF9)**; otherwise point to the report \`.html\` in School ERP.

## Requirements

- School ERP connected in BBAI (rail / embed SID).
- Prefer Cursor + School ERP tools / school MCP (\`run_report\` when available).
- These are **Desk Script Reports** under module **Grading** — not Web Pages.

## How to help (always)

1. **Pick the report** from the catalog (Report Card ≠ Report Card Senior High).
2. **Ask only for missing filters** listed for that report (do not invent filter names).
3. Desk URL: \`{schoolBaseUrl}/app/query-report/{exact report_name}\` (URL-encode).
4. **Refresh Data** when the report hides default Refresh (Report Card family).
5. If \`run_report\` exists: \`report_name\` = exact catalog name + collected filters.
6. On errors (adviser, sectioning, range, Average Based On): explain prerequisites — **do not invent grades or layout**.

## Common prerequisites

- Submitted **Sectioning** for School Year + Section
- **Class adviser** for that section + SY
- **Master Grade** / SHS rows for students + subjects
- Subjects \`show_in_report\` as needed
- Last quarter: **Average Based On** in General Settings → Grading → Report Setup

## Catalog (exact \`report_name\`)

| Report | Ref DocType | Desk path | Slash |
|--------|-------------|-----------|-------|
${catalogMarkdown()}

## Layout contracts (from repo templates)

${SCHOOL_GRADING_REPORTS.filter((r) => r.layout)
  .map(
    (r) =>
      `### ${r.reportName}\n- Template: \`wela_bed_v15/grading/report/${r.folder}/${r.layoutFile ?? "(installed print)"}\`\n- ${r.layout}`,
  )
  .join("\n\n")}

## Popular filter patterns

### Report Card (GS/JHS)
\`school_year\`, \`quarter\`, \`section\`, \`date_issued\`, \`show_quarterly\` (Yes/No), \`range_from\`, \`range_to\`, optional \`student_name\`, \`show_transmuted\`, \`show_numeric\`, \`letter_head\`

### Report Card Senior High
+ \`semester\`, \`strand\`, \`advisers_copy\`, \`show_average_1\`

### Grade Slip
+ \`grade_slip_per_page\`, \`remarks_table\`

### Form 10 / TOR
Student-centric: \`student_name\`, credential/school/LRN fields, \`date_issued\`

### Ranking
\`school_year\`, \`quarter\`, section/level, \`initial_not_below\`, \`not_below\`

## Guardrails

- Never claim print/export finished unless tools confirm data.
- Prefer one student via **Student** for a single card.
- Keep **To Student** ≤ **Student Count**.
- SHS ≠ GS templates/filters.
`;

function school(
  subCommand: string,
  name: string,
  description: string,
  instructions: string,
  promptText: string,
): BuiltinSkillDefinition {
  return {
    name,
    description,
    categoryName: "School ERP Grading",
    content: instructions,
    instructions,
    slash: { commandName: "school-erp", subCommand, promptText },
  };
}

function generatePrompt(reportName: string, tip?: string): string {
  const tipLine = tip ? ` Tip: ${tip}` : "";
  const sf9 = /report card/i.test(reportName)
    ? ' Also follow "BED Report Card Layout (SF9)" — NON-NEGOTIABLE DepEd SF9 structure.'
    : "";
  return `Follow the skill "School ERP Grading Reports" for report "${reportName}".${sf9} Layout MUST come from those skills / ERP Script Report template — do NOT invent HTML, Web Pages, or Print Formats.${tipLine} Ask me only for missing filters, then open/run the Desk report (run_report or ${deskReportPath(reportName)} + Refresh Data / print).`;
}

/** Catalog + dedicated /school-erp-generate-* slash skills for popular reports. */
export function builtinGradingReportSkills(): BuiltinSkillDefinition[] {
  const skills: BuiltinSkillDefinition[] = [
    school(
      "generate-report",
      "School ERP Grading Reports",
      "Pick and generate any BED grading Script Report (Report Card, SF forms, ranking, TOR, etc.)",
      SCHOOL_GRADING_REPORTS_INSTRUCTIONS,
      'Follow the skill "School ERP Grading Reports". List matching reports from the catalog for what I asked, then collect filters and help me generate the chosen report (desk query-report URL + School ERP tools when available).',
    ),
  ];

  for (const r of SCHOOL_GRADING_REPORTS) {
    if (!r.slash) continue;
    const template = r.layoutFile
      ? `wela_bed_v15/grading/report/${r.folder}/${r.layoutFile}`
      : `wela_bed_v15/grading/report/${r.folder}/ (installed Script Report print)`;
    const short = `# Generate ${r.reportName}

## Layout (NOT AI)

Print layout is **only** the School ERP Script Report template:

- Template: \`${template}\`
${r.layout ? `- Contract: ${r.layout}\n` : ""}
**Forbidden:** inventing HTML/CSS, Web Pages, Output canvas pages, or custom Print Formats that mimic this report.

## Run (filters from skill / desk)

- Desk: \`${deskReportPath(r.reportName)}\`
- Ref DocType: \`${r.refDoctype}\`
${r.tip ? `- Filters: ${r.tip}\n` : ""}
Ask only for missing filters → \`run_report\` if available → else open desk URL → **Refresh Data** / print. Follow **School ERP Grading Reports** for prerequisites.
`;
    skills.push(
      school(
        `generate-${r.slug}`,
        `School ERP Generate ${r.reportName}`,
        `Generate ${r.reportName} using the official School ERP print template (not AI layout)`,
        short,
        generatePrompt(r.reportName, r.tip),
      ),
    );
  }

  return skills;
}
