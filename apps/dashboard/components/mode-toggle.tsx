"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

export function ModeToggle() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return <div className="w-14 h-7 rounded-full bg-muted/20" />
    }

    const isDark = theme === "dark"

    const toggleTheme = () => {
        setTheme(isDark ? "light" : "dark")
    }

    return (
        <button
            onClick={toggleTheme}
            className={cn(
                "relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isDark ? "bg-slate-950 border border-slate-800" : "bg-sky-200 border border-sky-300"
            )}
            aria-label="Toggle theme"
        >
            <motion.div
                layout
                transition={{
                    type: "spring",
                    stiffness: 700,
                    damping: 30
                }}
                className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full shadow-sm",
                    isDark ? "bg-slate-800 text-slate-200" : "bg-white text-orange-500"
                )}
                style={{
                    marginLeft: isDark ? "calc(100% - 24px)" : "4px",
                    marginRight: isDark ? "4px" : "auto"
                }}
            >
                <div className="relative flex items-center justify-center w-full h-full">
                    <motion.div
                        initial={false}
                        animate={{
                            scale: isDark ? 0 : 1,
                            opacity: isDark ? 0 : 1,
                            rotate: isDark ? -90 : 0
                        }}
                        transition={{ duration: 0.2 }}
                        className="absolute"
                    >
                        <Sun className="h-3 w-3 fill-current" />
                    </motion.div>
                    <motion.div
                        initial={false}
                        animate={{
                            scale: isDark ? 1 : 0,
                            opacity: isDark ? 1 : 0,
                            rotate: isDark ? 0 : 90
                        }}
                        transition={{ duration: 0.2 }}
                        className="absolute"
                    >
                        <Moon className="h-3 w-3 fill-current" />
                    </motion.div>
                </div>
            </motion.div>
        </button>
    )
}
