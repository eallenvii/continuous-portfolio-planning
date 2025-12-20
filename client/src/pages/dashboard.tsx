import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TeamProfile, Epic, TShirtSize } from "@/lib/mockData";
import { TeamProfileSettings } from "@/components/agile/TeamProfileSettings";
import { ForecastPlanner } from "@/components/agile/ForecastPlanner";
import { EpicManagement } from "@/components/agile/EpicManagement";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, BarChart3, Presentation, RefreshCcw, HelpCircle, Loader2 } from "lucide-react";
import { LandingPage } from "@/components/LandingPage";
import { toast } from "@/hooks/use-toast";
import * as api from "@/lib/api";
import type { Team as DBTeam, Epic as DBEpic, SizeMapping as DBSizeMapping } from "@shared/schema";

export default function Dashboard() {
  const [showLanding, setShowLanding] = useState(true);
  const [currentTeamId, setCurrentTeamId] = useState<number | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const queryClient = useQueryClient();

  // Check for existing demo session on mount
  useEffect(() => {
    const checkExistingSession = async () => {
      const session = await api.getDemoSession();
      if (session) {
        setIsDemoMode(true);
        setCurrentTeamId(session.team.id);
        setShowLanding(false);
      }
    };
    checkExistingSession();
  }, []);

  // Fetch teams (demo or regular)
  const { data: teams, isLoading: teamsLoading } = useQuery({
    queryKey: ['teams', isDemoMode],
    queryFn: isDemoMode ? api.getDemoTeams : api.getTeams,
    enabled: !showLanding,
  });

  // Set initial team ID
  useEffect(() => {
    if (teams && teams.length > 0 && !currentTeamId) {
      setCurrentTeamId(teams[0].id);
    }
  }, [teams, currentTeamId]);

  // Fetch team data (demo or regular)
  const { data: dbTeam } = useQuery({
    queryKey: ['team', currentTeamId, isDemoMode],
    queryFn: () => isDemoMode ? api.getDemoTeam(currentTeamId!) : api.getTeam(currentTeamId!),
    enabled: !!currentTeamId && !showLanding,
  });

  // Fetch size mappings (demo or regular)
  const { data: sizeMappings } = useQuery({
    queryKey: ['sizeMappings', currentTeamId, isDemoMode],
    queryFn: () => isDemoMode ? api.getDemoSizeMappings(currentTeamId!) : api.getSizeMappings(currentTeamId!),
    enabled: !!currentTeamId && !showLanding,
  });

  // Fetch epics (demo or regular)
  const { data: dbEpics } = useQuery({
    queryKey: ['epics', currentTeamId, isDemoMode],
    queryFn: () => isDemoMode ? api.getDemoEpics(currentTeamId!) : api.getEpics(currentTeamId!),
    enabled: !!currentTeamId && !showLanding,
  });

  // Transform DB data to frontend format
  const team: TeamProfile | null = dbTeam && sizeMappings ? {
    id: dbTeam.id.toString(),
    name: dbTeam.name,
    avatar: dbTeam.avatar,
    engineerCount: dbTeam.engineerCount,
    avgPointsPerEngineer: dbTeam.avgPointsPerEngineer,
    sprintLengthWeeks: dbTeam.sprintLengthWeeks,
    sprintsInIncrement: dbTeam.sprintsInIncrement,
    sizeMappings: sizeMappings.map(m => ({
      size: m.size as TShirtSize,
      points: m.points,
      confidence: m.confidence,
      anchorDescription: m.anchorDescription,
    })),
  } : null;

  const epics: Epic[] = dbEpics ? dbEpics
    .sort((a, b) => a.priority - b.priority)
    .map(e => ({
      id: e.id.toString(),
      title: e.title,
      description: e.description,
      originalSize: e.originalSize as TShirtSize,
      currentSize: e.currentSize as TShirtSize,
      status: e.status as 'backlog' | 'in-progress' | 'completed',
      source: e.source as 'Jira' | 'Trello' | 'Template',
      isTemplate: e.isTemplate || false,
    })) : [];

  // Mutations (use demo or regular based on mode)
  const updateTeamMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<DBTeam> }) => 
      isDemoMode ? api.updateDemoTeam(id, data) : api.updateTeam(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', currentTeamId, isDemoMode] });
      toast({ title: "Team profile updated" });
    },
  });

  const updateSizeMappingsMutation = useMutation({
    mutationFn: ({ teamId, mappings }: { teamId: number; mappings: Array<Omit<DBSizeMapping, "id" | "teamId">> }) => 
      isDemoMode ? api.updateDemoSizeMappings(teamId, mappings) : api.updateSizeMappings(teamId, mappings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sizeMappings', currentTeamId, isDemoMode] });
      toast({ title: "Size mappings updated" });
    },
  });

  const updateEpicMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<DBEpic> }) => 
      isDemoMode ? api.updateDemoEpic(id, data) : api.updateEpic(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['epics', currentTeamId, isDemoMode] });
    },
  });

  const reorderEpicsMutation = useMutation({
    mutationFn: ({ teamId, epicIds }: { teamId: number; epicIds: number[] }) => 
      isDemoMode ? api.reorderDemoEpics(teamId, epicIds) : api.reorderEpics(teamId, epicIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['epics', currentTeamId, isDemoMode] });
    },
  });

  const createEpicMutation = useMutation({
    mutationFn: ({ teamId, epic }: { teamId: number; epic: Partial<DBEpic> }) => 
      isDemoMode ? api.createDemoEpic(teamId, epic) : api.createEpic(teamId, epic),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['epics', currentTeamId, isDemoMode] });
      toast({ title: "Epic created" });
    },
  });

  const deleteEpicMutation = useMutation({
    mutationFn: (id: number) => isDemoMode ? api.deleteDemoEpic(id) : api.deleteEpic(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['epics', currentTeamId, isDemoMode] });
      toast({ title: "Epic deleted" });
    },
  });

  // Create new demo session (resets demo for this user)
  const resetDemoMutation = useMutation({
    mutationFn: async () => {
      if (isDemoMode) {
        await api.deleteDemoSession();
      }
      return api.createDemoSession();
    },
    onSuccess: (data) => {
      setIsDemoMode(true);
      setCurrentTeamId(data.team.id);
      queryClient.invalidateQueries({ queryKey: ['teams', true] });
      queryClient.invalidateQueries({ queryKey: ['team', data.team.id, true] });
      queryClient.invalidateQueries({ queryKey: ['sizeMappings', data.team.id, true] });
      queryClient.invalidateQueries({ queryKey: ['epics', data.team.id, true] });
      toast({
        title: "Demo Reset",
        description: "Your demo data has been restored to original state.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reset demo data.",
        variant: "destructive",
      });
    },
  });

  const handleTeamUpdate = (updatedTeam: TeamProfile) => {
    if (!currentTeamId) return;

    const teamChanges = {
      name: updatedTeam.name,
      avatar: updatedTeam.avatar,
      engineer_count: updatedTeam.engineerCount,
      avg_points_per_engineer: updatedTeam.avgPointsPerEngineer,
      sprint_length_weeks: updatedTeam.sprintLengthWeeks,
      sprints_in_increment: updatedTeam.sprintsInIncrement,
    };

    const sizeMappingChanges = updatedTeam.sizeMappings.map(m => ({
      size: m.size,
      points: m.points,
      confidence: m.confidence,
      anchor_description: m.anchorDescription,
    }));

    updateTeamMutation.mutate({ id: currentTeamId, data: teamChanges });
    updateSizeMappingsMutation.mutate({ teamId: currentTeamId, mappings: sizeMappingChanges });
  };

  const handleEpicsUpdate = (updatedEpics: Epic[]) => {
    if (!currentTeamId || !dbEpics) return;

    const epicIds = updatedEpics.map(e => parseInt(e.id));
    reorderEpicsMutation.mutate({ teamId: currentTeamId, epicIds });

    updatedEpics.forEach((epic, idx) => {
      const dbEpic = dbEpics.find(e => e.id === parseInt(epic.id));
      if (dbEpic && (dbEpic.currentSize !== epic.currentSize || dbEpic.priority !== idx)) {
        updateEpicMutation.mutate({
          id: parseInt(epic.id),
          data: {
            currentSize: epic.currentSize,
            priority: idx,
          },
        });
      }
    });
  };

  const handleCreateEpic = (epic: {
    title: string;
    description: string;
    originalSize: TShirtSize;
    currentSize: TShirtSize;
    source: 'Jira' | 'Trello' | 'Template';
    isTemplate?: boolean;
  }) => {
    if (!currentTeamId) return;
    createEpicMutation.mutate({
      teamId: currentTeamId,
      epic: {
        ...epic,
        status: 'backlog',
        priority: 0,
      },
    });
  };

  const handleImportEpics = async (epicsToImport: Array<{
    title: string;
    description: string;
    originalSize: TShirtSize;
    currentSize: TShirtSize;
    source: 'Jira' | 'Trello' | 'Template';
  }>) => {
    if (!currentTeamId) return;
    
    const createFn = isDemoMode ? api.createDemoEpic : api.createEpic;
    for (let i = 0; i < epicsToImport.length; i++) {
      await createFn(currentTeamId, {
        ...epicsToImport[i],
        status: 'backlog',
        priority: i,
      });
    }
    
    queryClient.invalidateQueries({ queryKey: ['epics', currentTeamId, isDemoMode] });
    toast({ 
      title: "Import complete", 
      description: `Successfully imported ${epicsToImport.length} epics` 
    });
  };

  // Handle landing page "Try Demo" click
  const handleStartDemo = async () => {
    setIsCreatingSession(true);
    try {
      const session = await api.createDemoSession();
      setIsDemoMode(true);
      setCurrentTeamId(session.team.id);
      setShowLanding(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start demo session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingSession(false);
    }
  };

  const handleDeleteEpic = (epicId: string) => {
    deleteEpicMutation.mutate(parseInt(epicId));
  };

  const resetDemo = () => {
    resetDemoMutation.mutate();
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
    return <LandingPage onStart={handleStartDemo} isLoading={isCreatingSession} />;
  }

  if (teamsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading team data...</p>
        </div>
      </div>
    );
  }

  if (!teams || teams.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-heading font-bold mb-2">Welcome to Portfolio FlowOps</h2>
          <p className="text-muted-foreground mb-6">
            Get started by loading demo data to see how we help you forecast team capacity and prioritize epics.
          </p>
          <Button 
            onClick={resetDemo} 
            disabled={resetDemoMutation.isPending}
            data-testid="button-init-demo"
            size="lg"
          >
            {resetDemoMutation.isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Initializing...</>
            ) : (
              <>Initialize Demo Data</>
            )}
          </Button>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading team data...</p>
        </div>
      </div>
    );
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
            <span className="font-heading font-bold text-lg hidden md:inline-block">Continuous Portfolio Planning</span>
            <div className="h-6 w-px bg-border mx-2"></div>
            <div className="flex items-center gap-2 text-sm font-medium">
               <img src={team.avatar} className="w-6 h-6 rounded-full bg-secondary" />
               {team.name}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={syncTools} 
              className="gap-2 hidden md:flex"
              data-testid="button-sync"
            >
              <RefreshCcw className="w-4 h-4" /> Sync Tools
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={resetDemo} 
              className="text-muted-foreground hover:text-destructive gap-2"
              data-testid="button-reset-demo"
              disabled={resetDemoMutation.isPending}
            >
              {resetDemoMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
              {' '}Reset Demo
            </Button>
            <Button 
              variant="secondary" 
              size="sm" 
              className="gap-2"
              data-testid="button-assist"
            >
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
             <TeamProfileSettings team={team} onUpdate={handleTeamUpdate} />
          </TabsContent>

          <TabsContent value="forecast" className="outline-none">
             <div className="mb-6 flex justify-between items-end">
                <div>
                   <h2 className="text-2xl font-heading font-bold">Commitment Forecast</h2>
                   <p className="text-muted-foreground">Drag and drop epics to prioritize. Items below the red line are at risk.</p>
                </div>
                <div className="flex gap-2">
                   <EpicManagement 
                     onCreateEpic={handleCreateEpic}
                     onImportEpics={handleImportEpics}
                     isLoading={createEpicMutation.isPending}
                   />
                </div>
             </div>
             <ForecastPlanner 
               team={team} 
               epics={epics} 
               onUpdateEpics={handleEpicsUpdate}
               onDeleteEpic={handleDeleteEpic}
             />
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

      <footer className="border-t bg-card/30 py-4" data-testid="footer-copyright">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} IdeaCanvas. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
