import { PrismaClient } from '../../generated/client/index.js'

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