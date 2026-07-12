import type {
  CreateInteractionInput,
  CreateInteractionOutput,
  GoogleAiResult,
  GoogleAiStreamEvent,
} from "@/lib/entities/google_ai.type";
import { createInteraction as createInteractionUseCase } from "../usecases/google_ai/create_interaction.usecase";
import { createInteractionStream as createInteractionStreamUseCase } from "../usecases/google_ai/create_interaction_stream.usecase";

export async function createInteraction(
  input: CreateInteractionInput,
): Promise<GoogleAiResult<CreateInteractionOutput>> {
  return createInteractionUseCase(input);
}

export function createInteractionStream(
  input: CreateInteractionInput,
): AsyncGenerator<GoogleAiStreamEvent> {
  return createInteractionStreamUseCase(input);
}
