"use client";

import { createContext, useContext } from "react";
import type { RightDockTool } from "./RightToolsDock";

export type RightToolsDockContextValue = {
  tools: RightDockTool[];
  activeId: string | null;
  openTool: (id: string) => void;
  toggleTool: (id: string) => void;
};

const RightToolsDockContext = createContext<RightToolsDockContextValue | null>(null);

export function RightToolsDockProvider({
  value,
  children,
}: {
  value: RightToolsDockContextValue;
  children: React.ReactNode;
}) {
  return (
    <RightToolsDockContext.Provider value={value}>{children}</RightToolsDockContext.Provider>
  );
}

export function useRightToolsDock() {
  return useContext(RightToolsDockContext);
}
