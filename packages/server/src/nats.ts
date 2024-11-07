import { connect, JSONCodec } from "nats";
import { NatsSubject } from "./model";

// export const nc = await connect({ servers: "nats://localhost:4222" });

// export async function natsGraphragVisualize() {
//     const resp = await nc.request(NatsSubject.GraphragVisualize, undefined);

//     return JSONCodec<object>().decode(resp.data)
// }