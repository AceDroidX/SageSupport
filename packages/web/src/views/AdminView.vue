<script setup lang="ts">
import type { ChatSSEResponse, Documents } from '@/model';
import { axiosInstance } from '@/utils';
import { EventStreamContentType, fetchEventSource } from '@microsoft/fetch-event-source';
import mermaid from 'mermaid';
import svgPanZoom from 'svg-pan-zoom';
import { ref } from 'vue';

const fileElement = ref<HTMLInputElement>()
const documents = ref<Documents[]>([]);
const chatInput = ref('')
const sendText = ref('')
const resposeText = ref('')
const mermaidElement = ref<HTMLDivElement>()

async function getDocuments() {
    const resp = await axiosInstance.get<Documents[]>('/admin/documents')
    documents.value = resp.data
}

async function uploadDocuments() {
    const resp = await axiosInstance.postForm('/admin/documents', {
        documents: fileElement.value?.files
    })
    if (fileElement.value) fileElement.value.files = null
    await getDocuments()
}

async function deleteDocument(uuid: string) {
    const resp = await axiosInstance.delete('/admin/documents/' + uuid)
    await getDocuments()
}

async function showGraph(item: Documents) {
    console.log(await mermaid.parse(item.graph))
    const { svg } = await mermaid.render("mermaid", item.graph)
    if (mermaidElement.value) mermaidElement.value.innerHTML = svg
    svgPanZoom('#mermaid', { zoomEnabled: true, controlIconsEnabled: true, fit: true, center: true })
    document.getElementById('mermaid')?.setAttribute("height", "100%");
}

async function chat() {
    sendText.value = chatInput.value
    resposeText.value = ''
    await fetchEventSource(import.meta.env.VITE_API_BASE_URL + '/admin/chat', {
        method: 'POST', credentials: 'include', openWhenHidden: true, body: JSON.stringify({ msg: chatInput.value }),
        async onopen(response) {
            console.log('chat open', response)
            if (response.ok && response.headers.get('content-type') === EventStreamContentType) {
                console.log('chat ok')
                return; // everything's good
            } else if (response.status >= 400 && response.status < 500 && response.status !== 429) {
                // client-side errors are usually non-retriable:
                console.error(response);
            } else {
                console.error(response);
            }
        },
        onmessage(ev) {
            try {
                if (ev.event == 'delta' && ev.data != '') {
                    const data = <ChatSSEResponse>JSON.parse(ev.data)
                    if (data.answer) {
                        resposeText.value += data.answer
                    }
                }
            } catch (error) {
                console.error(error, ev)
            }
        },
        onclose() {
            console.log('chat closed')
        },
        onerror(error) {
            console.error(error)
        }
    })
    console.log('chat done')
}

mermaid.initialize({ startOnLoad: false, securityLevel: 'loose', theme: 'dark' })
getDocuments()  
</script>

<template>
    <div class="flex gap-8 p-8">
        <div class="flex flex-col gap-8">
            <div class="flex flex-col gap-2">
                <div>文档列表</div>
                <div class="flex gap-2 items-center">
                    <ul class="menu bg-base-200 rounded-box w-80">
                        <li v-for="item in documents" class="flex flex-row flex-nowrap items-center">
                            <div @click="showGraph(item)">{{ item.name }}</div>
                            <button @click="deleteDocument(item.uuid)" class="btn btn-ghost btn-sm">删除</button>
                        </li>
                    </ul>
                    <button @click="getDocuments" class="btn btn-primary">刷新</button>
                </div>
            </div>
            <div class="flex flex-col gap-2">
                <div>上传文档</div>
                <div class="flex gap-2">
                    <input ref="fileElement" type="file" class="file-input file-input-bordered" multiple />
                    <button @click="uploadDocuments" class="btn btn-primary">上传文档</button>
                </div>
            </div>
            <div class="flex flex-col gap-2">
                <div>用户输入</div>
                <div class="flex gap-2">
                    <textarea v-model="chatInput" class="textarea textarea-bordered"></textarea>
                    <button @click="chat" class="btn btn-primary">发送</button>
                </div>
            </div>
            <!-- <div class="card bg-base-100 w-96 shadow-xl">
            <div class="card-body">
                <h2 class="card-title">AI回复</h2>
                <p>{{ resposeText }}</p>
            </div>
        </div> -->
            <div>
                <div v-if="sendText" class="chat chat-end">
                    <div class="chat-image avatar placeholder">
                        <div class="w-10 h-10 rounded-full">
                            <!-- <img alt="Tailwind CSS chat bubble component"
                            src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp" /> -->
                            <div class="bg-neutral text-neutral-content w-10 h-10 rounded-full flex justify-center">
                                <svg class="fill-current w-8" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                    <title>account</title>
                                    <path
                                        d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                    <!-- <div class="chat-header">
                    Anakin
                    <time class="text-xs opacity-50">12:46</time>
                </div> -->
                    <div class="chat-bubble whitespace-pre-wrap">{{ sendText }}</div>
                    <!-- <div class="chat-footer opacity-50">Seen at 12:46</div> -->
                </div>
                <div v-if="resposeText" class="chat chat-start">
                    <div class="chat-image avatar placeholder">
                        <div class="w-10 h-10 rounded-full">
                            <div class="bg-neutral text-neutral-content w-10 h-10 rounded-full flex justify-center">
                                <svg class="fill-current w-7" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                    <title>robot</title>
                                    <path
                                        d="M12,2A2,2 0 0,1 14,4C14,4.74 13.6,5.39 13,5.73V7H14A7,7 0 0,1 21,14H22A1,1 0 0,1 23,15V18A1,1 0 0,1 22,19H21V20A2,2 0 0,1 19,22H5A2,2 0 0,1 3,20V19H2A1,1 0 0,1 1,18V15A1,1 0 0,1 2,14H3A7,7 0 0,1 10,7H11V5.73C10.4,5.39 10,4.74 10,4A2,2 0 0,1 12,2M7.5,13A2.5,2.5 0 0,0 5,15.5A2.5,2.5 0 0,0 7.5,18A2.5,2.5 0 0,0 10,15.5A2.5,2.5 0 0,0 7.5,13M16.5,13A2.5,2.5 0 0,0 14,15.5A2.5,2.5 0 0,0 16.5,18A2.5,2.5 0 0,0 19,15.5A2.5,2.5 0 0,0 16.5,13Z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                    <!-- <div class="chat-header">
                    Obi-Wan Kenobi
                    <time class="text-xs opacity-50">12:45</time>
                </div> -->
                    <div class="chat-bubble whitespace-pre-wrap">{{ resposeText }}</div>
                    <!-- <div class="chat-footer opacity-50">Delivered</div> -->
                </div>
            </div>
        </div>
        <div class="flex flex-col gap-2 w-full h-96 min-h-full">
            <div>知识图谱</div>
            <div class="w-full h-full min-h-full" ref="mermaidElement"></div>
        </div>
    </div>
</template>