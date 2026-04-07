/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: "#8B5CF6", // Vibrant Purple
                    hover: "#7c3aed",
                },
                "background-light": "#F8FAFC",
                "background-dark": "#0F172A",
                "surface-light": "#FFFFFF",
                "surface-dark": "#1E293B",
                background: {
                    light: "#F3F4F6",
                    dark: "#0F172A",
                },
                card: {
                    light: "#FFFFFF",
                    dark: "#1E293B",
                },
                text: {
                    main: {
                        light: "#111827",
                        dark: "#F9FAFB",
                    },
                    muted: {
                        light: "#6B7280",
                        dark: "#9CA3AF",
                    }
                },
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                foreground: "hsl(var(--foreground))",
            },
            fontFamily: {
                sans: ["Plus Jakarta Sans", "sans-serif"],
                display: ["Plus Jakarta Sans", "sans-serif"],
                body: ["'Inter'", "sans-serif"],
            },
            borderRadius: {
                DEFAULT: "12px",
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
        },
    },
    plugins: [],
}
