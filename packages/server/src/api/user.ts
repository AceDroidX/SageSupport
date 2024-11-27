import { Hono } from "hono";
import type { UpgradeWebSocket, WSContext } from "hono/ws";
import type { ChatRequest } from "sage-support-shared";
import { db_conversation_by_id, db_conversation_by_userid, db_conversation_create, db_conversation_delete } from "../database/index.ts";
import { service_post_user_msg } from "../service/index.ts";
import { verifySession, verifyUser } from "./middleware.ts";

const websocketPool = new Map<number, WSContext>()

export function add_router_user(app: Hono, upgradeWebSocket: UpgradeWebSocket) {
    // app.post('/user/chat', async (ctx) => {
    //     const data = <ChatRequest>await ctx.request.body.json()

    // });
    app.get('/user/conversations', verifySession, verifyUser, async (ctx) => {
        return ctx.json(await db_conversation_by_userid(ctx.get('user').id))
    });
    app.get('/user/websocket', verifySession, verifyUser, upgradeWebSocket((ctx) => {
        return {
            onOpen(evt, ws) {
                console.log('websocket open')
                websocketPool.set(ctx.get('user').id, ws)
            },
            onClose(evt, ws) {
                console.log('websocket close')
                websocketPool.delete(ctx.get('user').id)
            },
            onMessage(evt, ws) {
                console.log('websocket message', evt.data)
            },
            onError(evt, ws) {
                console.warn('websocket error', evt)
            }
        }
    }))
    app.get('/user/conversation/:id', verifySession, verifyUser, async (ctx) => {
        // return ctx.json(await db_conversation_by_id(Number(ctx.params.id))
        return ctx.json(await db_conversation_by_id(Number(ctx.req.param('id'))))
    });
    app.post('/user/conversation/:id', verifySession, verifyUser, async (ctx) => {
        const data = await ctx.req.json<ChatRequest>()
        service_post_user_msg(ctx.get('user').id, Number(ctx.req.param('id')), data.msg, websocketPool)
        return ctx.status(204)
    });
    app.delete('/user/conversation/:id', verifySession, verifyUser, async (ctx) => {
        await db_conversation_delete(Number(ctx.req.param('id')))
        return ctx.json(await db_conversation_by_userid(ctx.get('user').id))
    })
    app.post('/user/conversation', verifySession, verifyUser, async (ctx) => {
        const data = await ctx.req.json<ChatRequest>()
        const conversation = await db_conversation_create(ctx.get('user').id)
        service_post_user_msg(ctx.get('user').id, conversation.id, data.msg, websocketPool)
        return ctx.json(conversation)
    });
}