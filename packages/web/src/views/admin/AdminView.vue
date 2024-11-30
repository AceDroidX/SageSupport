<script setup lang="ts">
import Layout from "@/components/Layout.vue";
import { RouterLink, RouterView } from "vue-router";
</script>

<template>
  <Layout>
    <template #sidebar>
      <li>
        <RouterLink :to="'/admin/documents'">文档管理</RouterLink>
        <RouterLink :to="'/admin/users'">用户管理</RouterLink>
      </li>
    </template>
    <template #content>
      <RouterView />
    </template>
  </Layout>
</template>
