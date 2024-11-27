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
            <label
                for="my-drawer-2"
                class="btn btn-primary drawer-button lg:hidden"
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
            <ul class="menu min-h-full w-40 bg-base-200 p-4 text-base-content">
                <!-- Sidebar content here -->
                <RouterLink to="/">
                    <button class="btn btn-primary">新对话</button>
                </RouterLink>
                历史对话记录
                <li v-for="item in conversation.conversationList">
                    <RouterLink :to="'/conversation/' + item.id">{{
                        item.title
                    }}</RouterLink>
                </li>
            </ul>
        </div>
    </div>
</template>
