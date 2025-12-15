import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Languages, Target, TrendingUp } from "lucide-react";
import cppLogo from "@assets/Gemini_Generated_Image_eyajzweyajzweyaj_1765756904439.png";

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#F4F8F8]">
      <header className="container mx-auto px-6 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={cppLogo} alt="CPP Logo" className="h-12 w-auto" />
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="text-[#0A3062] hover:text-[#0A3062]/80" data-testid="link-header-login">
                Sign in
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-[#F2C94C] text-[#0A3062] hover:bg-[#F2C94C]/90 font-semibold" data-testid="link-header-signup">
                Get Started
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      <main>
        <section className="container mx-auto px-6 py-16 text-center">
          <div className="max-w-4xl mx-auto">
            <p className="text-[#687C99] uppercase tracking-wider text-sm font-medium mb-4">
              Portfolio / PMO ↔ Agile Teams
            </p>
            <h1 className="text-5xl font-bold text-[#0A3062] leading-tight mb-4 font-heading" data-testid="text-hero-title">
              Portfolio FlowOps
            </h1>
            <p className="text-2xl text-[#687C99] mb-2 italic">
              Translating Strategy into Agile Reality.
            </p>
            <p className="text-lg text-[#687C99] mb-8 max-w-2xl mx-auto mt-6" data-testid="text-hero-subtitle">
              Replace hope-based planning with reality-based commitment. We bridge the gap between 
              executive T-shirt sizes and team story points using your actual velocity data.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link href="/signup">
                <Button size="lg" className="gap-2 bg-[#0A3062] hover:bg-[#0A3062]/90 text-white font-semibold px-8" data-testid="button-hero-cta">
                  Start Planning Smarter
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="border-[#0A3062] text-[#0A3062] hover:bg-[#0A3062]/5" data-testid="button-hero-login">
                  Sign in
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-6 py-16">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-[#0A3062] mb-4 font-heading" data-testid="text-problem-title">
                The Language Gap That Derails Delivery
              </h2>
              <p className="text-lg text-[#687C99] max-w-2xl mx-auto">
                Executives plan in "T-shirt sizes." Teams work in "story points." 
                These two languages don't translate—and that disconnect leads to overcommitment 
                and missed milestones.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-16">
              <Card className="border-red-200 bg-red-50/50">
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold text-red-900 mb-3 font-heading">Hope-Based Planning</h3>
                  <ul className="space-y-2 text-red-800">
                    <li className="flex items-start gap-2">
                      <span className="text-red-400 mt-1">×</span>
                      Vague estimates disconnected from reality
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-400 mt-1">×</span>
                      Plans made without historical data
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-400 mt-1">×</span>
                      Chronic overcommitment and burnout
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-400 mt-1">×</span>
                      Missed milestones and eroded trust
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-[#0A3062]/20 bg-[#0A3062]/5">
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold text-[#0A3062] mb-3 font-heading">Reality-Based Commitment</h3>
                  <ul className="space-y-2 text-[#0A3062]">
                    <li className="flex items-start gap-2">
                      <span className="text-[#F2C94C] mt-1 font-bold">✓</span>
                      T-shirt sizes mapped to actual story points
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#F2C94C] mt-1 font-bold">✓</span>
                      Plans grounded in team velocity data
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#F2C94C] mt-1 font-bold">✓</span>
                      Sustainable commitments teams can deliver
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#F2C94C] mt-1 font-bold">✓</span>
                      Predictable outcomes that build confidence
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="bg-white py-16">
          <div className="container mx-auto px-6">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-[#0A3062] mb-4 font-heading" data-testid="text-features-title">
                  How Portfolio FlowOps Bridges the Gap
                </h2>
                <p className="text-lg text-[#687C99]">
                  The Sage of portfolio planning—providing clarity where there was chaos.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                <Card className="border-[#0A3062]/10">
                  <CardContent className="pt-6 text-center">
                    <div className="h-12 w-12 rounded-lg bg-[#F2C94C]/20 flex items-center justify-center mx-auto mb-4">
                      <Languages className="h-6 w-6 text-[#0A3062]" />
                    </div>
                    <h3 className="text-lg font-semibold text-[#0A3062] mb-2 font-heading">Translate</h3>
                    <p className="text-[#687C99]">
                      Convert executive T-shirt sizes into story points your teams actually use
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-[#0A3062]/10">
                  <CardContent className="pt-6 text-center">
                    <div className="h-12 w-12 rounded-lg bg-[#F2C94C]/20 flex items-center justify-center mx-auto mb-4">
                      <TrendingUp className="h-6 w-6 text-[#0A3062]" />
                    </div>
                    <h3 className="text-lg font-semibold text-[#0A3062] mb-2 font-heading">Forecast</h3>
                    <p className="text-[#687C99]">
                      Plan across multiple increments with automatic epic rollover and capacity visualization
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-[#0A3062]/10">
                  <CardContent className="pt-6 text-center">
                    <div className="h-12 w-12 rounded-lg bg-[#F2C94C]/20 flex items-center justify-center mx-auto mb-4">
                      <Target className="h-6 w-6 text-[#0A3062]" />
                    </div>
                    <h3 className="text-lg font-semibold text-[#0A3062] mb-2 font-heading">Commit</h3>
                    <p className="text-[#687C99]">
                      Make realistic promises based on historical velocity, not wishful thinking
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-6 py-20">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-[#0A3062] mb-4 font-heading" data-testid="text-cta-title">
              Ready to Plan with Clarity?
            </h2>
            <p className="text-lg text-[#687C99] mb-8">
              Join teams who've replaced guesswork with data-driven portfolio planning.
            </p>
            <Link href="/signup">
              <Button size="lg" className="gap-2 bg-[#F2C94C] text-[#0A3062] hover:bg-[#F2C94C]/90 font-semibold px-8" data-testid="button-footer-cta">
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#0A3062]/10 py-8 bg-white">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={cppLogo} alt="CPP" className="h-8 w-auto" />
              <span className="text-sm font-medium text-[#0A3062]">Portfolio FlowOps</span>
            </div>
            <p className="text-sm text-[#687C99]">
              Translating Strategy into Agile Reality
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
