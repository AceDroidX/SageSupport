<script setup lang="ts">
import Layout from "@/components/Layout.vue";
import { useConversationStore } from "@/stores/conversation";
import { RouterLink, RouterView } from "vue-router";

const conversation = useConversationStore();
conversation.fetchConversationList();
</script>

<template>
  <Layout>
    <template #sidebar>
      <div class="flex flex-col bg-base-200 p-4 text-base-content">
        <RouterLink to="/">
          <button class="btn btn-primary">新对话</button>
        </RouterLink>
        <div class="text-lg font-bold">历史对话记录</div>
      </div>
      <!-- Sidebar content here -->
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
