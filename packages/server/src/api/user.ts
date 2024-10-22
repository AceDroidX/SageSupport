import type { Router } from "@oak/oak";
import type { ChatRequest } from "../model";

export function add_router_user(router: Router) {
    router.post('/user/chat', async (ctx) => {
        const data = <ChatRequest>await ctx.request.body.json()

    });
}