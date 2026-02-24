import { motion, useScroll, useTransform } from "framer-motion"
import { ChevronDown } from "lucide-react"

export function ScrollIndicator() {
    const { scrollY } = useScroll()

    // La flecha desaparece gradualmente entre 0 y 100px de scroll
    const opacity = useTransform(scrollY, [0, 50, 100], [1, 0.5, 0])
    const y = useTransform(scrollY, [0, 100], [0, 20])

    const handleClick = () => {
        const element = document.getElementById('dashboard')
        if (element) {
            const offset = 80 // Navbar height approx
            const bodyRect = document.body.getBoundingClientRect().top
            const elementRect = element.getBoundingClientRect().top
            const elementPosition = elementRect - bodyRect
            const offsetPosition = elementPosition - offset

            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
            })
        }
    }

    return (
        <motion.div
            style={{ opacity, y }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 cursor-pointer hidden lg:[@media(min-height:750px)]:flex flex-col items-center gap-2"
            onClick={handleClick}
        >
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
                Descubre más
            </span>
            <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/30 bg-background/80 backdrop-blur-sm shadow-lg shadow-primary/5 hover:border-primary/60 hover:bg-primary/5 transition-colors"
            >
                <ChevronDown className="h-5 w-5 text-primary" />
            </motion.div>
        </motion.div>
    )
}