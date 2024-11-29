<script setup lang="ts">
import NavBar from "@/components/NavBar.vue";
import { useConversationStore } from "@/stores/conversation";
import { RouterLink, RouterView } from "vue-router";

const conversation = useConversationStore();
conversation.fetchConversationList();
</script>

<template>
  <div class="drawer lg:drawer-open">
    <input id="my-drawer-2" type="checkbox" class="drawer-toggle" />
    <div class="drawer-content flex flex-col">
      <!-- Page content here -->
      <label for="my-drawer-2" class="btn btn-primary drawer-button lg:hidden"
        >Open drawer</label
      >
      <nav-bar />
      <RouterView />
    </div>
    <div class="drawer-side">
      <label
        for="my-drawer-2"
        aria-label="close sidebar"
        class="drawer-overlay"
      ></label>
      <ul class="menu min-h-full w-60 bg-base-200 p-4 text-base-content">
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
          <RouterLink :to="'/support/conversation/' + item.id">{{
            item.title
          }}</RouterLink>
          <button
            @click="conversation.deleteConversation(item.id)"
            class="btn btn-ghost btn-xs invisible absolute right-0 opacity-0 transition-all group-hover:visible group-hover:opacity-100 group-hover:transition-all"
          >
            删除
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>
