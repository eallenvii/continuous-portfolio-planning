import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, BarChart3, Languages, Target, TrendingUp } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header className="container mx-auto px-6 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-semibold text-slate-900" data-testid="text-brand-name">CPP</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" data-testid="link-header-login">Sign in</Button>
            </Link>
            <Link href="/signup">
              <Button data-testid="link-header-signup">Get Started</Button>
            </Link>
          </div>
        </nav>
      </header>

      <main>
        <section className="container mx-auto px-6 py-20 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl font-bold text-slate-900 leading-tight mb-6" data-testid="text-hero-title">
              Replace Hope-Based Planning with Reality-Based Commitment
            </h1>
            <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto" data-testid="text-hero-subtitle">
              Continuous Portfolio Planning bridges the gap between executive strategy and agile delivery, 
              translating T-shirt sizes into actionable commitments based on your team's actual velocity.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link href="/signup">
                <Button size="lg" className="gap-2" data-testid="button-hero-cta">
                  Start Planning Smarter
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" data-testid="button-hero-login">
                  Sign in
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-6 py-16">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 mb-4" data-testid="text-problem-title">
                The Language Gap That Derails Delivery
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Executives plan in "T-shirt sizes." Teams work in "story points." 
                These two languages don't translate—and that disconnect leads to overcommitment 
                and missed milestones.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-16">
              <Card className="border-red-100 bg-red-50/50">
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold text-red-900 mb-3">Hope-Based Planning</h3>
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

              <Card className="border-green-100 bg-green-50/50">
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold text-green-900 mb-3">Reality-Based Commitment</h3>
                  <ul className="space-y-2 text-green-800">
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">✓</span>
                      T-shirt sizes mapped to actual story points
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">✓</span>
                      Plans grounded in team velocity data
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">✓</span>
                      Sustainable commitments teams can deliver
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">✓</span>
                      Predictable outcomes that build confidence
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="bg-slate-50 py-16">
          <div className="container mx-auto px-6">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-slate-900 mb-4" data-testid="text-features-title">
                  How CPP Bridges the Gap
                </h2>
                <p className="text-lg text-slate-600">
                  The Sage of portfolio planning—providing clarity where there was chaos.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="h-12 w-12 rounded-lg bg-indigo-100 flex items-center justify-center mx-auto mb-4">
                      <Languages className="h-6 w-6 text-indigo-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Translate</h3>
                    <p className="text-slate-600">
                      Convert executive T-shirt sizes into story points your teams actually use
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="h-12 w-12 rounded-lg bg-indigo-100 flex items-center justify-center mx-auto mb-4">
                      <TrendingUp className="h-6 w-6 text-indigo-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Forecast</h3>
                    <p className="text-slate-600">
                      Plan across multiple increments with automatic epic rollover and capacity visualization
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="h-12 w-12 rounded-lg bg-indigo-100 flex items-center justify-center mx-auto mb-4">
                      <Target className="h-6 w-6 text-indigo-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Commit</h3>
                    <p className="text-slate-600">
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
            <h2 className="text-3xl font-bold text-slate-900 mb-4" data-testid="text-cta-title">
              Ready to Plan with Clarity?
            </h2>
            <p className="text-lg text-slate-600 mb-8">
              Join teams who've replaced guesswork with data-driven portfolio planning.
            </p>
            <Link href="/signup">
              <Button size="lg" className="gap-2" data-testid="button-footer-cta">
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 py-8">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-indigo-600 flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-medium text-slate-700">Continuous Portfolio Planning</span>
            </div>
            <p className="text-sm text-slate-500">
              Bridging strategy and agile delivery
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
