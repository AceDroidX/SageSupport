import type { Context } from "sage-support-shared";

// export type ChatSSEResponse = { input: string } | { chat_history: string } | { context: string } | { answer: string }
export type ChatSSEResponse = {
    input?: string
    chat_history?: string
    context?: Context[]
    answer?: string
}