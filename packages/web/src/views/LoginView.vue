<script setup lang="ts">
import { useAuthStore } from "@/stores/auth";
import { UserRole } from "sage-support-shared/prisma";
import { ref } from "vue";
import { useRouter } from "vue-router";

// const props = withDefaults(defineProps<{ route?: string, path?: string, md5?: boolean, title?: string }>(), {
//     route: '/',
//     path: '/user/login',
//     md5: true,
//     title: '',
// })

const router = useRouter();
const auth = useAuthStore();

const account = ref("");
const password = ref("");

async function login() {
  const resp = await auth.login(account.value, password.value);
  if (!resp) return;
  // localStorage.setItem('role', resp.data.data.role)
  if (resp.role === UserRole.ADMIN) {
    await router.push("/admin");
  } else {
    await router.push("/");
  }
}
</script>

<template>
  <div
    class="flex h-screen w-screen flex-col items-center justify-center gap-4"
  >
    <h1 class="text-xl font-bold">登录页面</h1>
    <label class="input input-bordered flex items-center gap-2">
      账号
      <input v-model="account" type="text" class="grow" placeholder="" />
    </label>
    <label class="input input-bordered flex items-center gap-2">
      密码
      <input
        v-model="password"
        @keyup.enter="login"
        type="text"
        class="grow"
        placeholder=""
      />
    </label>
    <button @click="login" class="btn btn-primary btn-wide text-white">
      登录
    </button>
  </div>
</template>
