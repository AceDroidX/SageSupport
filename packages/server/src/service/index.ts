import { AIMessage, HumanMessage, type BaseMessage } from "@langchain/core/messages";
import type { Context } from "hono";
import type { WSContext, WSEvents } from "hono/ws";
import type { WebSocketResponseEvent } from "sage-support-shared";
import { MessageType, type Conversation, type Message, type User, type UserRole } from "../../generated/client";
import { db_create_session, db_register, db_userinfo_by_username } from "../database/auth.ts";
import { db_conversation_by_id, db_conversation_set_supportuid, db_document_list, db_message_create, db_message_list, db_user_count_support_conversation } from "../database/index.ts";
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
    const support = await db_userinfo_by_username('support')
    if (!support) {
        await register('support', 'support', 'SUPPORT')
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

function message_db_to_llm(input: Message[]): BaseMessage[] {
    return input.map(item => {
        if (item.type == MessageType.AI) return new AIMessage(item.content)
        else if (item.type == MessageType.USER) return new HumanMessage(item.content)
        else {
            console.warn('unknown message type', item)
            return new HumanMessage(`[${item.type} Message]:${item.content}`)
        }
    })
}

export async function service_set_supportuid(conversationId: number): Promise<Conversation | undefined> {
    const result = await db_user_count_support_conversation()
    const minCount = Math.min(...result.map(item => item._count.SupportConversation));
    const minItems = result.filter(item => item._count.SupportConversation === minCount);
    const randomItem = minItems[Math.floor(Math.random() * minItems.length)];
    // console.log(result, minCount, minItems, randomItem)
    // if (!randomItem.id) {
    //     console.warn('no support user found')
    //     return undefined
    // }
    const conversation = await db_conversation_set_supportuid(conversationId, randomItem.id)
    const message = await db_message_create(conversationId, `已为您转接至人工客服:${randomItem.name}(UID:${randomItem.id})`, MessageType.SYSTEM)
    const userWS = userWebsocketPool.get(conversation.userId)
    if (userWS) {
        const data: WebSocketResponseEvent = { type: 'message', data: message }
        userWS.send(JSON.stringify(data))
    } else {
        console.warn('user not online', conversation.userId)
    }
    const supportWS = supportWebsocketPool.get(randomItem.id)
    if (supportWS) {
        const data: WebSocketResponseEvent = { type: 'new_conversation', data: conversation }
        supportWS.send(JSON.stringify(data))
    } else {
        console.warn('support not online', randomItem.id)
    }
    return conversation
}

export const userWebsocketPool = new Map<number, WSContext>()

export async function service_post_user_msg(uid: number, conversationId: number, msg: string) {
    const ws = userWebsocketPool.get(uid)
    if (!ws) {
        console.warn('user not online', uid)
        return
    }
    if (ws.readyState != WebSocket.OPEN) {
        console.warn('user websocket not open', uid)
        return
    }
    const conversation = await db_conversation_by_id(conversationId)
    if (conversation?.supportUserId) { // 如果是人工客服模式
        const message = await db_message_create(conversationId, msg, MessageType.USER, uid)
        const supportWS = supportWebsocketPool.get(conversation.supportUserId)
        if (!supportWS) {
            console.warn('support not online', conversation.supportUserId)
            return
        }
        const data: WebSocketResponseEvent = { type: 'message', data: message }
        supportWS.send(JSON.stringify(data))
        return
    }
    // 如果是AI模式
    const startData: WebSocketResponseEvent = { type: 'start', conversationId }
    ws.send(JSON.stringify(startData))
    let answer = ''
    for await (const chunk of await llm_streamInput(msg, await document_uuid_list(), message_db_to_llm(await db_message_list(conversationId)))) {
        if (chunk.answer) {
            answer += chunk.answer
            console.write(chunk.answer)
        }
        else console.debug(chunk)
        const data: WebSocketResponseEvent = { type: 'delta', conversationId, content: chunk.answer }
        ws.send(JSON.stringify(data))
    }
    // 在llm之后存储用户消息 防止llm_streamInput的输入消息和历史消息重复
    await db_message_create(conversationId, msg, MessageType.USER, uid)
    const db_msg = await db_message_create(conversationId, answer, MessageType.AI)
    const endData: WebSocketResponseEvent = { type: 'end', data: db_msg }
    ws.send(JSON.stringify(endData))
}

export const supportWebsocketPool = new Map<number, WSContext>()

export async function service_post_support_msg(uid: number, conversationId: number, msg: string) {
    const supportWS = supportWebsocketPool.get(uid)
    if (!supportWS) {
        console.warn('support not online', uid)
        return
    }
    if (supportWS.readyState != WebSocket.OPEN) {
        console.warn('support websocket not open', uid)
        return
    }
    const conversation = await db_conversation_by_id(conversationId)
    if (!conversation?.supportUserId) { // 如果是AI模式
        console.warn('not support for AI mode', conversation?.supportUserId)
        return
    }
    const message = await db_message_create(conversationId, msg, MessageType.SUPPORT, uid)
    const userWS = userWebsocketPool.get(conversation.userId)
    if (!userWS) {
        console.warn('user not online', conversation.userId)
        return
    }
    const data: WebSocketResponseEvent = { type: 'message', data: message }
    userWS.send(JSON.stringify(data))

    // const startData: WebSocketResponseEvent = { type: 'start', conversationId }
    // ws.send(JSON.stringify(startData))
    // let answer = ''
    // for await (const chunk of await llm_streamInput(msg, await document_uuid_list(), message_db_to_llm(await db_message_list(conversationId)))) {
    //     if (chunk.answer) {
    //         answer += chunk.answer
    //         console.write(chunk.answer)
    //     }
    //     else console.debug(chunk)
    //     const data: WebSocketResponseEvent = { type: 'delta', conversationId, content: chunk.answer }
    //     ws.send(JSON.stringify(data))
    // }
    // const db_msg = await db_message_create(conversationId, answer, MessageType.AI)
    // const endData: WebSocketResponseEvent = { type: 'end', data: db_msg }
    // ws.send(JSON.stringify(endData))
}

export function service_websocket<T extends { Variables: { user: User } }>(ctx: Context<T>, websocketPool: Map<number, WSContext>): WSEvents<T> {
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
}