import type { Metadata } from "next";
import { Suspense } from "react";
import {
  InstallLanding,
  InstallLandingFallback,
} from "@/components/organisms/InstallLanding/InstallLanding";

export const metadata: Metadata = {
  title: "BBAI | Boneless Bangus AI",
  description:
    "Boneless Bangus AI — Livro Systems' internal assistant for tasks, QA, and school setup support.",
};

export default function LandingPage() {
  return (
    <Suspense fallback={<InstallLandingFallback />}>
      <InstallLanding />
    </Suspense>
  );
}
