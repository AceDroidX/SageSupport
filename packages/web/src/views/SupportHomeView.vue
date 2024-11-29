<script setup lang="ts">
import { useConversationStore } from "@/stores/conversation";
import { ref } from "vue";
import { useRouter } from "vue-router";

const conversation = useConversationStore();
const router = useRouter();

const question = ref("");

async function send() {
  const resp = await conversation.newMessage(question.value);
  if (resp) router.push("/support/conversation/" + resp.data.id);
}
</script>

<template>
  <div class="flex h-full w-full flex-col items-center justify-center gap-4">
    <h1 class="text-xl font-bold">您遇到了什么问题？</h1>
    <label class="flex gap-2">
      <input
        v-model="question"
        type="text"
        placeholder="输入您的问题"
        class="input input-bordered w-full max-w-xs"
      />
      <button @click="send" class="btn btn-primary">发送</button>
    </label>
  </div>
</template>
