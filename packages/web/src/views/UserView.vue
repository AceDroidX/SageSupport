<script setup lang="ts">
import plusCircleOutline from "@/components/icon/plus-circle-outline.vue";
import Layout from "@/components/Layout.vue";
import { useAuthStore } from "@/stores/auth";
import { useConversationStore } from "@/stores/conversation";
import { RouterLink, RouterView } from "vue-router";

const conversation = useConversationStore();
conversation.fetchConversationList();
const auth = useAuthStore();
</script>

<template>
  <Layout>
    <template #sidebar>
      <li :class="auth.data?.role == 'SUPPORT' ? 'invisible' : ''">
        <RouterLink to="/">
          <plusCircleOutline class="w-6 fill-current" />
          <div>新对话</div>
        </RouterLink>
      </li>
      <div class="divider my-0"></div>
      <div class="flex flex-col bg-base-200 p-4 text-base-content">
        <div class="text-lg font-bold">历史记录</div>
      </div>
      <li
        v-for="item in conversation.conversationList"
        class="group flex flex-row flex-nowrap items-center"
      >
        <RouterLink :to="'/conversation/' + item.id">{{
          item.title
        }}</RouterLink>
        <button
          @click="conversation.deleteConversation(item.id)"
          class="btn btn-ghost btn-xs invisible absolute right-0 opacity-0 transition-all group-hover:visible group-hover:opacity-100 group-hover:transition-all"
        >
          删除
        </button>
      </li>
    </template>
    <template #content>
      <RouterView />
    </template>
  </Layout>
</template>
