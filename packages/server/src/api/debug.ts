import type { Router } from "@oak/oak";
import { vdb_deleteCollection, vdb_listAllCollections } from "../weaviate";
import { verifyAdmin, verifySession } from "./middleware";

export function add_router_debug(router: Router) {
    router.get('/debug/weaviate/collections', verifySession, verifyAdmin, async (ctx) => {
        ctx.response.body = (await vdb_listAllCollections()).map(item => item.name)
    });
    router.delete('/debug/weaviate/collections/:name', verifySession, verifyAdmin, async (ctx) => {
        await vdb_deleteCollection(ctx.params.name)
        ctx.response.body = { code: 0, msg: '删除成功' }
    });
}