import type { Hono } from "hono";
import { streamSSE } from 'hono/streaming';
import type { UpgradeWebSocket } from "hono/ws";
import type { ChatRequest } from "sage-support-shared";
import { db_conversation_by_supportuid, db_conversation_with_msg_by_id, db_document_by_textSplitsId } from "../database";
import type { AssistantRequest } from "../model";
import { service_post_assistant_msg, service_post_support_msg, service_websocket, supportWebsocketPool } from "../service";
import { verifySession, verifySupport } from "./middleware";

export function add_router_support(app: Hono, upgradeWebSocket: UpgradeWebSocket) {
    app.get('/support/websocket', verifySession, verifySupport, upgradeWebSocket((ctx) => {
        return service_websocket(ctx, supportWebsocketPool)
    }))
    app.get('/support/conversations', verifySession, verifySupport, async (ctx) => {
        return ctx.json(await db_conversation_by_supportuid(ctx.get('user').id))
    });
    app.get('/support/conversation/:id', verifySession, verifySupport, async (ctx) => {
        // return ctx.json(await db_conversation_by_id(Number(ctx.params.id))
        return ctx.json(await db_conversation_with_msg_by_id(Number(ctx.req.param('id'))))
    });
    app.post('/support/conversation/:id', verifySession, verifySupport, async (ctx) => {
        const data = await ctx.req.json<ChatRequest>()
        service_post_support_msg(ctx.get('user').id, Number(ctx.req.param('id')), data.msg)
        return ctx.body(null, 204)
    });
    app.post('/support/assistant', verifySession, verifySupport, async (ctx) => {
        const data = await ctx.req.json<AssistantRequest>()
        return streamSSE(ctx, async (stream) => {
            await service_post_assistant_msg(stream, data)
        })
    });
    app.get('/support/documents/name', verifySession, verifySupport, async (ctx) => {
        const ids = ctx.req.queries('id[]')
        if (ids) return ctx.json(await Promise.all(ids.map(async id => ({ id, name: (await db_document_by_textSplitsId(id))?.name }))))
    });
}