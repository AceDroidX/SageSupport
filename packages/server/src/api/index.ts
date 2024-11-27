import type { ServerWebSocket } from "bun";
import { Hono } from "hono";
import { createBunWebSocket } from "hono/bun";
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { add_router_admin } from "./admin";
import { add_router_auth } from "./auth";
import { add_router_debug } from "./debug";
import { add_router_user } from "./user";

const { upgradeWebSocket, websocket } = createBunWebSocket<ServerWebSocket>()

export function init_api() {
    const app = new Hono();
    app.use(logger())
    app.use('*', cors({
        origin: (origin) => origin,
        credentials: true
    }))

    add_router(app)

    // app.use((ctx, next) => {
    //     ctx.response.headers.set('Access-Control-Allow-Origin', ctx.request.headers.get('Origin') || '*')
    //     ctx.response.headers.set('Access-Control-Allow-Credentials', 'true')
    //     ctx.response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Origin, X-Requested-With, Accept')
    //     ctx.response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    //     return next()
    // })

    // app
    //     .use(app.routes())
    //     .use(app.allowedMethods())

    // app.listen({ hostname: "0.0.0.0", port: 3000 });

    return {
        port: 3000,
        fetch: app.fetch,
        websocket,
    }
}

function add_router(app: Hono) {
    app.get('/', (c) => {
        // ctx.router available
        return c.text('Hello World!');
    });

    // app.get('/visualize', async (ctx, next) => {
    //     return ctx.json(await natsGraphragVisualize()
    // })

    add_router_auth(app)
    add_router_user(app, upgradeWebSocket)
    add_router_admin(app)
    add_router_debug(app)
}