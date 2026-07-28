"use client";

import { useEffect, useId, type ReactNode } from "react";
import { HiXMark } from "react-icons/hi2";
import { Portal } from "@/components/atoms/Portal/Portal";

export type ModalSize = "sm" | "md" | "lg";

export type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: ModalSize;
  showClose?: boolean;
  /** Close when backdrop is clicked. Default true. */
  closeOnBackdrop?: boolean;
  /** Close on Escape. Default true. */
  closeOnEscape?: boolean;
  className?: string;
  contentClassName?: string;
  "aria-label"?: string;
};

const SIZE_CLASS: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  showClose = true,
  closeOnBackdrop = true,
  closeOnEscape = true,
  className,
  contentClassName,
  "aria-label": ariaLabel,
}: ModalProps) {
  const autoId = useId();
  const titleId = title ? `${autoId}-title` : undefined;

  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, closeOnEscape, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-140 flex items-center justify-center px-4 py-6">
        <button
          type="button"
          aria-label="Close dialog"
          className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
          onClick={() => {
            if (closeOnBackdrop) onClose();
          }}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-label={!titleId ? ariaLabel : undefined}
          className={[
            "relative flex w-full max-h-[90dvh] flex-col rounded-2xl bg-surface-container-lowest shadow-bloom",
            SIZE_CLASS[size],
            className,
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {title || showClose ? (
            <header className="flex shrink-0 items-start justify-between gap-3 px-5 pt-5 sm:px-6 sm:pt-6">
              <div className="min-w-0 space-y-1">
                {title ? (
                  <h3
                    id={titleId}
                    className="font-display text-xl font-semibold tracking-tight text-on-surface"
                  >
                    {title}
                  </h3>
                ) : null}
                {description ? (
                  <div className="text-sm leading-relaxed text-on-surface-muted">{description}</div>
                ) : null}
              </div>
              {showClose ? (
                <button
                  type="button"
                  onClick={onClose}
                  className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-container-low text-on-surface-muted transition-colors hover:bg-surface-container-high hover:text-primary"
                  aria-label="Close"
                >
                  <HiXMark className="size-5" />
                </button>
              ) : null}
            </header>
          ) : null}

          {children ? (
            <div
              className={[
                "bbai-scroll min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6",
                contentClassName,
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {children}
            </div>
          ) : null}

          {footer ? (
            <footer className="flex shrink-0 flex-wrap items-center justify-end gap-3 px-5 pb-5 pt-1 sm:px-6 sm:pb-6">
              {footer}
            </footer>
          ) : null}
        </div>
      </div>
    </Portal>
  );
}
