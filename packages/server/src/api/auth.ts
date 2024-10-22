import type { Router } from "@oak/oak";
import { db_create_session, db_user_auth_by_username, db_userinfo_by_username } from "../database/auth";
import type { LoginRequest } from "../model";
import { register } from "../service";

export function add_router_auth(router: Router) {
    router.post('/login', async (ctx) => {
        // ctx.router available
        const data = <LoginRequest>await ctx.request.body.json()
        const user = await db_user_auth_by_username(data.username)
        if (!user) {
            ctx.response.body = { code: 400, msg: '用户不存在' }
            return
        }
        if (!user.Auth?.passwd) {
            ctx.response.body = { code: 400, msg: '内部错误' }
            return
        }
        if (await Bun.password.verify(data.password + user.Auth.salt, user.Auth.passwd)) {
            const dbResp = await db_create_session(user.id)
            ctx.response.headers.set('Set-Cookie', `session=${dbResp.token}; Path=/; SameSite=Lax; Expires=${new Date(dbResp.expire).toUTCString()}`)
            ctx.response.body = { code: 0, msg: '登录成功', data: { id: user.id, name: user.name, role: user.role } }
        }
        else {
            ctx.response.body = { code: 400, msg: '密码错误' }
        }
    });

    router.post('/register', async (ctx) => {
        // ctx.router available
        const data = <LoginRequest>await ctx.request.body.json()
        if (!data.username || !data.password || data.username == '' || data.password == '') {
            ctx.response.body = { code: 400, msg: '用户名或密码不能为空' }
            return
        }
        const userinfo = await db_userinfo_by_username(data.username)
        if (userinfo) {
            ctx.response.body = { code: 400, msg: '用户已存在' }
            return
        }
        const dbResp = await register(data.username, data.password)
        ctx.response.headers.set('Set-Cookie', `session=${dbResp.token}; Path=/; SameSite=Lax; Expires=${new Date(dbResp.expire).toUTCString()}`)
        ctx.response.body = { code: 0, msg: '注册成功', data: dbResp.regInfo }
    });
}