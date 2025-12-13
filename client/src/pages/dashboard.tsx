import { useState } from "react";
import { TeamProfile, Epic, MOCK_TEAM, MOCK_EPICS } from "@/lib/mockData";
import { TeamProfileSettings } from "@/components/agile/TeamProfileSettings";
import { ForecastPlanner } from "@/components/agile/ForecastPlanner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, BarChart3, Presentation, RefreshCcw, HelpCircle } from "lucide-react";
import { LandingPage } from "@/components/LandingPage";
import { toast } from "@/hooks/use-toast";

export default function Dashboard() {
  const [showLanding, setShowLanding] = useState(true);
  const [team, setTeam] = useState<TeamProfile>(MOCK_TEAM);
  const [epics, setEpics] = useState<Epic[]>(MOCK_EPICS);

  const resetDemo = () => {
    setTeam(MOCK_TEAM);
    setEpics(MOCK_EPICS);
    toast({
      title: "Demo Reset",
      description: "Data has been restored to original state.",
    });
  };

  const syncTools = () => {
    toast({
      title: "Syncing...",
      description: "Fetching latest data from Jira & Trello (Mock)",
    });
    setTimeout(() => {
        toast({
            title: "Sync Complete",
            description: "2 new stories found. No impact to forecast.",
            variant: "default"
        });
    }, 1000);
  };

  if (showLanding) {
    return <LandingPage onStart={() => setShowLanding(false)} />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Navigation */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5 text-white">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
               </svg>
            </div>
            <span className="font-heading font-bold text-lg hidden md:inline-block">AgilePortfolio</span>
            <div className="h-6 w-px bg-border mx-2"></div>
            <div className="flex items-center gap-2 text-sm font-medium">
               <img src={team.avatar} className="w-6 h-6 rounded-full bg-secondary" />
               {team.name}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={syncTools} className="gap-2 hidden md:flex">
              <RefreshCcw className="w-4 h-4" /> Sync Tools
            </Button>
            <Button variant="ghost" size="sm" onClick={resetDemo} className="text-muted-foreground hover:text-destructive gap-2">
              <RefreshCcw className="w-4 h-4" /> Reset Demo
            </Button>
            <Button variant="secondary" size="sm" className="gap-2">
              <HelpCircle className="w-4 h-4" /> Assist
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <Tabs defaultValue="forecast" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="profile" className="gap-2"><Settings className="w-4 h-4" /> Team Profile</TabsTrigger>
              <TabsTrigger value="forecast" className="gap-2"><BarChart3 className="w-4 h-4" /> Forecast</TabsTrigger>
              <TabsTrigger value="retro" className="gap-2"><Presentation className="w-4 h-4" /> Retro</TabsTrigger>
            </TabsList>
            
            <div className="text-sm text-muted-foreground hidden md:block">
               Planning Increment: <span className="font-semibold text-foreground">Q3 2024</span>
            </div>
          </div>

          <TabsContent value="profile" className="outline-none">
             <div className="mb-6">
                <h2 className="text-2xl font-heading font-bold">Team Configuration</h2>
                <p className="text-muted-foreground">Establish the baseline velocity and T-shirt size translation for {team.name}.</p>
             </div>
             <TeamProfileSettings team={team} onUpdate={setTeam} />
          </TabsContent>

          <TabsContent value="forecast" className="outline-none">
             <div className="mb-6 flex justify-between items-end">
                <div>
                   <h2 className="text-2xl font-heading font-bold">Commitment Forecast</h2>
                   <p className="text-muted-foreground">Drag and drop epics to prioritize. Items below the red line are at risk.</p>
                </div>
                <div className="flex gap-2">
                   <Button size="sm" onClick={() => {
                      const newEpic: Epic = {
                         id: `temp-${Date.now()}`,
                         title: "New Template Epic",
                         description: "Placeholder for future work",
                         originalSize: "M",
                         currentSize: "M",
                         status: "backlog",
                         source: "Template",
                         isTemplate: true
                      };
                      setEpics([newEpic, ...epics]);
                   }}>
                      + Add Template Epic
                   </Button>
                </div>
             </div>
             <ForecastPlanner team={team} epics={epics} onUpdateEpics={setEpics} />
          </TabsContent>

          <TabsContent value="retro" className="outline-none">
             <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed rounded-xl bg-secondary/10">
                <Presentation className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Retrospective Mode</h3>
                <p className="text-muted-foreground max-w-md mb-6">
                   This module compares actual delivered story points against the estimated T-shirt sizes to suggest calibration changes for the Team Profile.
                </p>
                <Button disabled>Coming Soon in Mockup</Button>
             </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
