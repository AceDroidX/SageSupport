<script setup lang="ts">
import { axiosInstance } from "@/utils";
import { UserRoleName } from "sage-support-shared";
import type { User } from "sage-support-shared/prisma";
import { ref } from "vue";

const users = ref<User[]>([]);

async function getData() {
  const resp = await axiosInstance.get<User[]>("/admin/users");
  users.value = resp.data;
}
getData();
</script>

<template>
  <div>用户管理</div>
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
</template>
