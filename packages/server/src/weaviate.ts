import weaviate from 'weaviate-client';

const client = await weaviate.connectToLocal(
    {
        host: "127.0.0.1",   // URL only, no http prefix
        port: 8080,
        grpcPort: 50051,     // Default is 50051, WCD uses 443
    })

export async function vdb_listAllCollections() {
    return await client.collections.listAll()
}

export async function vdb_deleteCollection(name: string) {
    return await client.collections.delete(name)
}

export async function readAllObjects(collectionName: string) {
    const myCollection = client.collections.get(collectionName);
    let results: { uuid: string, properties: any }[] = [];
    for await (let item of myCollection.iterator()) {
        // console.log(item.uuid, item.properties);
        results.push({
            uuid: item.uuid,
            properties: item.properties
        })
    }
    return results
}