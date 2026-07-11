import type {
  CreateInteractionInput,
  CreateInteractionOutput,
  GoogleAiResult,
} from "@/lib/entities/google_ai.type";
import { createInteraction as createInteractionUseCase } from "../usecases/google_ai/create_interaction.usecase";

export async function createInteraction(
  input: CreateInteractionInput,
): Promise<GoogleAiResult<CreateInteractionOutput>> {
  return createInteractionUseCase(input);
}
