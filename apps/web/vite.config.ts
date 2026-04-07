import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    server: {
        allowedHosts: [
            "carmelia-muffy-bok.ngrok-free.dev",
            "localhost",
            "127.0.0.1"
        ],
        host: true // Listen on all local IPs
    }
})
