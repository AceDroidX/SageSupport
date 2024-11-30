import { Hono } from "hono";
import { db_document_create, db_document_delete, db_document_list, db_user_list } from "../database";
import { llm_insertPDF } from "../llm";
import type { AdminUserAddRequest } from "../model";
import { register } from "../service";
import { generateAlphabetUUID } from "../utils";
import { vdb_deleteCollection } from "../weaviate";
import { verifyAdmin, verifySession } from "./middleware";

export function add_router_admin(app: Hono) {
    app.get('/admin/documents', verifySession, verifyAdmin, async (ctx) => {
        return ctx.json(await db_document_list())
    });
    app.post('/admin/documents', verifySession, verifyAdmin, async (ctx) => {
        const data = (await ctx.req.formData()).getAll('documents[]')
        console.debug('收到文件')
        console.debug(data)
        try {
            // type FormDataEntryValue = File | string;
            const files = data.filter(item => typeof item != 'string')
            if (files.length == 0) {
                return ctx.json({ code: 1, msg: '文件为空' }, 400)
            }
            // TODO: 添加多文件支持
            const uuid = generateAlphabetUUID()
            let textSplitsId: string[] = []
            let graph = ''
            try {
                ({ textSplitsId, graph } = await llm_insertPDF(files[0], uuid));
            } catch (e) {
                console.error(e)
                return ctx.json({ code: 1, msg: '上传失败 Langchain错误:' + JSON.stringify(e) }, 400)
            }
            if (textSplitsId.length == 0) {
                return ctx.json({ code: 1, msg: '上传失败 textSplitsId.length == 0' }, 400)
            }
            const name = files[0].name
            try {
                await db_document_create(uuid, name, textSplitsId, graph)
            } catch (e) {
                console.error(e)
                try {
                    await vdb_deleteCollection(uuid)
                } catch (err) {
                    console.error(err)
                    return ctx.json({ code: 1, msg: '上传失败 数据库错误 + vdb_deleteCollection错误:' + JSON.stringify(e) + '\n' + JSON.stringify(err) }, 400)
                }
                return ctx.json({ code: 1, msg: '上传失败 数据库错误:' + JSON.stringify(e) }, 400)
            }
            return ctx.json({ code: 0, msg: '上传成功', data: { uuid, name, textSplitsId } })
        } catch (e) {
            console.error(e)
            return ctx.json({ code: 1, msg: '未知错误' }, 400)
        }
    });
    app.delete('/admin/documents/:uuid', verifySession, verifyAdmin, async (ctx) => {
        try {
            await vdb_deleteCollection(ctx.req.param('uuid'))
            await db_document_delete(ctx.req.param('uuid'))
            return ctx.json({ code: 0, msg: '删除成功' })
        } catch (e) {
            console.error(e)
            return ctx.json({ code: 1, msg: JSON.stringify(e) }, 400)
        }
    })
    app.get('/admin/users', verifySession, verifyAdmin, async (ctx) => {
        return ctx.json(await db_user_list())
    })
    app.post('/admin/users', verifySession, verifyAdmin, async (ctx) => {
        const data = await ctx.req.json<AdminUserAddRequest>()
        await register(data.username, data.password, data.role)
        return ctx.json(await db_user_list())
    })
    // app.post('/admin/chat', verifySession, verifyAdmin, async (ctx) => {
    //     const data = await ctx.req.json<ChatRequest>()
    //     // https://oakserver.github.io/oak/sse.html
    //     const target = await ctx.sendEvents({ keepAlive: 5000 })
    //     for await (const chunk of await llm_streamInput(data.msg, await document_uuid_list())) {
    //         if (chunk.answer) console.write(chunk.answer)
    //         else console.debug(chunk)
    //         target.dispatchEvent(new ServerSentEvent("delta", { data: chunk }))
    //     }
    //     await target.close()
    //     console.debug('chat发送完成')
    // });
}