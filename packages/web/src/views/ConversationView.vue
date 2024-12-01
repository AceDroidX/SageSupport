<script setup lang="ts">
import ChatList from "@/components/ChatList.vue";
import { useAuthStore } from "@/stores/auth";
import { useConversationStore } from "@/stores/conversation";
import { nextTick, ref, watch } from "vue";

const props = defineProps<{ id: string }>();

const conversation = useConversationStore();
const auth = useAuthStore();

const message = ref("");
const assistantMessage = ref("");

watch(
  () => props.id,
  async () => {
    await nextTick();
    await conversation.switchConversation(Number(props.id));
  },
  { immediate: true },
);
</script>

<template>
  <div class="flex h-full w-full">
    <div class="flex h-full w-full flex-col items-center justify-center">
      <ChatList
        :data="conversation.useMessage(Number(id)).value"
        :role="auth.data?.role ?? 'USER'"
      />
      <div class="flex w-full justify-center gap-2 p-4">
        <input
          v-model="message"
          @keyup.enter="conversation.sendMessage(Number(id), message)"
          type="text"
          placeholder="输入您的问题"
          class="input input-bordered w-2/3 bg-base-200"
        />
        <button
          @click="
            conversation.sendMessage(Number(id), message);
            message = '';
          "
          class="btn btn-primary"
        >
          发送
        </button>
        <button
          v-if="
            auth.data?.role == 'USER' &&
            !conversation.useConversation(Number(id)).value?.supportUserId
          "
          @click="conversation.toSupport(Number(id))"
          class="btn btn-primary"
        >
          转人工
        </button>
      </div>
    </div>
    <div
      v-if="auth.data?.role == 'SUPPORT'"
      class="divider divider-horizontal"
    ></div>
    <div
      v-if="auth.data?.role == 'SUPPORT'"
      class="flex h-full w-full flex-col items-center justify-center"
    >
      <ChatList
        :data="conversation.useAssistant(Number(id)).value"
        role="USER"
      />
      <div class="flex w-full justify-center gap-2 p-4">
        <input
          v-model="assistantMessage"
          @keyup.enter="
            conversation.sendAssistant(Number(id), assistantMessage)
          "
          type="text"
          placeholder="输入您的问题"
          class="input input-bordered w-2/3 bg-base-200"
        />
        <button
          @click="
            conversation.sendAssistant(Number(id), assistantMessage);
            assistantMessage = '';
          "
          class="btn btn-primary"
        >
          发送
        </button>
        <!-- <button
          v-if="
            auth.data?.role == 'USER' &&
            !conversation.useConversation(Number(id)).value?.supportUserId
          "
          @click="conversation.toSupport(Number(id))"
          class="btn btn-primary"
        >
          转人工
        </button> -->
      </div>
    </div>
  </div>
</template>
