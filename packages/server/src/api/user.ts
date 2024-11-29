import { Hono } from "hono";
import type { UpgradeWebSocket } from "hono/ws";
import type { ChatRequest } from "sage-support-shared";
import { db_conversation_by_userid, db_conversation_create, db_conversation_delete, db_conversation_with_msg_by_id } from "../database/index.ts";
import { service_post_user_msg, service_set_supportuid, service_websocket, userWebsocketPool } from "../service/index.ts";
import { verifySession, verifyUser } from "./middleware.ts";

export function add_router_user(app: Hono, upgradeWebSocket: UpgradeWebSocket) {
    // app.post('/user/chat', async (ctx) => {
    //     const data = <ChatRequest>await ctx.request.body.json()

    // });
    app.get('/user/conversations', verifySession, verifyUser, async (ctx) => {
        return ctx.json(await db_conversation_by_userid(ctx.get('user').id))
    });
    app.get('/user/websocket', verifySession, verifyUser, upgradeWebSocket((ctx) => {
        return service_websocket(ctx, userWebsocketPool)
    }))
    app.get('/user/conversation/:id', verifySession, verifyUser, async (ctx) => {
        // return ctx.json(await db_conversation_by_id(Number(ctx.params.id))
        return ctx.json(await db_conversation_with_msg_by_id(Number(ctx.req.param('id'))))
    });
    app.post('/user/conversation/:id', verifySession, verifyUser, async (ctx) => {
        const data = await ctx.req.json<ChatRequest>()
        service_post_user_msg(ctx.get('user').id, Number(ctx.req.param('id')), data.msg)
        return ctx.body(null, 204)
    });
    app.delete('/user/conversation/:id', verifySession, verifyUser, async (ctx) => {
        await db_conversation_delete(Number(ctx.req.param('id')))
        return ctx.json(await db_conversation_by_userid(ctx.get('user').id))
    })
    app.put('/user/conversation/:id/support', verifySession, verifyUser, async (ctx) => {
        const result = await service_set_supportuid(Number(ctx.req.param('id')))
        if (result) return ctx.json(await db_conversation_by_userid(ctx.get('user').id))
        else return ctx.json({ code: 400, msg: '内部错误' }, 400)
    })
    app.post('/user/conversation', verifySession, verifyUser, async (ctx) => {
        const data = await ctx.req.json<ChatRequest>()
        const conversation = await db_conversation_create(ctx.get('user').id)
        service_post_user_msg(ctx.get('user').id, conversation.id, data.msg)
        return ctx.json(conversation)
    });
}