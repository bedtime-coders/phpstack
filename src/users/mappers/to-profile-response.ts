import type { User } from "@prisma/client";
import { pick } from "radashi";

/**
 * Map a user to a response
 * @param user The user to map
 * @param following Whether the user is following the current user
 * @returns The mapped user
 */
export const toProfileResponse = (user: User, following: boolean) => ({
	profile: { ...pick(user, ["username", "bio", "image"]), following },
});
