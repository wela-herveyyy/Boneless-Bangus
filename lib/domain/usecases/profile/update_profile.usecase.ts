import { eq, and, ne } from "drizzle-orm";
import { database } from "@/database";
import { user } from "@/database/schema";

import type { UpdateProfileInput, UpdateProfileOutput } from "@/lib/entities/profile.type";

export async function updateProfile(
  userId: string,
  input: UpdateProfileInput
): Promise<UpdateProfileOutput> {
  const name = input.name.trim();
  const email = input.email.trim();

  if (!name || !email) {
    return { ok: false, error: "Name and email are required." };
  }

  // Check if email is already taken by ANOTHER user
  const existingUser = await database.query.user.findFirst({
    where: and(eq(user.email, email), ne(user.id, userId)),
  });

  if (existingUser) {
    return { ok: false, error: "This email address is already in use by another account." };
  }

  try {
    await database
      .update(user)
      .set({ name, email })
      .where(eq(user.id, userId));

    return { ok: true };
  } catch (error) {
    console.error("Failed to update profile:", error);
    return { ok: false, error: "An unexpected error occurred while updating your profile." };
  }
}
