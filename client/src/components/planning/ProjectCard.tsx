import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Project, TShirtSize, SIZE_DEFINITIONS } from "@/lib/mockData";
import { ArrowRight, Calendar, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProjectCardProps {
  project: Project;
  onAssign?: (projectId: string, teamId: string) => void; // Simplified for now
}

const sizeColors: Record<TShirtSize, string> = {
  XS: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
  S: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
  M: "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800",
  L: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800",
  XL: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
};

export function ProjectCard({ project }: ProjectCardProps) {
  const sizeDef = SIZE_DEFINITIONS.find(s => s.size === project.size);

  return (
    <Card className="hover:shadow-md transition-all cursor-pointer group border-l-4 border-l-transparent hover:border-l-primary">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <Badge variant="outline" className={cn("font-mono", sizeColors[project.size])}>
            {project.size} • {project.estimatedPoints} pts
          </Badge>
          {project.assignedTeamId && (
             <Badge variant="secondary" className="text-xs">
                Assigned
             </Badge>
          )}
        </div>
        
        <h3 className="font-heading font-medium text-base mb-1 group-hover:text-primary transition-colors">
          {project.name}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {project.description}
        </p>

        <div className="flex items-center justify-between pt-2 border-t border-border/50 mt-2">
          <div className="flex items-center text-xs text-muted-foreground gap-2">
            {project.quarter ? (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" /> {project.quarter}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-600">
                <Briefcase className="w-3 h-3" /> Unplanned
              </span>
            )}
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1" />
        </div>
      </CardContent>
    </Card>
  );
}
