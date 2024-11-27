import { Hono } from "hono";
import { db_create_session, db_user_auth_by_username, db_userinfo_by_username } from "../database/auth";
import type { LoginRequest } from "../model";
import { register } from "../service";

export function add_router_auth(app: Hono) {
    app.post('/login', async (ctx) => {
        // ctx.router available
        const data = await ctx.req.json<LoginRequest>()
        const user = await db_user_auth_by_username(data.username)
        if (!user) {
            return ctx.json({ code: 400, msg: '用户不存在' })
        }
        if (!user.Auth?.passwd) {
            return ctx.json({ code: 400, msg: '内部错误' })
        }
        if (await Bun.password.verify(data.password + user.Auth.salt, user.Auth.passwd)) {
            const dbResp = await db_create_session(user.id)
            ctx.res.headers.set('Set-Cookie', `session=${dbResp.token}; Path=/; SameSite=Lax; Expires=${new Date(dbResp.expire).toUTCString()}`)
            return ctx.json({ code: 0, msg: '登录成功', data: { id: user.id, name: user.name, role: user.role } })
        }
        else {
            return ctx.json({ code: 400, msg: '密码错误' })
        }
    });

    app.post('/register', async (ctx) => {
        // ctx.router available
        const data = await ctx.req.json<LoginRequest>()
        if (!data.username || !data.password || data.username == '' || data.password == '') {
            return ctx.json({ code: 400, msg: '用户名或密码不能为空' })
        }
        const userinfo = await db_userinfo_by_username(data.username)
        if (userinfo) {
            return ctx.json({ code: 400, msg: '用户已存在' })
        }
        const dbResp = await register(data.username, data.password)
        ctx.res.headers.set('Set-Cookie', `session=${dbResp.token}; Path=/; SameSite=Lax; Expires=${new Date(dbResp.expire).toUTCString()}`)
        return ctx.json({ code: 0, msg: '注册成功', data: dbResp.regInfo })
    });
}