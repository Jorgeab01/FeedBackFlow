// LandingPage.tsx - Versión limpia
import { Navbar } from "@/components/landing/navbar"
import { Hero } from "@/components/landing/hero"
import { DashboardPreview } from "@/components/landing/dashboard-preview"
import { Features } from "@/components/landing/features"
import { HowItWorks } from "@/components/landing/how-it-works"
import { Testimonials } from "@/components/landing/testimonials"
import { Pricing } from "@/components/landing/pricing"
import { CTA } from "@/components/landing/cta"
import { Footer } from "@/components/landing/footer"

export function LandingPage() {
    return (
        <div className="landing-theme min-h-screen bg-background text-foreground overflow-x-hidden">
            <Navbar />
            <main className="overflow-x-hidden">
                <Hero />
                <DashboardPreview />
                <Features />
                <HowItWorks />
                <Testimonials />
                <Pricing />
                <CTA />
            </main>
            <Footer />
        </div>
    )
}