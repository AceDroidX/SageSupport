import type { WSContext } from "hono/ws";
import type { WebSocketResponseEvent } from "sage-support-shared";
import { MessageType, type UserRole } from "../../generated/client";
import { db_create_session, db_register, db_userinfo_by_username } from "../database/auth.ts";
import { db_document_list, db_message_create } from "../database/index.ts";
import { llm_streamInput } from "../llm.ts";

export async function init_user() {
    const admin = await db_userinfo_by_username('admin')
    if (!admin) {
        await register('admin', 'admin', 'ADMIN')
    }
    const user = await db_userinfo_by_username('user')
    if (!user) {
        await register('user', 'user', 'USER')
    }
}

export async function register(username: string, password: string, role: UserRole = 'USER') {
    const salt = crypto.randomUUID();
    const regInfo = await db_register(username, await Bun.password.hash(password + salt), salt, role)
    const session = await db_create_session(regInfo.id)
    return { token: session.token, expire: session.expire, regInfo }
}

// export async function uploadDocument(files) {
//     const uuid = crypto.randomUUID()
// }

export async function document_uuid_list() {
    return (await db_document_list()).map(item => item.uuid)
}

export async function service_post_user_msg(uid: number, conversationId: number, msg: string, websocketPool: Map<number, WSContext>) {
    const ws = websocketPool.get(uid)
    if (!ws) {
        console.warn('websocket not found', uid)
        return
    }
    if (ws.readyState != WebSocket.OPEN) {
        console.warn('websocket not open', uid)
        return
    }
    await db_message_create(conversationId, msg, MessageType.USER)
    const startData: WebSocketResponseEvent = { type: 'start', conversationId }
    ws.send(JSON.stringify(startData))
    let answer = ''
    for await (const chunk of await llm_streamInput(msg, await document_uuid_list())) {
        if (chunk.answer) {
            answer += chunk.answer
            console.write(chunk.answer)
        }
        else console.debug(chunk)
        const data: WebSocketResponseEvent = { type: 'delta', conversationId, content: chunk.answer }
        ws.send(JSON.stringify(data))
    }
    const db_msg = await db_message_create(conversationId, answer, MessageType.AI)
    const endData: WebSocketResponseEvent = { type: 'end', conversationId }
    ws.send(JSON.stringify(endData))
    const msgData: WebSocketResponseEvent = { type: 'message', data: db_msg }
    ws.send(JSON.stringify(msgData))
}