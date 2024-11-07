import { Application, Router } from "@oak/oak";
import { add_router_admin } from "./admin";
import { add_router_auth } from "./auth";
import { add_router_debug } from "./debug";
import { add_router_user } from "./user";

export function init_api() {
    const app = new Application();
    const router = new Router();

    add_router(router)

    app.use((ctx, next) => {
        ctx.response.headers.set('Access-Control-Allow-Origin', ctx.request.headers.get('Origin') || '*')
        ctx.response.headers.set('Access-Control-Allow-Credentials', 'true')
        ctx.response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Origin, X-Requested-With, Accept')
        ctx.response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        return next()
    })

    app
        .use(router.routes())
        .use(router.allowedMethods())

    app.listen({ hostname: "0.0.0.0", port: 3000 });

    console.log("Listening on 0.0.0.0:3000")
}

function add_router(router: Router) {
    router.get('/', (ctx, next) => {
        // ctx.router available
        ctx.response.body = 'Hello World!';
    });

    // router.get('/visualize', async (ctx, next) => {
    //     ctx.response.body = await natsGraphragVisualize()
    // })

    add_router_auth(router)
    add_router_user(router)
    add_router_admin(router)
    add_router_debug(router)
}