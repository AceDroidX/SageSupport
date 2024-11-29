// 浏览器无法直接导入prisma的解决方案
export const MessageType = {
    USER: 'USER',
    SUPPORT: 'SUPPORT',
    AI: 'AI',
    SYSTEM: 'SYSTEM'
};
export type MessageType = (typeof MessageType)[keyof typeof MessageType]

export const UserRole = {
    USER: 'USER',
    SUPPORT: 'SUPPORT',
    ADMIN: 'ADMIN'
};
export type UserRole = (typeof UserRole)[keyof typeof UserRole]

export type Message = {
    messageId: number;
    content: string;
    type: MessageType;
    createdAt: Date;
    conversationId: number;
    userId: number | null;
}

export type Conversation = {
    id: number;
    title: string;
    userId: number;
    supportUserId: number | null;
}

export type User = {
    id: number;
    name: string;
    role: UserRole;
}