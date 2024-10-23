import { ServerSentEvent, type Router } from "@oak/oak";
import { db_document_create, db_document_delete, db_document_list } from "../database";
import { llm_insertPDF, llm_streamInput } from "../llm";
import type { ChatRequest } from "../model";
import { document_uuid_list } from "../service";
import { generateAlphabetUUID } from "../utils";
import { vdb_deleteCollection } from "../weaviate";
import { verifyAdmin, verifySession } from "./middleware";

export function add_router_admin(router: Router) {
    router.get('/admin/documents', verifySession, verifyAdmin, async (ctx) => {
        ctx.response.body = await db_document_list()
    });
    router.post('/admin/documents', verifySession, verifyAdmin, async (ctx) => {
        const data = (await ctx.request.body.formData()).getAll('documents[]')
        console.debug('收到文件')
        console.debug(data)
        try {
            // type FormDataEntryValue = File | string;
            const files = data.filter(item => typeof item != 'string')
            if (files.length == 0) {
                ctx.response.status = 400
                ctx.response.body = { code: 1, msg: '文件为空' }
                return
            }
            // TODO: 添加多文件支持
            const uuid = generateAlphabetUUID()
            let textSplitsId: string[] = []
            let graph = ''
            try {
                ({ textSplitsId, graph } = await llm_insertPDF(files[0], uuid));
            } catch (e) {
                console.error(e)
                ctx.response.status = 400
                ctx.response.body = { code: 1, msg: '上传失败 Langchain错误:' + JSON.stringify(e) }
                return
            }
            if (textSplitsId.length == 0) {
                ctx.response.status = 400
                ctx.response.body = { code: 1, msg: '上传失败 textSplitsId.length == 0' }
                return
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
                    ctx.response.status = 400
                    ctx.response.body = { code: 1, msg: '上传失败 数据库错误 + vdb_deleteCollection错误:' + JSON.stringify(e) + '\n' + JSON.stringify(err) }
                    return
                }
                ctx.response.status = 400
                ctx.response.body = { code: 1, msg: '上传失败 数据库错误:' + JSON.stringify(e) }
                return
            }
            ctx.response.body = { code: 0, msg: '上传成功', data: { uuid, name, textSplitsId } }
        } catch (e) {
            console.error(e)
            ctx.response.status = 400
            ctx.response.body = { code: 1, msg: '未知错误' }
        }
    });
    router.delete('/admin/documents/:uuid', verifySession, verifyAdmin, async (ctx) => {
        try {
            await vdb_deleteCollection(ctx.params.uuid)
            await db_document_delete(ctx.params.uuid)
            ctx.response.body = { code: 0, msg: '删除成功' }
        } catch (e) {
            console.error(e)
            ctx.response.status = 400
            ctx.response.body = { code: 1, msg: JSON.stringify(e) }
        }
    })
    router.post('/admin/chat', verifySession, verifyAdmin, async (ctx) => {
        const data = <ChatRequest>await ctx.request.body.json()
        // https://oakserver.github.io/oak/sse.html
        const target = await ctx.sendEvents({ keepAlive: 5000 })
        for await (const chunk of await llm_streamInput(data.msg, await document_uuid_list())) {
            if (chunk.answer) console.write(chunk.answer)
            else console.debug(chunk)
            target.dispatchEvent(new ServerSentEvent("delta", { data: chunk }))
        }
        await target.close()
        console.debug('chat发送完成')
    });
}