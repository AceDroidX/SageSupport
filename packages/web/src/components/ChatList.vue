<script setup lang="ts">
import markdownit from "markdown-it";
import mermaid from "mermaid";
import { UserRole, type Message } from "sage-support-shared/prisma";
import { nextTick, ref, watch } from "vue";
import account from "./icon/account.vue";
import faceAgent from "./icon/face-agent.vue";
import robot from "./icon/robot.vue";

const props = defineProps<{
  data: Message[];
  delta?: string;
  role: UserRole;
}>();

const container = ref<HTMLDivElement>();
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
      suppressErrors: true,
    });
    container.value?.scrollTo({
      top: container.value.scrollHeight,
      behavior: "instant",
    });
  },
  { immediate: true },
);
</script>

<template>
  <div
    class="flex h-full w-full flex-col gap-2 overflow-y-auto p-8"
    ref="container"
  >
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
    <div v-if="props.delta !== undefined" class="chat chat-start">
      <div class="avatar placeholder chat-image">
        <div class="h-10 w-10 rounded-full">
          <div
            class="flex h-10 w-10 justify-center rounded-full bg-neutral text-neutral-content"
          >
            <robot />
          </div>
        </div>
      </div>
      <div class="chat-bubble" v-html="md.render(props.delta)"></div>
      <div class="chat-footer opacity-50">生成中</div>
    </div>
  </div>
</template>
