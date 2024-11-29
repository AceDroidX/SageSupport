import type { Conversation, Message, User } from "./prisma"

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
    data: Message
} | {
    type: 'new_conversation'
    data: Conversation
}

export type ConversationWithMessages = Conversation & {
    message: Message[]
}

export type ChatRequest = {
    msg: string
}

export type Msg<T> = {
    code: number;
    msg: string;
    data?: T
}

export type LoginResponse = Msg<User>
export type LogoutResponse = Msg<undefined>