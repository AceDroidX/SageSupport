<script setup lang="ts">
import NavBar from "@/components/NavBar.vue";
</script>

<template>
  <div class="drawer h-screen w-screen">
    <input
      id="my-drawer-2"
      type="checkbox"
      class="peer drawer-toggle"
      checked
    />
    <div class="drawer-content flex flex-col">
      <nav-bar />
      <slot name="content"></slot>
    </div>
    <div
      class="drawer-side peer-checked:pointer-events-auto peer-checked:visible peer-checked:sticky peer-checked:w-auto"
    >
      <ul class="menu min-h-full w-60 bg-base-200 p-4 text-base-content">
        <slot name="sidebar"></slot>
      </ul>
    </div>
  </div>
</template>
