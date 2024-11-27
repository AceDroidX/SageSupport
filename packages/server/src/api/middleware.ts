import { createMiddleware } from 'hono/factory'
import { type User } from "../../generated/client"
import { db_userinfo_by_session } from "../database/auth.ts"

export const verifySession = createMiddleware<{ Variables: { user: User } }>(async (ctx, next) => {
    const session = ctx.req.header('Cookie')?.match(/session=([^;]+)/)?.[1]
    if (!session) {
        return ctx.json({ code: 401, msg: '未登录' }, 401)
    }
    const dbResp = await db_userinfo_by_session(session)
    if (!dbResp) {
        return ctx.json({ code: 401, msg: '未登录' }, 401)
    }
    ctx.set('user', dbResp.user)
    return next()
})

export const verifyUser = createMiddleware<{ Variables: { user: User } }>(async (ctx, next) => {
    if (ctx.get('user').role != 'USER') {
        return ctx.json({ code: 401, msg: '权限不足' }, 401)
    }
    return next()
})

export const verifyAdmin = createMiddleware<{ Variables: { user: User } }>(async (ctx, next) => {
    if (ctx.get('user').role != 'ADMIN') {
        return ctx.json({ code: 401, msg: '权限不足' }, 401)
    }
    return next()
})