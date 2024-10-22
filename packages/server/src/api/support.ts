import type { Router } from "@oak/oak";
import { verifySession } from "./middleware";

export function add_router_support(router: Router) {
    router.get('/support/chat', verifySession, async (ctx) => {
        ctx.response.body = ctx.state.user
    });
}