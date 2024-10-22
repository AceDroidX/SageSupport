import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { Document } from "@langchain/core/documents";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOllama, OllamaEmbeddings } from "@langchain/ollama";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { WeaviateStore } from "@langchain/weaviate";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { createRetrievalChain } from "langchain/chains/retrieval";
import { EnsembleRetriever } from "langchain/retrievers/ensemble";
import { CallbackHandler } from "langfuse-langchain";
import weaviate from "weaviate-ts-client";

/**
 * Shared Variable
 */

// Initialize Langfuse callback handler
const langfuseHandler = new CallbackHandler({
    publicKey: import.meta.env["LANGFUSE_PUBLIC_KEY"],
    secretKey: import.meta.env["LANGFUSE_SECRET_KEY"],
    baseUrl: "https://cloud.langfuse.com"
});
export const weaviateClient = weaviate.client({
    scheme: "http",
    host: "localhost:8080",
    // If necessary
    // apiKey: new ApiKey(process.env.WEAVIATE_API_KEY ?? "default"),
});
function getVectorStore(indexName: string) {
    return new WeaviateStore(new OllamaEmbeddings({ model: 'viosay/conan-embedding-v1:q8_0' }), {
        client: weaviateClient,
        // Must start with a capital letter
        indexName,
        // Default value
        textKey: "text",
        // Any keys you intend to set as metadata
        metadataKeys: ["source", "loc_lines_from", "loc_lines_to", "loc_pageNumber"],
    });
}

/**
 * Input Variable
 */

const textSplitter = new RecursiveCharacterTextSplitter({
    separators: ["\n\n", "\n", "。"],
    keepSeparator: false,
    chunkSize: 490,
    chunkOverlap: 0,
});
// const textSplitter = new ChineseRecursiveTextSplitter();
// const textSplitter = new TokenTextSplitter({
//     keepSeparator: false, chunkSize: 490, chunkOverlap: 0
// });

/**
 * Output Variable
 */

const llm = new ChatOllama({ model: 'qwen2.5:7b' })
const systemTemplate = [
    `You are an assistant for question-answering tasks. Use the following pieces of retrieved context to answer the question. If you don't know the answer, just say that you don't know. Use three sentences maximum and keep the answer concise.`,
    `\n\n`,
    `Context:\n`,
    `{context}`,
].join("");
const prompt = ChatPromptTemplate.fromMessages([
    ["system", systemTemplate],
    ["human", "{input}"],
]);
const questionAnswerChain = await createStuffDocumentsChain({ llm, prompt });
async function getRagChain(indexNames: string[]) {
    const retriever = () => {
        if (indexNames.length === 1) {
            return getVectorStore(indexNames[0]).asRetriever({ k: 5 });
        }
        return new EnsembleRetriever({
            retrievers: indexNames.map((indexName) => getVectorStore(indexName).asRetriever({ k: 5 })),
            weights: Array(indexNames.length).fill(1 / indexNames.length),
        })
    }
    return await createRetrievalChain({
        retriever: retriever(),
        combineDocsChain: questionAnswerChain,
    });
}

/**
 * Function
 */

export async function llm_insertPDF(filePathOrBlob: string | Blob, documentUuid: string) {
    const loader = new PDFLoader(filePathOrBlob);
    const docs = await loader.load();
    console.log(docs.length);
    return await insertDocument(docs, documentUuid);
}

async function insertDocument(docs: Document<Record<string, any>>[], documentUuid: string) {
    const splits = (await textSplitter.splitDocuments(docs)).map((item) => {
        if (item.metadata["pdf"]) {
            console.debug('delete pdf metadata', item.metadata["pdf"])
            delete item.metadata["pdf"]
        }
        return item
    });
    console.log(splits);
    return await getVectorStore(documentUuid).addDocuments(splits);
}

export async function llm_streamInput(input: string, documentUuids: string[]) {
    const results = await (await getRagChain(documentUuids)).stream({
        input,
    }, { callbacks: [langfuseHandler] });
    return results
}