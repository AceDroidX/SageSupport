import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { Document } from "@langchain/core/documents";
import type { BaseMessage } from "@langchain/core/messages";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { ChatOllama, OllamaEmbeddings } from "@langchain/ollama";
import { ChatOpenAI } from "@langchain/openai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { WeaviateStore } from "@langchain/weaviate";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { createHistoryAwareRetriever } from "langchain/chains/history_aware_retriever";
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

const OPENAI_MODEL = import.meta.env["OPENAI_MODEL"]
const llm = OPENAI_MODEL ? new ChatOpenAI({
    model: OPENAI_MODEL,
}) : new ChatOllama({ model: 'qwen2.5:7b' })

// Contextualize question
const contextualizeQSystemPrompt =
    "Given a chat history and the latest user question " +
    "which might reference context in the chat history, " +
    "formulate a standalone question which can be understood " +
    "without the chat history. Do NOT answer the question, " +
    "just reformulate it if needed and otherwise return it as is.";

const contextualizeQPrompt = ChatPromptTemplate.fromMessages([
    ["system", contextualizeQSystemPrompt],
    new MessagesPlaceholder("chat_history"),
    ["human", "{input}"],
]);

// Answer question
const systemTemplate = [
    `You are an assistant for question-answering tasks. Use the following pieces of retrieved context to answer the question. If you don't know the answer, just say that you don't know. Use three sentences maximum and keep the answer concise.`,
    `\n\n`,
    `Context:\n`,
    `{context}`,
].join("");
const prompt = ChatPromptTemplate.fromMessages([
    ["system", systemTemplate],
    new MessagesPlaceholder("chat_history"),
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
    const historyAwareRetriever = await createHistoryAwareRetriever({
        llm,
        retriever: retriever(),
        rephrasePrompt: contextualizeQPrompt,
    });
    return await createRetrievalChain({
        retriever: historyAwareRetriever,
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
    const graph = await llm_graph(docs);
    const textSplitsId = await insertDocument(docs, documentUuid)
    return { textSplitsId, graph }
}

async function insertDocument(docs: Document<Record<string, any>>[], documentUuid: string) {
    const splits = (await textSplitter.splitDocuments(docs)).map((item) => {
        if (item.metadata["pdf"]) {
            // console.debug('delete pdf metadata', item.metadata["pdf"])
            delete item.metadata["pdf"]
        }
        return item
    });
    console.log(splits);
    return await getVectorStore(documentUuid).addDocuments(splits);
}

export async function llm_streamInput(input: string, documentUuids: string[], chat_history?: BaseMessage[]) {
    const results = await (await getRagChain(documentUuids)).stream({
        input,
        chat_history,
    }, { callbacks: [langfuseHandler] });
    return results
}

/**
 * 参考
 * https://github.com/langchain-ai/langchainjs/blob/main/libs/langchain-community/src/experimental/graph_transformers/llm.ts
 */
// const GRAPH_SYSTEM_PROMPT = `
// # Knowledge Graph Instructions for GPT-4\n
// ## 1. Overview\n
// You are a top-tier algorithm designed for extracting nodes and edges in structured formats to build a knowledge graph.\n
// Do not add any information that is not explicitly mentioned in the text\n"
// - **Nodes** represent entities and concepts.\n"
// - **Edges** represent relationships between nodes.\n"
// - The aim is to achieve simplicity and clarity in the knowledge graph, making it accessible for a vast audience.\n
// ## 2. Coreference Resolution\n
// - **Maintain Entity Consistency**: When extracting entities, it's vital to ensure consistency.\n
// If an entity, such as "John Doe", is mentioned multiple times in the text but is referred to by different names or pronouns (e.g., "Joe", "he"), always use the most complete identifier for that entity throughout the knowledge graph. In this example, use "John Doe" as the entity ID.\n
// Remember, the knowledge graph should be coherent and easily understandable, so maintaining consistency in entity references is crucial.\n
// ## 3. Output Format\n
// Output as only one mermaid diagram. Be careful with Unicode text.\n
// ## 4. Strict Compliance\n
// Adhere to the rules strictly. Non-compliance will result in termination.
// `;
const GRAPH_SYSTEM_PROMPT = `
# Knowledge Graph Instructions for Qwen\n
## 1. Overview\n
You are a top-tier algorithm designed for extracting outline in structured formats to build a knowledge graph.\n
Do not add any information that is not explicitly mentioned in the text\n"
- The aim is to achieve simplicity and clarity in the knowledge graph, making it accessible for a vast audience.\n
## 2. Output Format\n
Output as only one mermaid diagram. Be careful with Unicode text.\n
## 3. Strict Compliance\n
Adhere to the rules strictly. Non-compliance will result in termination.
`;

const GRAPH_FIRST_PROMPT = ChatPromptTemplate.fromMessages([
    ["system", GRAPH_SYSTEM_PROMPT],
    [
        "human",
        "Tip: Make sure to answer in the correct format and do not include any explanations. Use the given format to extract information from the following input: {input}",
    ],
]);

const GRAPH_ADD_PROMPT = ChatPromptTemplate.fromMessages([
    ["system", GRAPH_SYSTEM_PROMPT],
    [
        "human",
        `Tip: Make sure to answer in the correct format and do not include any explanations. Use the given format to extract information from the following input and combine to the existing knowledge graph.\n
        existing knowledge graph:\n
        {existing_knowledge_graph}\n
        input:\n
        {input}
        `,
    ],
]);

export async function llm_graph(docs: Document<Record<string, any>>[]) {
    let existing_knowledge_graph = "";
    for (const [index, item] of docs.entries()) {
        const resp = index == 0 ? await GRAPH_FIRST_PROMPT.pipe(llm).invoke({ input: item.pageContent }, { callbacks: [langfuseHandler] }) : await GRAPH_ADD_PROMPT.pipe(llm).invoke({ input: item.pageContent, existing_knowledge_graph }, { callbacks: [langfuseHandler] })
        existing_knowledge_graph = resp.content.toString();
        // console.log(resp)
        console.log(resp.content)
        console.log(index)
    }
    // 使用正则表达式匹配 mermaid 代码块的内容
    const regex = /```mermaid\n([\s\S]*?)\n```/; // 匹配 ```mermaid ... ```
    const match = existing_knowledge_graph.match(regex);

    if (match && match[1]) {
        const mermaidContent = match[1].trim(); // 去除可能存在的首尾空白字符
        console.log(mermaidContent);
        return mermaidContent;
    } else {
        console.warn('没有找到 mermaid 代码块');
        return existing_knowledge_graph;
    }
}