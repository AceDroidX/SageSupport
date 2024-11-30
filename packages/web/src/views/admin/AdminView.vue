<script setup lang="ts">
import NavBar from "@/components/NavBar.vue";
import { RouterLink, RouterView } from "vue-router";
</script>

<template>
  <div class="drawer lg:drawer-open">
    <input id="my-drawer-2" type="checkbox" class="drawer-toggle" />
    <div class="drawer-content flex flex-col">
      <!-- Page content here -->
      <label for="my-drawer-2" class="btn btn-primary drawer-button lg:hidden"
        >Open drawer</label
      >
      <nav-bar />
      <RouterView />
    </div>
    <div class="drawer-side">
      <label
        for="my-drawer-2"
        aria-label="close sidebar"
        class="drawer-overlay"
      ></label>
      <ul class="menu min-h-full w-60 bg-base-200 p-4 text-base-content">
        <!-- Sidebar content here -->
        <li>
          <RouterLink :to="'/admin/documents'">文档管理</RouterLink>
        </li>
      </ul>
    </div>
  </div>
</template>
