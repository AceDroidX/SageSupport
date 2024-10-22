import { llm_insertPDF, llm_streamInput } from "./llm";
import { document_uuid_list } from "./service";
import { readAllObjects, vdb_listAllCollections } from "./weaviate";

// await insertPDF("D:\\Github\\SageSupport\\text\\test1\\人工智能技术在供热企业客服管理领域的创新应用_刘丹.pdf")
// await invokeInput("总结这篇文章")

// console.log(JSON.stringify(await document_uuid_list(), null, 2))
// readAllObjects("Langchainjs_test")

// for await (const chunk of await llm_streamInput("总结这篇文章", await document_uuid_list())) {
//     console.log(chunk)
// }