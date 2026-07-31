"use client";

import { RiTailwindCssLine } from "react-icons/ri";
import {
  useRightSidebar,
  RightSidebarTrigger,
  RightSidebarBackdrop,
  RightSidebarPanel,
  RightSidebarHeader,
  RightSidebarContent,
} from "@/components/molecules/RightSidebar/RightSidebar";
import { ThemePanel } from "./ThemePanel";

/** Public / landing theme access — workspace users use Profile → Theme. */
export function ThemeSidebar({ topOffset }: { topOffset?: string } = {}) {
  const sidebar = useRightSidebar("theme", { bodyClass: "bbai-theme-sidebar-open" });

  return (
    <>
      <RightSidebarTrigger
        sidebar={sidebar}
        icon={<RiTailwindCssLine className="size-6" aria-hidden />}
        labelOpen="Hide theme sidebar"
        labelClosed="Show theme sidebar"
        topOffset={topOffset}
      />

      <RightSidebarBackdrop sidebar={sidebar} />

      <RightSidebarPanel sidebar={sidebar} className="theme-sidebar-panel">
        <RightSidebarHeader
          sidebar={sidebar}
          subtitle="Global theme"
          title="Tailwind tokens"
          closeLabel="Close theme sidebar"
        />

        <RightSidebarContent className="theme-sidebar-content">
          <ThemePanel />
        </RightSidebarContent>
      </RightSidebarPanel>
    </>
  );
}
