import type { Message, UserRole } from "../generated/client"

export type Msg<T> = {
    code: number
    msg: string
    data: T
}

export type LoginRequest = {
    username: string
    password: string
}

export enum NatsCmd {
    Exit = "exit",
}

export enum NatsSubject {
    GraphragCmd = "graphrag.cmd",
    GraphragVisualize = "graphrag.visualize",
}

export type AdminUserAddRequest = {
    username: string;
    password: string;
    role: UserRole
}

export type AssistantRequest = {
    msg: string
    history: Message[]
    context: Message[]
}