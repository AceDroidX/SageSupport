import type { Conversation, Message } from "./prisma"

export type WebSocketResponseEvent = {
    type: 'message'
    data: Message
} | {
    type: 'start'
    conversationId: number
} | {
    type: 'delta'
    conversationId: number
    content?: string
} | {
    type: 'end'
    conversationId: number
}

export type ConversationWithMessages = Conversation & {
    message: Message[]
}

export type ChatRequest = {
    msg: string
}

