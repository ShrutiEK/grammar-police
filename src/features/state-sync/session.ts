/**
 * Cookie that carries the anonymous learner session id. It is minted by the
 * middleware and read by the `/api/state` routes to namespace Redis keys.
 * Shared here so the middleware and the routes agree on the name without one
 * importing the other.
 */
export const SESSION_COOKIE_NAME = "gp_session";
