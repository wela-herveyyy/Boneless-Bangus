import type {
  CursorResult,
  PromptAgentInput,
  PromptAgentOutput,
} from "@/lib/entities/cursor.type";
import { promptAgent as promptAgentUseCase } from "../usecases/cursor/prompt_agent.usecase";

export async function promptAgent(
  input: PromptAgentInput,
): Promise<CursorResult<PromptAgentOutput>> {
  return promptAgentUseCase(input);
}
