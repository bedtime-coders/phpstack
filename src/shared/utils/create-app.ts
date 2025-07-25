import { OpenAPIHono, type OpenAPIHonoOptions } from "@hono/zod-openapi";
import type { Hono, Env as HonoEnv, Schema } from "hono";
import { HTTPException } from "hono/http-exception";
import type { EmptyObject } from "type-fest";
import { StatusCodes } from "@/shared/constants";
import { formatZodErrors } from "@/shared/errors";
import type { JwtPayload } from "@/shared/schema";
import {
	auth,
	type TokenVariables,
} from "../../core/middleware/auth.middleware";

type DefaultEnv = HonoEnv & {
	Variables: Partial<TokenVariables<typeof JwtPayload>>;
};
type DefaultAuthEnv = HonoEnv & {
	Variables: TokenVariables<typeof JwtPayload>;
};

type HonoInit<E extends DefaultEnv | DefaultAuthEnv> = ConstructorParameters<
	typeof Hono
>[0] &
	OpenAPIHonoOptions<E>;

/**
 * Options for the createApp function.
 */
export type CreateAppOptions<
	E extends DefaultEnv | DefaultAuthEnv = DefaultEnv,
> = {
	/**
	 * Whether to use authentication middleware.
	 */
	auth?: boolean;

	/**
	 * The initial options for the Hono app. (This is what you pass in `new Hono(...)` or `new OpenAPIHono(...)`)
	 */
	init?: HonoInit<E>;
};

/**
 * Create an OpenAPIHono app with optional authentication middleware.
 *
 * @param options - The options for the app. See {@link CreateAppOptions}.
 * @returns The OpenAPIHono app.
 */
export function createApp<
	S extends Schema = EmptyObject,
	BasePath extends string = "/",
>(
	options: CreateAppOptions & { auth: true },
): OpenAPIHono<{ Variables: TokenVariables<typeof JwtPayload> }, S, BasePath>;
export function createApp<
	E extends DefaultEnv = DefaultEnv,
	S extends Schema = EmptyObject,
	BasePath extends string = "/",
>(options: CreateAppOptions & { auth: false }): OpenAPIHono<E, S, BasePath>;
export function createApp<
	E extends DefaultEnv = DefaultEnv,
	S extends Schema = EmptyObject,
	BasePath extends string = "/",
>(): OpenAPIHono<E, S, BasePath>;
export function createApp<
	E extends DefaultEnv = DefaultEnv,
	S extends Schema = EmptyObject,
	BasePath extends string = "/",
>(options?: CreateAppOptions<E>) {
	const app = new OpenAPIHono<E, S, BasePath>({
		defaultHook: (result, { json }) => {
			if (result.success) return;
			throw new HTTPException(StatusCodes.UNPROCESSABLE_CONTENT, {
				cause: result.error,
				res: json({
					errors: formatZodErrors(result),
				}),
			});
		},
		...options?.init,
	});
	app.use("*", auth(options?.auth ? "required" : "optional"));
	return app;
}
