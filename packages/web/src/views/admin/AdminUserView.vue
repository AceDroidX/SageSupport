<script setup lang="ts">
import Modal from "@/components/Modal.vue";
import { axiosInstance } from "@/utils";
import { UserRoleName } from "sage-support-shared";
import { UserRole, type User } from "sage-support-shared/prisma";
import { ref, useTemplateRef } from "vue";

const users = ref<User[]>([]);
const ModalRef = useTemplateRef<InstanceType<typeof Modal>>("ModalRef");
const username = ref("");
const password = ref("");
const role = ref(UserRole.USER);

async function submit() {
  const resp = await axiosInstance.post<User[]>("/admin/users", {
    username: username.value,
    password: password.value,
    role: role.value,
  });
  users.value = resp.data;
  ModalRef?.close();
}

async function getData() {
  const resp = await axiosInstance.get<User[]>("/admin/users");
  users.value = resp.data;
}
getData();
</script>

<template>
  <div class="flex flex-col gap-2">
    <div>用户管理</div>
    <button @click="ModalRef?.open()" class="btn btn-primary w-fit">
      添加用户
    </button>
    <div class="overflow-x-auto">
      <table class="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>用户名</th>
            <th>角色</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in users">
            <th>{{ item.id }}</th>
            <td>{{ item.name }}</td>
            <td>{{ UserRoleName[item.role] }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <Modal ref="ModalRef">
      <div class="text-lg font-bold">添加用户</div>
      <label>
        用户名：
        <input
          v-model="username"
          class="input input-bordered w-full max-w-xs"
        />
      </label>
      <label>
        密码：
        <input
          v-model="password"
          class="input input-bordered w-full max-w-xs"
        />
      </label>
      <label>
        角色：
        <select v-model="role" class="select select-bordered w-full max-w-xs">
          <option v-for="item in Object.values(UserRole)" :value="item">
            {{ UserRoleName[item] }}
          </option>
        </select>
      </label>
      <button @click="submit" class="btn btn-primary btn-wide self-center">
        确定
      </button>
    </Modal>
  </div>
</template>
