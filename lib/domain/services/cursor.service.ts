import type {
  CursorResult,
  PromptAgentInput,
  PromptAgentOutput,
} from "@/lib/entities/cursor.type";
import type { AiStreamClientEvent } from "@/lib/entities/google_ai.type";
import {
  createCursorAgentStream as createCursorAgentStreamUseCase,
  type CreateCursorAgentStreamInput,
} from "../usecases/cursor/create_agent_stream.usecase";
import { promptAgent as promptAgentUseCase } from "../usecases/cursor/prompt_agent.usecase";

export async function promptAgent(
  input: PromptAgentInput,
): Promise<CursorResult<PromptAgentOutput>> {
  return promptAgentUseCase(input);
}

export function createCursorAgentStream(
  input: CreateCursorAgentStreamInput,
): AsyncGenerator<AiStreamClientEvent> {
  return createCursorAgentStreamUseCase(input);
}
