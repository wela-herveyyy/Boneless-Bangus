/** Browser event: skills list changed (create / install / delete). */
export const SKILLS_CHANGED_EVENT = "bbai-skills-changed";

export function notifySkillsChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(SKILLS_CHANGED_EVENT));
}
