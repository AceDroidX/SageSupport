export type Documents = {
    name: string;
    uuid: string;
    textSplitsId: string[];
    graph: string;
}

// export type ChatSSEResponse = { input: string } | { chat_history: string } | { context: string } | { answer: string }
export type ChatSSEResponse = {
    input?: string
    chat_history?: string
    context?: string
    answer?: string
}