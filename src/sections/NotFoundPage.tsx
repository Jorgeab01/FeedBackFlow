import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { Home, ArrowLeft, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"

export function NotFoundPage() {
    return (
        <div className="landing-theme min-h-screen bg-background text-foreground flex flex-col">
            <Navbar />

            <main className="flex-1 flex items-center justify-center px-6">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center max-w-lg"
                >
                    {/* Big 404 */}
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-[10rem] font-black leading-none bg-gradient-to-br from-primary via-purple-400 to-pink-500 bg-clip-text text-transparent select-none"
                    >
                        404
                    </motion.div>

                    <h1 className="text-2xl font-bold text-foreground mt-2 mb-3">
                        Página no encontrada
                    </h1>
                    <p className="text-muted-foreground mb-8 leading-relaxed">
                        La página que buscas no existe o ha sido movida.
                        Pero no te preocupes, puedes volver al inicio.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Button asChild size="lg" className="gap-2">
                            <Link to="/">
                                <Home className="w-4 h-4" />
                                Ir al inicio
                            </Link>
                        </Button>
                        <Button asChild variant="outline" size="lg" className="gap-2">
                            <Link to="/blog">
                                <BookOpen className="w-4 h-4" />
                                Leer el blog
                            </Link>
                        </Button>
                    </div>

                    {/* Go back link */}
                    <button
                        onClick={() => window.history.back()}
                        className="mt-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Volver atrás
                    </button>
                </motion.div>
            </main>

            <Footer />
        </div>
    )
}
