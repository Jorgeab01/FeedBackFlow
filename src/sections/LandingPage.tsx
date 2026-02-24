import { Navbar } from "@/components/landing/navbar"
import { Hero } from "@/components/landing/hero"
import { DashboardPreview } from "@/components/landing/dashboard-preview"
import { Stats } from "@/components/landing/stats"
import { Features } from "@/components/landing/features"
import { HowItWorks } from "@/components/landing/how-it-works"
import { Testimonials } from "@/components/landing/testimonials"
import { Pricing } from "@/components/landing/pricing"
import { CTA } from "@/components/landing/cta"
import { Footer } from "@/components/landing/footer"

import { ThemeToggle } from '@/components/ThemeToggle';
import { useTheme } from '@/hooks/useTheme';

export function LandingPage({ themeProps }: { themeProps: { theme: ReturnType<typeof useTheme>['theme']; setTheme: ReturnType<typeof useTheme>['setTheme'] } }) {
    return (
        <div className="landing-theme min-h-screen bg-background text-foreground">
            {/* Theme Toggle in top right */}
            <div className="fixed top-4 right-4 z-[60]">
                <ThemeToggle theme={themeProps.theme} setTheme={themeProps.setTheme} />
            </div>

            <Navbar />
            <main>
                <Hero />
                <DashboardPreview />
                <Stats />
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
