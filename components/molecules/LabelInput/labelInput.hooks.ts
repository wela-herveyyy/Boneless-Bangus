import type { ChangeEventHandler, InputHTMLAttributes } from "react";

export type LabelInputField = {
  label: string;
  name: string;
  type?: InputHTMLAttributes<HTMLInputElement>["type"];
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
  value?: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
};

export function useLabelInputStyles() {
  return "block space-y-2";
}
