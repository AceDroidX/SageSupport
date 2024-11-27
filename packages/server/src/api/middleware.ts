import type { Context, Next } from "@oak/oak"
import { type User, UserRole } from "sage-support-shared/generated/client"
import { db_userinfo_by_session } from "../database/auth.ts"

export async function verifySession(ctx: Context<{ user: User }>, next: Next) {
    const session = ctx.request.headers.get('Cookie')?.match(/session=([^;]+)/)?.[1]
    if (!session) {
        ctx.response.status = 401
        ctx.response.body = { code: 401, msg: '未登录' }
        return
    }
    const dbResp = await db_userinfo_by_session(session)
    if (!dbResp) {
        ctx.response.status = 401
        ctx.response.body = { code: 401, msg: '未登录' }
        return
    }
    ctx.state.user = dbResp.user
    return next()
}

export async function verifyAdmin(ctx: Context<{ user: User }>, next: Next) {
    if (ctx.state.user.role != 'ADMIN') {
        ctx.response.status = 401
        ctx.response.body = { code: 401, msg: '权限不足' }
        return
    }
    return next()
}