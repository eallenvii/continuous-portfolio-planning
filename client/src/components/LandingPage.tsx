import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LandingPage({ onStart }: { onStart: () => void }) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
      <div className="max-w-2xl space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="space-y-2">
          <div className="mx-auto w-16 h-16 bg-primary rounded-xl flex items-center justify-center mb-6 shadow-xl shadow-primary/20">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-8 h-8 text-white">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
            </svg>
          </div>
          <h1 className="text-4xl md:text-6xl font-heading font-bold tracking-tight text-foreground">
            Agile<span className="text-primary">Portfolio</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Bridge the gap between Agile Story Points and Portfolio T-Shirt Sizes.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 text-left">
          <div className="p-6 rounded-xl bg-card border shadow-sm">
            <h3 className="font-semibold text-lg mb-2">For Agile Teams</h3>
            <p className="text-sm text-muted-foreground">
              Maintain autonomy and use story points. We map your historical velocity to business milestones automatically.
            </p>
          </div>
          <div className="p-6 rounded-xl bg-card border shadow-sm">
            <h3 className="font-semibold text-lg mb-2">For Portfolio Managers</h3>
            <p className="text-sm text-muted-foreground">
              Plan in T-Shirt sizes and confidence intervals. See "Above/Below the line" forecasts instantly.
            </p>
          </div>
        </div>

        <div className="pt-8">
           <Button size="lg" className="text-lg px-8 h-12 shadow-lg shadow-primary/25" onClick={onStart}>
             Enter Demo Environment
           </Button>
           <p className="text-xs text-muted-foreground mt-4">
             Mockup Mode • No Backend Required • Local Data Reset
           </p>
        </div>
      </div>
    </div>
  );
}
