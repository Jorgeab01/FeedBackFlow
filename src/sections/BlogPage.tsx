import { useState, useMemo, useRef, useEffect } from "react"
import { ArrowRight, Clock, Tag, Search, ChevronDown, X } from "lucide-react"
import { Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { blogArticles } from "@/data/blog-articles"
import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"

export function BlogPage() {
    const [search, setSearch] = useState("")
    const [selectedCategories, setSelectedCategories] = useState<string[]>([])
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Extract unique categories
    const categories = useMemo(
        () => [...new Set(blogArticles.map(a => a.category))],
        []
    )

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false)
            }
        }
        document.addEventListener("mousedown", handler)
        return () => document.removeEventListener("mousedown", handler)
    }, [])

    const toggleCategory = (cat: string) => {
        setSelectedCategories(prev =>
            prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
        )
    }

    const removeCategory = (cat: string) => {
        setSelectedCategories(prev => prev.filter(c => c !== cat))
    }

    // Filter articles
    const filtered = useMemo(() => {
        return blogArticles.filter(article => {
            const matchesSearch = search === "" ||
                article.title.toLowerCase().includes(search.toLowerCase()) ||
                article.description.toLowerCase().includes(search.toLowerCase())
            const matchesCategory = selectedCategories.length === 0 ||
                selectedCategories.includes(article.category)
            return matchesSearch && matchesCategory
        })
    }, [search, selectedCategories])

    return (
        <div className="landing-theme min-h-screen bg-background text-foreground">
            <Navbar />

            <main className="pt-32 pb-20">
                <div className="mx-auto max-w-7xl px-6">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="mx-auto max-w-2xl text-center mb-12"
                    >
                        <span className="text-sm font-medium text-primary">Blog</span>
                        <h1 className="mt-3 text-balance text-3xl font-bold text-foreground md:text-5xl">
                            Consejos para mejorar tu negocio
                        </h1>
                        <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
                            Estrategias, tutoriales y buenas prácticas para gestionar el feedback de tus clientes y hacer crecer tu negocio.
                        </p>
                    </motion.div>

                    {/* Filters — centered */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="mb-10 flex flex-col items-center gap-4"
                    >
                        <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-lg">
                            {/* Search */}
                            <div className="relative w-full">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Buscar artículo..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full rounded-lg border border-border/50 bg-card pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                                />
                            </div>

                            {/* Category dropdown */}
                            <div ref={dropdownRef} className="relative flex-shrink-0">
                                <button
                                    onClick={() => setDropdownOpen(!dropdownOpen)}
                                    className="flex items-center gap-2 rounded-lg border border-border/50 bg-card px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all whitespace-nowrap"
                                >
                                    <Tag className="w-4 h-4" />
                                    Categoría
                                    <ChevronDown className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                                </button>

                                <AnimatePresence>
                                    {dropdownOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -8, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: -8, scale: 0.95 }}
                                            transition={{ duration: 0.15 }}
                                            className="absolute right-0 sm:left-0 mt-2 w-48 rounded-xl border border-border/50 bg-card shadow-xl shadow-black/20 overflow-hidden z-50"
                                        >
                                            <div className="p-1.5">
                                                {categories.map(cat => (
                                                    <button
                                                        key={cat}
                                                        onClick={() => toggleCategory(cat)}
                                                        className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all ${selectedCategories.includes(cat)
                                                            ? "text-foreground font-medium"
                                                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                                            }`}
                                                    >
                                                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${selectedCategories.includes(cat)
                                                            ? "border-primary bg-primary"
                                                            : "border-muted-foreground/40"
                                                            }`}>
                                                            {selectedCategories.includes(cat) && (
                                                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            )}
                                                        </div>
                                                        {cat}
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Active filter tags */}
                        <AnimatePresence>
                            {selectedCategories.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="flex flex-wrap items-center justify-center gap-2"
                                >
                                    {selectedCategories.map(cat => (
                                        <motion.span
                                            key={cat}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary"
                                        >
                                            {cat}
                                            <button
                                                onClick={() => removeCategory(cat)}
                                                className="rounded-full p-0.5 hover:bg-primary/25 transition-colors"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </motion.span>
                                    ))}
                                    <button
                                        onClick={() => setSelectedCategories([])}
                                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        Limpiar todo
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>

                    {/* Articles Grid */}
                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                        {filtered.map((article, index) => (
                            <motion.article
                                key={article.slug}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                layout
                            >
                                <Link
                                    to={`/blog/${article.slug}`}
                                    className="group block h-full rounded-xl border border-border/50 bg-card overflow-hidden transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
                                >
                                    {/* Image/Emoji Header */}
                                    <div className="h-48 bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5 flex items-center justify-center">
                                        <span className="text-7xl group-hover:scale-110 transition-transform duration-300">
                                            {article.image}
                                        </span>
                                    </div>

                                    <div className="p-6">
                                        {/* Meta */}
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                                            <div className="flex items-center gap-1">
                                                <Tag className="w-3 h-3" />
                                                <span>{article.category}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                <span>{article.readTime}</span>
                                            </div>
                                        </div>

                                        <h2 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                                            {article.title}
                                        </h2>

                                        <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
                                            {article.description}
                                        </p>

                                        <div className="mt-4 flex items-center gap-1 text-sm font-medium text-primary">
                                            Leer artículo
                                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </div>
                                </Link>
                            </motion.article>
                        ))}
                    </div>

                    {/* Empty state */}
                    {filtered.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-16"
                        >
                            <Search className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                            <p className="text-muted-foreground text-lg">No se encontraron artículos</p>
                            <p className="text-muted-foreground/70 text-sm mt-1">Prueba con otros términos de búsqueda</p>
                            <button
                                onClick={() => { setSearch(""); setSelectedCategories([]); }}
                                className="mt-4 text-sm text-primary hover:underline"
                            >
                                Limpiar filtros
                            </button>
                        </motion.div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    )
}
