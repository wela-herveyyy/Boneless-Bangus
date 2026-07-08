export type AuthShellVariant = "sign-in" | "sign-up";

type AuthShellContent = {
  title: string;
  description: string;
};

type AuthWisdom = {
  eyebrow: string;
  quote: string;
  attribution: string;
  tips: string[];
};

const AUTH_WISDOM: Record<AuthShellVariant, AuthWisdom> = {
  "sign-in": {
    eyebrow: "Words of wisdom",
    quote:
      "Just Understands Nearly Everything… Late. Show up anyway — your tasks, bugs, and school setups are waiting.",
    attribution: "— Boneless Bangus AI, on Mondays",
    tips: [
      "Sign in once. BBAI only sees what your account already can.",
      "Overdue tasks do not get less overdue while you refresh the page.",
      "If login fails, check credentials before blaming the bangus.",
    ],
  },
  "sign-up": {
    eyebrow: "Words of wisdom",
    quote:
      "Better Business AI Inside starts with one account. No app store, no drama — just email, password, and permission-bound help.",
    attribution: "— Livro Systems Inc., probably",
    tips: [
      "Use a work email if your team shares an ERP site.",
      "Permissions follow you — BBAI never outruns your role.",
      "Boneless Bangus Always Informed. Registration is step zero.",
    ],
  },
};

export function getAuthShellContent(title: string, description: string): AuthShellContent {
  return { title, description };
}

export function getAuthWisdom(variant: AuthShellVariant): AuthWisdom {
  return AUTH_WISDOM[variant];
}
