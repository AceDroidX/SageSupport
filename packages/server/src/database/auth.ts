import type { UserRole } from "sage-support-shared/generated/client"
import { prisma } from "."

export async function db_user_auth_by_username(username: string) {
    const result = await prisma.user.findUnique({
        where: {
            name: username
        },
        include: {
            Auth: true
        }
    })

    return result
}

export async function setPasswd(username: string, passwd: string) {
    return await prisma.user.update({
        where: {
            name: username
        },
        data: {
            Auth: {
                update: {
                    passwd
                }
            }
        }
    })
}

export async function db_register(username: string, passwd: string, salt: string, role: UserRole = 'USER') {
    return await prisma.user.create({
        data: {
            name: username,
            role,
            Auth: {
                create: {
                    passwd,
                    salt,
                }
            }
        }
    })
}

export async function db_userinfo(id: number) {
    return await prisma.user.findUnique({
        where: {
            id
        },
    })
}

export async function db_userinfo_by_username(username: string) {
    return await prisma.user.findUnique({
        where: {
            name: username
        }
    })
}

export async function db_userinfo_by_session(token: string) {
    return await prisma.session.findUnique({
        where: {
            token
        },
        include: {
            user: true
        }
    })
}

export async function db_create_session(id: number) {
    return await prisma.session.create({
        data: {
            token: crypto.randomUUID(),
            expire: new Date(Date.now() + 1000 * 60 * 60 * 24),
            user: {
                connect: {
                    id
                }
            }
        }
    })
}