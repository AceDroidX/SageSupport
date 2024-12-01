import type { ChatSSEResponse } from '@/model'
import { axiosInstance } from '@/utils'
import { EventStreamContentType, fetchEventSource } from '@microsoft/fetch-event-source'
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
  const assistantDict = ref(new Map<number, Message[]>())
  const assistantDeltaDict = ref(new Map<number, string>())

  async function switchConversation(id: number) {
    console.log('switch conversation', id)
    await fetchConversation(id)
    if (auth.data?.role == UserRole.SUPPORT && !assistantDict.value.has(id)) {
      await sendAssistant(id)
    }
  }

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

  function useAssistant(id: number): ComputedRef<Message[]> {
    const conversation = assistantDict.value.get(id) ?? []
    const delta = assistantDeltaDict.value.get(id)
    const deltaMessage = delta ? { messageId: 0, content: delta, type: MessageType.AI, createdAt: new Date(), conversationId: id, userId: null } : undefined
    return computed(() => {
      if (deltaMessage) return [...conversation, deltaMessage]
      else return conversation
    })
  }

  async function sendAssistant(conversationId: number, msg?: string) {
    if (!auth.data) {
      router.push('/login')
      return
    }
    console.log('sendAssistant', conversationId, msg)
    assistantDeltaDict.value.set(conversationId, '')
    await fetchEventSource(import.meta.env.VITE_API_BASE_URL + `/${auth.data.role.toLowerCase()}/assistant`, {
      method: 'POST', credentials: 'include', openWhenHidden: true, body: JSON.stringify({ msg: msg ?? '请根据如上对话辅助人工客服回答问题', history: assistantDict.value.get(conversationId) ?? [], context: conversationDict.value.get(conversationId) ?? [] }),
      async onopen(response) {
        console.log('chat open', response)
        if (response.ok && response.headers.get('content-type') === EventStreamContentType) {
          console.log('chat ok')
          return; // everything's good
        } else if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          // client-side errors are usually non-retriable:
          console.error(response);
        } else {
          console.error(response);
        }
      },
      onmessage(ev) {
        try {
          if (ev.event == 'delta' && ev.data != '') {
            const data = <ChatSSEResponse>JSON.parse(ev.data)
            if (data.answer) {
              const delta = assistantDeltaDict.value.get(conversationId)
              assistantDeltaDict.value.set(conversationId, (delta ?? '') + (data.answer ?? ''))
            }
            if (data.context) {
              console.log(data.context)
            }
          }
        } catch (error) {
          console.error(error, ev)
        }
      },
      onclose() {
        console.log('chat closed')
      },
      onerror(error) {
        console.error('chat error', error)
        // rethrow to stop the operation
        throw error
      }
    })
    console.log('chat done')
    if (msg) {
      assistantDict.value.set(conversationId, [...assistantDict.value.get(conversationId) ?? [], { messageId: 0, content: msg, type: MessageType.USER, createdAt: new Date(), conversationId: conversationId, userId: null }])
    }
    assistantDict.value.set(conversationId, [...assistantDict.value.get(conversationId) ?? [], { messageId: 0, content: assistantDeltaDict.value.get(conversationId) ?? '', type: MessageType.AI, createdAt: new Date(), conversationId: conversationId, userId: null }])
    assistantDeltaDict.value.delete(conversationId)
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
        if (data.type == MessageType.USER && auth.data?.role == UserRole.SUPPORT) {
          sendAssistant(data.conversationId)
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

  return { conversationList, switchConversation, useMessage, useConversation, fetchConversation, fetchConversationList, deleteConversation, newMessage, sendMessage, toSupport, useAssistant, sendAssistant }
})
