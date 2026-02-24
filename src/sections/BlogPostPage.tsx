import { useParams, Navigate, Link } from "react-router-dom"
import { useEffect } from "react"
import { ArrowLeft, Clock, Tag, ArrowRight } from "lucide-react"
import { motion } from "framer-motion"
import { blogArticles } from "@/data/blog-articles"
import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"
import { Button } from "@/components/ui/button"

export function BlogPostPage() {
    const { slug } = useParams<{ slug: string }>()
    const article = blogArticles.find(a => a.slug === slug)

    // Dynamic SEO: title, meta description, JSON-LD
    useEffect(() => {
        if (!article) return

        const originalTitle = document.title
        document.title = `${article.title} | FeedbackFlow Blog`

        // Meta description
        let metaDesc = document.querySelector('meta[name="description"]')
        const oldDesc = metaDesc?.getAttribute('content') || ''
        if (metaDesc) metaDesc.setAttribute('content', article.description)

        // JSON-LD Article
        const jsonLd = document.createElement('script')
        jsonLd.type = 'application/ld+json'
        jsonLd.textContent = JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": article.title,
            "description": article.description,
            "datePublished": article.date,
            "author": { "@type": "Organization", "name": "FeedbackFlow" },
            "publisher": {
                "@type": "Organization",
                "name": "FeedbackFlow",
                "url": "https://feedback-flow.com"
            },
            "url": `https://feedback-flow.com/blog/${article.slug}`,
            "mainEntityOfPage": `https://feedback-flow.com/blog/${article.slug}`
        })
        document.head.appendChild(jsonLd)

        return () => {
            document.title = originalTitle
            if (metaDesc) metaDesc.setAttribute('content', oldDesc)
            jsonLd.remove()
        }
    }, [article])

    if (!article) {
        return <Navigate to="/blog" replace />
    }

    // Find related articles (same category, excluding current)
    const related = blogArticles
        .filter(a => a.slug !== article.slug)
        .slice(0, 2)

    return (
        <div className="landing-theme min-h-screen bg-background text-foreground">
            <Navbar />

            <main className="pt-32 pb-20">
                <div className="mx-auto max-w-3xl px-6">
                    {/* Back button */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        <Link
                            to="/blog"
                            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Volver al blog
                        </Link>
                    </motion.div>

                    {/* Article Header */}
                    <motion.header
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        {/* Meta */}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                                <Tag className="w-3 h-3" />
                                {article.category}
                            </div>
                            <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                <span>{article.readTime} de lectura</span>
                            </div>
                            <span>
                                {new Date(article.date).toLocaleDateString('es-ES', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </span>
                        </div>

                        <h1 className="text-3xl font-bold text-foreground md:text-4xl leading-tight">
                            {article.title}
                        </h1>

                        <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                            {article.description}
                        </p>
                    </motion.header>

                    {/* Article Content */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="mt-12 prose prose-lg dark:prose-invert max-w-none
              prose-headings:text-foreground prose-headings:font-bold
              prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-6
              prose-h3:text-xl prose-h3:mt-10 prose-h3:mb-4
              prose-p:text-muted-foreground prose-p:leading-loose prose-p:mb-6
              prose-li:text-muted-foreground prose-li:mb-2
              prose-strong:text-foreground
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline
              prose-blockquote:border-primary/50 prose-blockquote:bg-primary/5 prose-blockquote:py-2 prose-blockquote:px-5 prose-blockquote:rounded-r-lg prose-blockquote:my-8
              prose-hr:border-border/50 prose-hr:my-10
              prose-ul:list-disc prose-ul:my-6 prose-ol:list-decimal prose-ol:my-6"
                        dangerouslySetInnerHTML={{ __html: renderMarkdown(article.content) }}
                    />

                    {/* CTA */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="mt-16 p-8 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-card text-center"
                    >
                        <h3 className="text-xl font-bold text-foreground">
                            ¿Listo para mejorar tu negocio?
                        </h3>
                        <p className="mt-2 text-muted-foreground">
                            Empieza a recoger feedback anónimo de tus clientes hoy mismo. Gratis.
                        </p>
                        <Link to="/register">
                            <Button size="lg" className="mt-6 bg-primary text-primary-foreground hover:bg-primary/90">
                                Crear cuenta gratis
                                <ArrowRight className="ml-2 w-4 h-4" />
                            </Button>
                        </Link>
                    </motion.div>

                    {/* Related Articles */}
                    {related.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.4 }}
                            className="mt-16"
                        >
                            <h3 className="text-lg font-bold text-foreground mb-6">
                                Artículos relacionados
                            </h3>
                            <div className="grid gap-6 sm:grid-cols-2">
                                {related.map(r => (
                                    <Link
                                        key={r.slug}
                                        to={`/blog/${r.slug}`}
                                        className="group rounded-xl border border-border/50 bg-card p-5 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
                                    >
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                                            <span className="text-2xl">{r.image}</span>
                                            <span>{r.category}</span>
                                        </div>
                                        <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                                            {r.title}
                                        </h4>
                                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                                            {r.description}
                                        </p>
                                    </Link>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    )
}

/** Simple markdown → HTML renderer (no external dep needed) */
function renderMarkdown(md: string): string {
    // 1️⃣ Normalizar indentación del template string
    const normalized = md
        .replace(/^\n/, '')
        .split('\n')
        .map(line => line.replace(/^\s+/, '')) // solo quitar espacios iniciales
        .join('\n');

    // 2️⃣ Separar por bloques reales
    const blocks = normalized.split(/\n{2,}/);

    return blocks.map(block => {
        const trimmed = block.trim();
        if (!trimmed) return '';

        // --- Horizontal rule ---
        if (trimmed === '---') return '<hr />';

        // --- Headings ---
        if (trimmed.startsWith('### ')) return `<h3>${inline(trimmed.slice(4))}</h3>`;
        if (trimmed.startsWith('## ')) return `<h2>${inline(trimmed.slice(3))}</h2>`;
        if (trimmed.startsWith('# ')) return `<h1>${inline(trimmed.slice(2))}</h1>`;

        const lines = trimmed.split('\n');

        // --- Unordered list ---
        if (lines.every(l => l.trim().startsWith('- '))) {
            const items = lines
                .map(l => `<li>${inline(l.trim().slice(2))}</li>`)
                .join('');
            return `<ul>${items}</ul>`;
        }

        // --- Ordered list ---
        if (lines.every(l => /^\d+\.\s/.test(l.trim()))) {
            const items = lines
                .map(l => `<li>${inline(l.trim().replace(/^\d+\.\s/, ''))}</li>`)
                .join('');
            return `<ol>${items}</ol>`;
        }

        // --- Paragraph ---
        return `<p>${inline(trimmed)}</p>`;
    }).join('\n');
}

/** Inline markdown: bold, italic, links */
function inline(text: string): string {
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}
