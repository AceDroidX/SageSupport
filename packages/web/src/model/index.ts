export type Documents = {
    name: string;
    uuid: string;
    textSplitsId: string[];
}

// export type ChatSSEResponse = { input: string } | { chat_history: string } | { context: string } | { answer: string }
export type ChatSSEResponse = {
    input?: string
    chat_history?: string
    context?: string
    answer?: string
}