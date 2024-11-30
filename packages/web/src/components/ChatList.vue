<script setup lang="ts">
import markdownit from "markdown-it";
import mermaid from "mermaid";
import { UserRole, type Message } from "sage-support-shared/prisma";
import { nextTick, watch } from "vue";
import account from "./icon/account.vue";
import faceAgent from "./icon/face-agent.vue";
import robot from "./icon/robot.vue";

const props = defineProps<{ data: Message[]; role: UserRole }>();

const md = markdownit({ langPrefix: "" });
mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  suppressErrorRendering: true,
});
watch(
  () => props.data,
  async () => {
    await nextTick();
    await mermaid.run({
      querySelector: ".mermaid",
      // suppressErrors: true,
    });
  },
  { immediate: true },
);
</script>

<template>
  <div class="flex h-full w-full flex-col gap-2">
    <div v-for="item in props.data" :key="item.messageId">
      <div
        v-if="item.type !== 'SYSTEM'"
        :class="item.type == props.role ? 'chat-end' : 'chat-start'"
        class="chat"
      >
        <div class="avatar placeholder chat-image">
          <div class="h-10 w-10 rounded-full">
            <!-- <img alt="Tailwind CSS chat bubble component"
                            src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp" /> -->
            <div
              class="flex h-10 w-10 justify-center rounded-full bg-neutral text-neutral-content"
            >
              <robot v-if="item.type === 'AI'" />
              <faceAgent v-else-if="item.type === 'SUPPORT'" />
              <account v-else />
            </div>
          </div>
        </div>
        <!-- <div class="chat-header">
                    Anakin
                    <time class="text-xs opacity-50">12:46</time>
                </div> -->
        <div class="chat-bubble" v-html="md.render(item.content)"></div>
      </div>
      <div v-else class="flex justify-center">
        <div class="chat-bubble">
          {{ item.content }}
        </div>
      </div>
      <!-- <div class="chat-footer opacity-50">Seen at 12:46</div> -->
    </div>
  </div>
</template>
