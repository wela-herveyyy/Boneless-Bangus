import { getProfile as getProfileUseCase } from "../usecases/profile/get_profile.usecase";
import { updateProfile as updateProfileUseCase } from "../usecases/profile/update_profile.usecase";
import type { ProfileData, UpdateProfileInput, UpdateProfileOutput } from "@/lib/entities/profile.type";

export async function getProfileService(userId: string): Promise<ProfileData> {
  return getProfileUseCase(userId);
}

export async function updateProfileService(userId: string, input: UpdateProfileInput): Promise<UpdateProfileOutput> {
  return updateProfileUseCase(userId, input);
}
