<script setup lang="ts">
import type { Message, UserRole } from "sage-support-shared/prisma";
import account from "./icon/account.vue";
import robot from "./icon/robot.vue";

const props = defineProps<{ data: Message[]; role: UserRole }>();
</script>

<template>
    <div class="flex flex-col gap-2 w-full h-full">
        <div
            v-for="item in props.data"
            :key="item.messageId"
            :class="item.type == props.role ? 'chat-end' : 'chat-start'"
            class="chat"
        >
            <div class="chat-image avatar placeholder">
                <div class="w-10 h-10 rounded-full">
                    <!-- <img alt="Tailwind CSS chat bubble component"
                            src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp" /> -->
                    <div
                        class="bg-neutral text-neutral-content w-10 h-10 rounded-full flex justify-center"
                    >
                        <robot v-if="item.type === 'AI'" />
                        <account v-else />
                    </div>
                </div>
            </div>
            <!-- <div class="chat-header">
                    Anakin
                    <time class="text-xs opacity-50">12:46</time>
                </div> -->
            <div class="chat-bubble whitespace-pre-wrap">
                {{ item.content }}
            </div>
            <!-- <div class="chat-footer opacity-50">Seen at 12:46</div> -->
        </div>
    </div>
</template>
