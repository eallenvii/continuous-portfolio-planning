import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Team, Project } from "@/lib/mockData";
import { Users, Zap, AlertTriangle, CheckCircle } from "lucide-react";

interface TeamCapacityProps {
  team: Team;
  projects: Project[];
}

export function TeamCapacity({ team, projects }: TeamCapacityProps) {
  // Calculate capacity for a Quarter (approx 13 weeks)
  const sprintsPerQuarter = 13 / team.sprintLengthWeeks;
  const quarterlyCapacity = team.velocity * sprintsPerQuarter;

  const assignedProjects = projects.filter(p => p.assignedTeamId === team.id);
  const allocatedPoints = assignedProjects.reduce((sum, p) => sum + p.estimatedPoints, 0);
  
  const utilization = (allocatedPoints / quarterlyCapacity) * 100;
  
  let statusColor = "bg-emerald-500";
  if (utilization > 85) statusColor = "bg-amber-500";
  if (utilization > 100) statusColor = "bg-red-500";

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-3">
          <img src={team.avatar} alt={team.name} className="w-10 h-10 rounded-full bg-gray-100" />
          <div>
            <CardTitle className="text-lg font-medium">{team.name}</CardTitle>
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Users className="w-3 h-3" /> {team.memberCount} members
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold flex items-center justify-end gap-1">
            <Zap className="w-5 h-5 text-yellow-500 fill-yellow-500" />
            {team.velocity}
          </div>
          <p className="text-xs text-muted-foreground">pts / sprint</p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Quarterly Capacity</span>
            <span className="font-medium">{Math.round(quarterlyCapacity)} pts</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Allocated</span>
            <span className={`font-medium ${utilization > 100 ? 'text-red-600' : ''}`}>
              {allocatedPoints} pts
            </span>
          </div>
          
          <div className="space-y-1 pt-2">
            <div className="flex justify-between text-xs">
              <span>Utilization</span>
              <span>{Math.round(utilization)}%</span>
            </div>
            <Progress value={utilization > 100 ? 100 : utilization} className={`h-2 ${statusColor}`} />
            {utilization > 100 && (
              <div className="flex items-center gap-1 text-xs text-red-600 mt-1 font-medium">
                <AlertTriangle className="w-3 h-3" />
                Overcommitted by {allocatedPoints - Math.round(quarterlyCapacity)} points
              </div>
            )}
            {utilization < 50 && (
              <div className="flex items-center gap-1 text-xs text-emerald-600 mt-1 font-medium">
                <CheckCircle className="w-3 h-3" />
                Healthy capacity available
              </div>
            )}
          </div>
        </div>

        <div className="mt-6">
          <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-3">Assigned Projects</h4>
          <div className="space-y-2">
            {assignedProjects.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No projects assigned</p>
            ) : (
              assignedProjects.map(project => (
                <div key={project.id} className="flex items-center justify-between text-sm bg-secondary/50 p-2 rounded-md border border-transparent hover:border-border transition-colors">
                  <span className="truncate max-w-[140px] font-medium">{project.name}</span>
                  <Badge variant="outline" className="ml-2 shrink-0">
                    {project.size} ({project.estimatedPoints})
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
