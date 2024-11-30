import type { Conversation, Message, User, UserRole } from "./prisma"

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

export const UserRoleName: { [key in UserRole]: string; } = {
    USER: '用户',
    SUPPORT: '人工客服',
    ADMIN: '管理员'
};