import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { database } from "@/database";
import * as schema from "@/database/schema";
import { erpLivroPlugin } from "@/lib/auth/erp-livro-plugin";

export const auth = betterAuth({
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL,
    emailAndPassword: {
        enabled: true,
    },
    database: drizzleAdapter(database, {
        provider: "mysql",
        schema,
    }),
    // nextCookies must be last so Set-Cookie from custom sign-in is applied in RSC/actions
    plugins: [erpLivroPlugin(), nextCookies()],
});
