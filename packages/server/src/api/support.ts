import type { Hono } from "hono";
import { verifySession } from "./middleware";

export function add_router_support(app: Hono) {
    app.get('/support/chat', verifySession, async (ctx) => {
        return ctx.json(ctx.get('user'))
    });
}