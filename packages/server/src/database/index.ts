import { MessageType, PrismaClient } from "../../generated/client"

export const prisma = new PrismaClient()

export async function db_document_create(uuid: string, name: string, textSplitsId: string[], graph: string) {
    return await prisma.document.create({
        data: {
            uuid,
            name,
            textSplitsId,
            graph,
        }
    })
}

export async function db_document_delete(uuid: string) {
    return await prisma.document.delete({
        where: {
            uuid
        }
    })
}

export async function db_document_update(uuid: string, name: string) {
    return await prisma.document.update({
        where: {
            uuid
        },
        data: {
            name
        }
    })
}

export async function db_document_by_uuid(uuid: string) {
    return await prisma.document.findUnique({
        where: {
            uuid
        }
    })
}

export async function db_document_list() {
    return await prisma.document.findMany()
}

export async function db_conversation_create(userId: number) {
    return await prisma.conversation.create({
        data: {
            // 默认对话标题为当前时间
            title: new Date().toString(),
            userId,
        }
    })
}

export async function db_conversation_by_userid(userId: number) {
    return await prisma.conversation.findMany({
        where: {
            userId
        },
        orderBy: {
            id: "desc"
        }
    })
}

export async function db_conversation_by_id(id: number) {
    return await prisma.conversation.findUnique({
        where: {
            id
        },
        include: {
            message: true
        }
    })
}

export async function db_conversation_delete(id: number) {
    return await prisma.conversation.delete({
        where: {
            id
        }
    })
}

export async function db_message_create(conversationId: number, content: string, type: MessageType) {
    return await prisma.message.create({
        data: {
            conversationId,
            content,
            type,
        }
    })
}