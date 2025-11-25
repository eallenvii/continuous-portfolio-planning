import { useState } from "react";
import { MOCK_PROJECTS, MOCK_TEAMS, Project } from "@/lib/mockData";
import { TeamCapacity } from "@/components/planning/TeamCapacity";
import { ProjectCard } from "@/components/planning/ProjectCard";
import { SizeLegend } from "@/components/planning/SizeLegend";
import { Button } from "@/components/ui/button";
import { Plus, LayoutGrid, List, Settings, Zap } from "lucide-react";

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const backlogProjects = projects.filter(p => !p.assignedTeamId);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <nav className="border-b border-border sticky top-0 bg-background/80 backdrop-blur-md z-10">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5 text-white">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
               </svg>
            </div>
            <span className="font-heading font-bold text-xl tracking-tight">AgilePortfolio</span>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              Q2 2024 Planning
            </Button>
            <div className="h-4 w-px bg-border"></div>
            <Button variant="outline" size="sm" className="gap-2">
              <Settings className="w-4 h-4" />
              Configuration
            </Button>
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              New Project
            </Button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-8">
          
          {/* Left Column: Backlog & Legend */}
          <div className="col-span-3 space-y-6">
            <SizeLegend />
            
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-semibold text-lg">Project Backlog</h3>
                <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-full">
                  {backlogProjects.length} items
                </span>
              </div>
              <div className="space-y-3">
                {backlogProjects.map(project => (
                  <ProjectCard key={project.id} project={project} />
                ))}
                {backlogProjects.length === 0 && (
                  <div className="text-center py-8 border-2 border-dashed border-border rounded-lg text-muted-foreground text-sm">
                    No backlog items.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Team Capacity Planning */}
          <div className="col-span-9">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-heading text-2xl font-bold">Quarterly Capacity Planning</h2>
                <p className="text-muted-foreground mt-1">
                  Drag and drop backlog items to teams to estimate load against historical velocity.
                </p>
              </div>
              <div className="flex bg-secondary rounded-lg p-1">
                <Button 
                  variant={viewMode === 'grid' ? 'default' : 'ghost'} 
                  size="sm" 
                  className="h-8 shadow-none"
                  onClick={() => setViewMode('grid')}
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
                <Button 
                  variant={viewMode === 'list' ? 'default' : 'ghost'} 
                  size="sm" 
                  className="h-8 shadow-none"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {MOCK_TEAMS.map(team => (
                <TeamCapacity 
                  key={team.id} 
                  team={team} 
                  projects={projects} 
                />
              ))}
            </div>
            
            {/* Hint/CTA area */}
            <div className="mt-12 p-6 bg-primary/5 rounded-xl border border-primary/10 flex items-start gap-4">
               <div className="bg-primary/10 p-3 rounded-full shrink-0">
                 <Zap className="w-6 h-6 text-primary" />
               </div>
               <div>
                 <h4 className="font-heading font-semibold text-primary mb-1">Why "T-Shirt Sizes"?</h4>
                 <p className="text-sm text-muted-foreground max-w-2xl">
                   By using T-Shirt sizes (S, M, L, XL) backed by historical point data, we protect Agile teams from arbitrary deadlines while giving Portfolio Managers the forecasting tools they need. This abstraction layer allows teams to own their execution while business owns the priority.
                 </p>
               </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
