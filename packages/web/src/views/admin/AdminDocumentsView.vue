<script setup lang="ts">
import type { Documents } from "@/model";
import { axiosInstance } from "@/utils";
import mermaid from "mermaid";
import svgPanZoom from "svg-pan-zoom";
import { ref } from "vue";

const fileElement = ref<HTMLInputElement>();
const documents = ref<Documents[]>([]);
const mermaidElement = ref<HTMLDivElement>();

async function getDocuments() {
  const resp = await axiosInstance.get<Documents[]>("/admin/documents");
  documents.value = resp.data;
}

async function uploadDocuments() {
  const resp = await axiosInstance.postForm("/admin/documents", {
    documents: fileElement.value?.files,
  });
  if (fileElement.value) fileElement.value.value = "";
  await getDocuments();
}

async function deleteDocument(uuid: string) {
  const resp = await axiosInstance.delete("/admin/documents/" + uuid);
  await getDocuments();
}

async function showGraph(item: Documents) {
  console.log(await mermaid.parse(item.graph));
  const { svg } = await mermaid.render("mermaid", item.graph);
  if (mermaidElement.value) mermaidElement.value.innerHTML = svg;
  svgPanZoom("#mermaid", {
    zoomEnabled: true,
    controlIconsEnabled: true,
    fit: true,
    center: true,
  });
  document.getElementById("mermaid")?.setAttribute("height", "100%");
}

mermaid.initialize({
  startOnLoad: false,
  securityLevel: "loose",
  theme: "dark",
});
getDocuments();
</script>

<template>
  <div class="flex gap-8 p-8">
    <div class="flex flex-col gap-8">
      <div class="flex flex-col gap-2">
        <div>文档列表</div>
        <div class="flex items-center gap-2">
          <ul class="menu w-80 rounded-box bg-base-200">
            <li
              v-for="item in documents"
              class="flex flex-row flex-nowrap items-center"
            >
              <div @click="showGraph(item)">{{ item.name }}</div>
              <button
                @click="deleteDocument(item.uuid)"
                class="btn btn-ghost btn-sm"
              >
                删除
              </button>
            </li>
          </ul>
          <button @click="getDocuments" class="btn btn-primary">刷新</button>
        </div>
      </div>
      <div class="flex flex-col gap-2">
        <div>上传文档</div>
        <div class="flex gap-2">
          <input
            ref="fileElement"
            type="file"
            class="file-input file-input-bordered"
            multiple
          />
          <button @click="uploadDocuments" class="btn btn-primary">
            上传文档
          </button>
        </div>
      </div>
    </div>
    <div class="flex h-96 min-h-full w-full flex-col gap-2">
      <div>知识图谱</div>
      <div class="h-full min-h-full w-full" ref="mermaidElement"></div>
    </div>
  </div>
</template>
