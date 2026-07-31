import type { Metadata } from "next";
import { InstallLanding } from "@/components/organisms/InstallLanding/InstallLanding";

export const metadata: Metadata = {
  title: "Giya",
  description:
    "Giya — Livro Systems' internal assistant that guides tasks, QA, and school setup.",
};

/** Same public install/marketing page as `/landing` (alias redirects here). */
export default function HomePage() {
  return <InstallLanding />;
}
