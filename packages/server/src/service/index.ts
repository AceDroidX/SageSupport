import type { UserRole } from "../../generated/client";
import { db_document_list } from "../database";
import { db_create_session, db_register, db_userinfo_by_username } from "../database/auth";

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