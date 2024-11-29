import { axiosInstance } from '@/utils'
import { defineStore } from 'pinia'
import type { ConversationWithMessages, WebSocketResponseEvent } from 'sage-support-shared'
import { MessageType, UserRole, type Conversation, type Message } from 'sage-support-shared/prisma'
import { computed, ref, watch, type ComputedRef } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from './auth'

export const useConversationStore = defineStore('conversation', () => {
  let ws: WebSocket | undefined
  const auth = useAuthStore()
  const router = useRouter()
  const conversationList = ref<Conversation[]>([])
  const conversationDict = ref(new Map<number, Message[]>())
  const deltaDict = ref(new Map<number, string>())

  function useMessage(id: number): ComputedRef<Message[]> {
    const conversation = conversationDict.value.get(id) ?? []
    const delta = deltaDict.value.get(id)
    const deltaMessage = delta ? { messageId: 0, content: delta, type: MessageType.AI, createdAt: new Date(), conversationId: id, userId: null } : undefined
    return computed(() => {
      if (deltaMessage) return [...conversation, deltaMessage]
      else return conversation
    })
  }

  function useConversation(id: number) {
    return computed(() => conversationList.value.find((c) => c.id === id))
  }

  async function fetchConversation(id: number) {
    if (!auth.data) {
      router.push('/login')
      return
    }
    const resp = await axiosInstance.get<ConversationWithMessages>(`/${auth.data.role.toLowerCase()}/conversation/${id}`)
    conversationDict.value.set(id, resp.data.message)
  }

  async function fetchConversationList() {
    if (!auth.data) {
      router.push('/login')
      return
    }
    const resp = await axiosInstance.get<Conversation[]>(`/${auth.data.role.toLowerCase()}/conversations`)
    conversationList.value = resp.data
  }

  async function newMessage(msg: string) {
    if (!auth.data) {
      router.push('/login')
      return
    }
    const resp = await axiosInstance.post<Conversation>(`/${auth.data.role.toLowerCase()}/conversation`, { msg })
    conversationList.value.splice(0, 0, resp.data)
    return resp
  }

  async function sendMessage(id: number, msg: string) {
    if (!auth.data) {
      router.push('/login')
      return
    }
    conversationDict.value.set(id, [...(conversationDict.value.get(id) ?? []), { messageId: 0, content: msg, type: auth.data.role, createdAt: new Date(), conversationId: id, userId: auth.data.id }])
    await axiosInstance.post(`/${auth.data.role.toLowerCase()}/conversation/${id}`, { msg })
  }

  async function deleteConversation(id: number) {
    if (!auth.data) {
      router.push('/login')
      return
    }
    const resp = await axiosInstance.delete<Conversation[]>(`/${auth.data.role.toLowerCase()}/conversation/${id}`)
    conversationList.value = resp.data
  }

  async function toSupport(id: number) {
    if (!auth.data) {
      router.push('/login')
      return
    }
    const resp = await axiosInstance.put<Conversation[]>(`/${auth.data.role.toLowerCase()}/conversation/${id}/support`)
    conversationList.value = resp.data
  }

  watch(() => auth.data?.role, () => {
    console.log('conversation store role changed', auth.data, ws)
    if (!auth.data) {
      if (ws?.readyState == WebSocket.OPEN) {
        ws.close()
        ws = undefined
      }
      return
    }
    if (auth.data.role == UserRole.ADMIN) {
      if (ws?.readyState == WebSocket.OPEN) {
        ws.close()
        ws = undefined
      }
      return
    }
    connect()
  }, { immediate: true })
  function connect() {
    console.log('conversation store connect')
    if (ws?.readyState == WebSocket.OPEN) {
      console.warn('conversation store already connect', auth.data, ws)
      return
    }
    if (!auth.data) {
      router.push('/login')
      return
    }
    ws = new WebSocket(import.meta.env.VITE_API_BASE_URL + `/${auth.data.role.toLowerCase()}/websocket`)
    ws.onmessage = (ev) => {
      console.log(ev)
      function addMessage(data: Message) {
        const original = conversationDict.value.get(data.conversationId)
        if (original) {
          conversationDict.value.set(data.conversationId, original.concat(data))
        } else {
          conversationDict.value.set(data.conversationId, [data])
        }
      }
      const data: WebSocketResponseEvent = JSON.parse(ev.data)
      if (data.type == 'message') {
        addMessage(data.data)
      } else if (data.type == 'start') {
        deltaDict.value.set(data.conversationId, '')
      } else if (data.type == 'delta') {
        const delta = deltaDict.value.get(data.conversationId)
        deltaDict.value.set(data.conversationId, (delta ?? '') + (data.content ?? ''))
      } else if (data.type == 'end') {
        deltaDict.value.delete(data.data.conversationId)
        addMessage(data.data)
      } else if (data.type == 'new_conversation') {
        conversationList.value.splice(0, 0, data.data)
      }
    }
    ws.onerror = (ev) => {
      console.error(ev)
      setTimeout(connect, 1000)
    }
    ws.onclose = (ev) => {
      console.log(ev)
    }
  }

  return { conversationList, useMessage, useConversation, fetchConversation, fetchConversationList, deleteConversation, newMessage, sendMessage, toSupport }
})
