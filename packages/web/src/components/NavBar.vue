<script setup lang="ts">
import { useAuthStore } from "@/stores/auth";
import { UserRoleName } from "sage-support-shared";
import { useRouter } from "vue-router";
import ThemeButton from "./ThemeButton.vue";
const router = useRouter();
const auth = useAuthStore();
</script>

<template>
  <div class="navbar bg-base-100 shadow">
    <div class="flex-none">
      <label for="my-drawer-2" class="btn btn-square btn-ghost drawer-button">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          class="inline-block h-5 w-5 stroke-current"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 6h16M4 12h16M4 18h16"
          ></path>
        </svg>
      </label>
    </div>
    <div class="flex-1">
      <!-- <router-link class="btn btn-ghost text-xl" to="/"
        >旅游景点购票系统</router-link
      > -->
    </div>
    <div class="flex-none">
      <!-- <div class="dropdown dropdown-end">
        <div tabindex="0" role="button" class="btn btn-circle btn-ghost">
          <div class="indicator">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <span class="badge indicator-item badge-sm">8</span>
          </div>
        </div>
        <div
          tabindex="0"
          class="card dropdown-content card-compact z-[1] mt-3 w-52 bg-base-100 shadow"
        >
          <div class="card-body">
            <span class="text-lg font-bold">8 Items</span>
            <span class="text-info">Subtotal: $999</span>
            <div class="card-actions">
              <button class="btn btn-primary btn-block">View cart</button>
            </div>
          </div>
        </div>
      </div> -->
      <div v-if="auth.data?.name" class="dropdown dropdown-end">
        <!-- <div tabindex="0" role="button" class="avatar btn btn-circle btn-ghost">
          <div class="w-10 rounded-full">
            <img
              alt="Tailwind CSS Navbar component"
              src="https://daisyui.com/images/stock/photo-1534528741775-53994a69daeb.jpg"
            />
          </div>
        </div> -->
        <div tabindex="0" role="button" class="avatar btn btn-ghost">
          {{ UserRoleName[auth.data?.role] }}：{{ auth.data?.name }}
        </div>
        <ul
          tabindex="0"
          class="menu dropdown-content menu-sm z-[1] mt-3 w-52 rounded-box bg-base-100 p-2 shadow"
        >
          <!-- <li v-if="auth.data?.role == UserRole.ADMIN">
            <router-link to="/manage">管理后台</router-link>
          </li> -->
          <!-- <li><a href="/purchase">历史订单</a></li> -->
          <li>
            <a
              @click="
                auth.logout();
                router.push('/login');
              "
              >登出</a
            >
          </li>
        </ul>
      </div>
      <button
        v-if="!auth.data?.name"
        class="btn btn-ghost"
        @click="router.push('/login')"
      >
        登录
      </button>
      <button
        v-if="!auth.data?.name"
        class="btn btn-ghost"
        @click="router.push('/register')"
      >
        注册
      </button>
      <ThemeButton />
    </div>
  </div>
</template>
