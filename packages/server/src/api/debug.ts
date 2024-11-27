import { Hono } from "hono";
import { vdb_deleteCollection, vdb_listAllCollections } from "../weaviate";
import { verifyAdmin, verifySession } from "./middleware";

export function add_router_debug(app: Hono) {
    app.get('/debug/weaviate/collections', verifySession, verifyAdmin, async (ctx) => {
        return ctx.json((await vdb_listAllCollections()).map(item => item.name))
    });
    app.delete('/debug/weaviate/collections/:name', verifySession, verifyAdmin, async (ctx) => {
        await vdb_deleteCollection(ctx.req.param('name'))
        return ctx.json({ code: 0, msg: '删除成功' })
    });
}