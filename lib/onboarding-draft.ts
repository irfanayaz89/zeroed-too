import type { PlannedBlock } from "@/lib/focus";

/** Answers from the setup screens, handed on to warm-up, nudges, building and preview. */
export interface SetupDraft {
  name: string;
  focus: string[];
  free: string[];
  perDay: number;
  len: number;
  challenge: string | null;
  plan: PlannedBlock[] | null;
}

let draft: SetupDraft | null = null;
export const getDraft = () => draft;
export const setDraft = (d: SetupDraft) => {
  draft = d;
};
