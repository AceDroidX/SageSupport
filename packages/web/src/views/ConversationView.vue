<script setup lang="ts">
import ChatList from "@/components/ChatList.vue";
import { useConversationStore } from "@/stores/conversation";
import { nextTick, watch } from "vue";

const props = defineProps<{ id: string }>();

const conversation = useConversationStore();

watch(
    () => props.id,
    async () => {
        await nextTick();
        conversation.fetchConversation(Number(props.id));
    },
    { immediate: true }
);
</script>

<template>
    <div class="flex flex-col gap-4 w-full h-full justify-center items-center">
        <h1 class="text-xl font-bold">会话 {{ id }}</h1>

        <ChatList
            :data="conversation.useMessage(Number(id)).value"
            role="USER"
        />
    </div>
</template>
