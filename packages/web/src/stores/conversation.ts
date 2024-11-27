import { axiosInstance } from '@/utils'
import { defineStore } from 'pinia'
import type { ConversationWithMessages, WebSocketResponseEvent } from 'sage-support-shared'
import { type Conversation, type Message, MessageType } from 'sage-support-shared/prisma'
import { computed, onMounted, onUnmounted, ref } from 'vue'

export const useConversationStore = defineStore('conversation', () => {
  let ws: WebSocket | undefined
  const conversationList = ref<Conversation[]>([])
  const conversationDict = ref(new Map<number, Message[]>())
  const deltaDict = ref(new Map<number, string>())

  function useMessage(id: number) {
    const conversation = conversationDict.value.get(id) ?? []
    const delta = deltaDict.value.get(id)
    const deltaMessage = delta ? { messageId: 0, content: delta, type: MessageType.AI, createdAt: new Date(), conversationId: id, } : undefined
    return computed(() => {
      if (deltaMessage) return [...conversation, deltaMessage]
      else return conversation
    })
  }

  async function fetchConversation(id: number) {
    const resp = await axiosInstance.get<ConversationWithMessages>('/user/conversation/' + id)
    conversationDict.value.set(id, resp.data.message)
  }

  async function fetchConversationList() {
    const resp = await axiosInstance.get<Conversation[]>('/user/conversations')
    conversationList.value = resp.data
  }

  async function newMessage(msg: string) {
    const resp = await axiosInstance.post<Conversation>('/user/conversation', { msg })
    conversationList.value.splice(0, 0, resp.data)
    return resp
  }

  async function sendMessage(id: number, msg: string) {
    await axiosInstance.post('/user/conversation/' + id, { msg })
  }

  onMounted(() => {
    const ws = new WebSocket(import.meta.env.VITE_API_BASE_URL + '/user/websocket')
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
      }
    }
  })
  onUnmounted(() => {
    ws?.close()
  })

  return { conversationList, useMessage, fetchConversation, fetchConversationList, newMessage, sendMessage }
})
