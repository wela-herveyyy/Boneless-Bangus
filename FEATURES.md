# BBAI — App Features

**Boneless Bangus AI (BBAI)** is Livro Systems’ internal assistant for tasks, QA/bugs, and school setup. It answers from your account, role, and connected tools—not from access you don’t have.

---

## Get started

| Feature | What you can do |
|--------|------------------|
| **Sign up / sign in** | Create an account or sign in with email and password. |
| **Onboarding** | Set your display name, role, and focus (tasks, bugs, school setup, or general). |
| **Install as app (PWA)** | Open `/landing` and install BBAI as a standalone app when your browser supports it. |

---

## Workspace chat

The main place you work with BBAI.

- Ask questions in natural language; replies stream in Markdown.
- Attach files to a message.
- Start a **new chat**, browse **history**, reopen past chats, or **archive** them.
- Pick an **AI route**:
  - **Cursor** — agent with MCP tools (ERP, skills, more)
  - **Gemma 4** — Google model
  - **Antigravity** — Google agent path
- Choose which **API key** to use: **Personal**, **Team**, or **System** (when available).
- Type **`/`** to open slash commands (built-in + installed skills).

---

## Slash commands & skills

Skills teach BBAI a repeatable workflow. Installed skills show up as `/` commands.

### Always available

| Command | Purpose |
|--------|---------|
| **`/skill-maker`** | Guided flow: name → description → instructions, then save a skill to your account (private by default). |

### Google Workspace *(when Workspace is connected)*

Examples include morning briefing, end-of-day wrap-up, meeting prep, catch-up unread mail, urgent mail scan, draft decline/follow-up, today’s agenda, find time slots, free time tomorrow, and meeting conflicts.

### ERPNext / Livro ERP *(when ERP is connected; best with Cursor)*

Examples include get customer, create invoice, check stock, **request leave** (ERP leave + email approver), and **ERP wrap-up** (timesheets/attendance/todos plus Gmail/calendar).

### Your skills

Anything you create or install from the marketplace appears in `/` and can be used in chat.

---

## Right-side tools

Open these from the workspace rail:

| Tool | What you can do |
|------|------------------|
| **Google Workspace** | Connect with Google; turn on Calendar, Meet, and/or Gmail; browse/create events, schedule Meet, list/send mail. |
| **GitHub** | Connect with a personal access token; browse personal, collaborator, and org repos for the agent. *(Visible for roles with GitHub access.)* |
| **School ERP** | Choose your school ERP URL, sign in (OTP if required); see overview (students, teachers, classes, settings); unlock School ERP tools in chat. |
| **Livro ERP (Tools)** | Sign in to Livro ERPNext; see hours/tasks/sprint-style overview; unlock ERPNext tools in chat. |
| **Theme** | Pick color presets or paste custom CSS tokens; save/delete themes locally; copy CSS. |
| **Skills marketplace** | Search and filter skills; install/uninstall; open details; add or delete your own skills. |
| **Settings** | Manage **Installed Skills**, **Installed MCPs** (servers & credentials), and **API Integrations** (Google connect + capability toggles). |

---

## Skills marketplace

- Browse **global** and **your private** skills by category or search.
- **Install** a skill to use it in chat; **uninstall** when you no longer need it.
- **Create** skills from the marketplace, Settings → Installed Skills, or **`/skill-maker`**.
- New skills are **private by default** unless you publish them as global (where allowed).

---

## Profile, teams & keys

| Feature | What you can do |
|--------|------------------|
| **Profile** | View name/email; manage personal Cursor and Gemini API keys; join or leave a team. Also available as an overlay from the workspace. |
| **Teams** | Join with a **6-digit code**. Leaders manage shared Cursor/Gemini keys; team members can use the team key in chat. |
| **Team profile** | See members, join code, shared keys, and team AI usage. |
| **User profile** | Role, team, key status, and AI usage (conversations, tokens, cost)—often opened from Admin. |

---

## Admin control center

*(Permission-gated — typically owners/admins.)*

- **People & access** — browse users, open profiles, change roles.
- **Teams & shared keys** — create teams, open team profiles, manage shared API keys.
- **Role management** — create and manage onboarding roles.

---

## MCP servers

MCP (Model Context Protocol) servers give the agent extra tools.

- Install and configure servers (and secrets) under **Settings → Installed MCPs**.
- Full catalogue pages at `/mcp` (browse, register, edit) when you need deeper setup.
- Connected School ERP and Livro ERP sessions feed into chat tools automatically where supported.

---

## What BBAI is good for

1. **Task intelligence** — priorities, status, and next steps from your connected work systems.
2. **QA & bugs** — root-cause style help within your permissions and context.
3. **School setup** — registrar/School ERP workflows when School ERP is connected.
4. **Day-to-day ops** — Gmail/Calendar/Meet, leave requests, ERP wrap-ups, and custom skills you define once and reuse with `/`.

---

## Tips

- Prefer **Cursor** when you need ERP + Gmail (or other MCP) in the same turn.
- Connect **Google Workspace** and the relevant **ERP** sidebar before running those slash commands.
- After **`/skill-maker`**, the new skill shows in Skills and `/` without a full page reload.
- Use **Team** keys when your team leader has shared Cursor/Gemini credentials.

---

*Product name: Boneless Bangus AI · Short name: BBAI · Maker: Livro Systems Inc.*
