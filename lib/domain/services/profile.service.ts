import { getProfile as getProfileUseCase } from "../usecases/profile/get_profile.usecase";
import type { ProfileData } from "@/lib/entities/profile.type";

export async function getProfileService(userId: string): Promise<ProfileData> {
  return getProfileUseCase(userId);
}
