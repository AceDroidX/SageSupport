import { axiosInstance } from "@/utils"
import { defineStore } from "pinia"
import type { LoginResponse, LogoutResponse } from "sage-support-shared"
import type { User } from "sage-support-shared/prisma"
import { ref } from "vue"

export const useAuthStore = defineStore('auth', () => {
    const data = ref<User>()

    async function login(username: string, password: string) {
        const resp = await axiosInstance.post<LoginResponse>('/login', {
            username,
            password,
        })
        if (resp.data.code !== 0) {
            alert(resp.data.msg)
            return
        }
        data.value = resp.data.data
        return resp.data.data
    }
    async function logout() {
        const resp = await axiosInstance.post<LogoutResponse>('/logout')
        if (resp.data.code !== 0) {
            alert(resp.data.msg)
            return
        }
        data.value = undefined
        return resp.data
    }
    return { data, login, logout }
}, {
    persist: true
})