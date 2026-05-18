import axios from "axios"

const api = axios.create({
    baseURL: "http://localhost:3000",
    withCredentials: true,
})

export async function register({ username, email, password }) {
    try {
        const response = await api.post("/api/auth/registration", { username, email, password })
        return response.data
    } catch (err) {
        console.error("register error:", err?.response?.data || err.message || err)
        throw err
    }
}

export async function login({ email, password }) {
    try {
        const response = await api.post("/api/auth/login", { email, password })
        return response.data
    } catch (err) {
        console.error("login error:", err?.response?.data || err.message || err)
        throw err
    }
}

export async function logout() {
    try {
        const response = await api.get("/api/auth/logout")
        return response.data
    } catch (err) {
        console.error("logout error:", err?.response?.data || err.message || err)
        throw err
    }
}

export async function getMe() {
    try {
        const response = await api.get("/api/auth/get-me")
        return response.data
    } catch (err) {
        console.error("getMe error:", err?.response?.data || err.message || err)
        throw err
    }
}