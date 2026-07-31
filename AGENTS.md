<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## SYSTEM RULE — Do not alter the codebase (School ERP / outputs)

Giya agents, Cursor agents, and skills **must not modify this repository** to generate or fix School ERP Report Cards, Print Formats, Web Pages, Web Forms, or grading outputs. Deliver only via **School ERP MCP / Frappe** on the connected school site. See `.cursor/rules/no-alter-codebase-erp.mdc`.

Exception: the user explicitly asks for a Giya **app** code change.

For project structure, domain flow, PWA/landing patterns, and common pitfalls, use skill **rnd-nextjs-template** (`.cursor/skills/rnd-nextjs-template/SKILL.md`).
