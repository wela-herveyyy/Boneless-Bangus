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
    attribution: "— Giya, on Mondays",
    tips: [
      "Sign in with your ERPNext site (Livro by default, or the parent school URL).",
      "First login creates your Giya user — then a short onboarding.",
      "If login fails, check those ERP credentials before blaming Giya.",
    ],
  },
  "sign-up": {
    eyebrow: "Words of wisdom",
    quote:
      "No separate registration. ERP login is the front door — Giya onboards you if you are new.",
    attribution: "— Livro Systems Inc., probably",
    tips: [
      "Use your ERP email and password for the site you’re signing into.",
      "Permissions follow your Giya role after onboarding.",
      "Giya means guide — start at Sign in.",
    ],
  },
};

export function getAuthShellContent(title: string, description: string): AuthShellContent {
  return { title, description };
}

export function getAuthWisdom(variant: AuthShellVariant): AuthWisdom {
  return AUTH_WISDOM[variant];
}
