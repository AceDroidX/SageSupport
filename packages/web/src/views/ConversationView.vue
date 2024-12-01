<script setup lang="ts">
import ChatList from "@/components/ChatList.vue";
import Modal from "@/components/Modal.vue";
import { useAuthStore } from "@/stores/auth";
import { useConversationStore } from "@/stores/conversation";
import { axiosInstance } from "@/utils";
import type { TextSplitsIdWithName } from "sage-support-shared";
import { nextTick, ref, useTemplateRef, watch } from "vue";

const props = defineProps<{ id: string }>();

const conversation = useConversationStore();
const auth = useAuthStore();
const ModalRef = useTemplateRef<InstanceType<typeof Modal>>("ModalRef");
const message = ref("");
const assistantMessage = ref("");
const documentsMap = ref(new Map<string, string>());

async function getDocuments() {
  if (!conversation.context) return;
  const resp = await axiosInstance.get<TextSplitsIdWithName[]>(
    "/support/documents/name",
    {
      params: {
        id: conversation.context.map((item) => item.id),
      },
    },
  );
  for (const item of resp.data) {
    documentsMap.value.set(item.id, item.name ?? item.id);
  }
}

watch(
  () => props.id,
  async () => {
    await nextTick();
    await conversation.switchConversation(Number(props.id));
  },
  { immediate: true },
);
</script>

<template>
  <div class="flex h-full w-full">
    <div class="flex h-full w-full flex-col items-center justify-center">
      <ChatList
        :data="conversation.useMessage(Number(id)).value"
        :role="auth.data?.role ?? 'USER'"
      />
      <div class="flex w-full justify-center gap-2 p-4">
        <input
          v-model="message"
          @keyup.enter="conversation.sendMessage(Number(id), message)"
          type="text"
          placeholder="输入您的问题"
          class="input input-bordered w-2/3 bg-base-200"
        />
        <button
          @click="
            conversation.sendMessage(Number(id), message);
            message = '';
          "
          class="btn btn-primary"
        >
          发送
        </button>
        <button
          v-if="
            auth.data?.role == 'USER' &&
            !conversation.useConversation(Number(id)).value?.supportUserId
          "
          @click="conversation.toSupport(Number(id))"
          class="btn btn-primary"
        >
          转人工
        </button>
      </div>
    </div>
    <div
      v-if="auth.data?.role == 'SUPPORT'"
      class="divider divider-horizontal"
    ></div>
    <div
      v-if="auth.data?.role == 'SUPPORT'"
      class="flex h-full w-full flex-col items-center justify-center"
    >
      <ChatList
        :data="conversation.useAssistant(Number(id)).value"
        role="USER"
      />
      <div class="flex w-full justify-center gap-2 p-4">
        <input
          v-model="assistantMessage"
          @keyup.enter="
            conversation.sendAssistant(Number(id), assistantMessage)
          "
          type="text"
          placeholder="输入您的问题"
          class="input input-bordered w-2/3 bg-base-200"
        />
        <button
          @click="
            conversation.sendAssistant(Number(id), assistantMessage);
            assistantMessage = '';
          "
          class="btn btn-primary"
        >
          发送
        </button>
        <button
          @click="
            ModalRef?.open();
            getDocuments();
          "
          class="btn btn-primary"
        >
          引用资料
        </button>
      </div>
    </div>
    <Modal ref="ModalRef" fullMaxWidth fullMaxHeight>
      <div class="text-lg font-bold">引用文档</div>
      <div class="flex flex-col gap-2">
        <div v-for="item in conversation.context" class="flex flex-col gap-2">
          <!-- <div>{{ item.id }}</div> -->
          <div class="flex gap-8">
            <div>{{ documentsMap.get(item.id) }}</div>
            <div>
              第{{ item.metadata.loc_pageNumber }}页
              {{ item.metadata.loc_lines_from }}-{{
                item.metadata.loc_lines_to
              }}行
            </div>
          </div>
          <div>{{ item.pageContent }}</div>
          <div class="divider m-0"></div>
        </div>
      </div>
    </Modal>
  </div>
</template>
