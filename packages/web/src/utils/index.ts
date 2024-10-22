import router from "@/router";
import axios, { isAxiosError } from "axios";

export const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
})
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (!isAxiosError(error)) {
            return Promise.reject(error)
        }
        if (error.status === 400) {
            alert(JSON.stringify(error.response?.data))
        }
        else if (error.status === 401) {
            router.push('/login')
        }
        else if (error.status === 500) {
            alert("内部服务器错误 请联系管理员: " + JSON.stringify(error.response?.data))
        }
        return Promise.reject(error)
    }
)
