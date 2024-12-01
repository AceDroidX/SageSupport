<script setup lang="ts">
import { useAuthStore } from "@/stores/auth";
import { useConversationStore } from "@/stores/conversation";
import { ref } from "vue";
import { useRouter } from "vue-router";

const conversation = useConversationStore();
const auth = useAuthStore();
const router = useRouter();

const question = ref("");

async function send() {
  const resp = await conversation.newMessage(question.value);
  if (resp) router.push("/conversation/" + resp.data.id);
}
</script>

<template>
  <div
    v-if="auth.data?.role !== 'SUPPORT'"
    class="flex h-full w-full flex-col items-center justify-center gap-4"
  >
    <h1 class="text-xl font-bold">您遇到了什么问题？</h1>
    <label class="flex w-1/2 gap-2">
      <input
        v-model="question"
        type="text"
        placeholder="输入您的问题"
        class="input input-bordered w-full bg-base-200"
      />
      <button @click="send" class="btn btn-primary">发送</button>
    </label>
  </div>
  <div v-else class="flex h-full w-full flex-col items-center justify-center">
    <h1 class="text-xl font-bold">选择左侧历史记录开始对话</h1>
  </div>
</template>
