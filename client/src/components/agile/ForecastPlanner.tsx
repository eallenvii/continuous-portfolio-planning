import { useState } from "react";
import { Epic, TeamProfile, TShirtSize } from "@/lib/mockData";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, ArrowDown, ArrowUp, GripVertical, RefreshCw, Trash2, Undo2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface ForecastPlannerProps {
  team: TeamProfile;
  epics: Epic[];
  onUpdateEpics: (epics: Epic[]) => void;
  onDeleteEpic?: (epicId: string) => void;
}

export function ForecastPlanner({ team, epics, onUpdateEpics, onDeleteEpic }: ForecastPlannerProps) {
  const [draggedEpicId, setDraggedEpicId] = useState<string | null>(null);

  // Calculate Capacity
  const sprintCapacity = team.engineerCount * team.avgPointsPerEngineer;
  const totalCapacity = sprintCapacity * team.sprintsInIncrement;

  // Calculate Cumulative Points
  let cumulativePoints = 0;
  const epicsWithCumulative = epics.map(epic => {
    const mapping = team.sizeMappings.find(m => m.size === epic.currentSize);
    const points = mapping?.points || 0;
    cumulativePoints += points;
    
    return {
      ...epic,
      points,
      cumulativePoints,
      isAboveLine: cumulativePoints <= totalCapacity
    };
  });

  const percentUsed = (cumulativePoints / totalCapacity) * 100;

  // Handlers
  const handleSizeChange = (epicId: string, newSize: TShirtSize) => {
    const updated = epics.map(e => e.id === epicId ? { ...e, currentSize: newSize } : e);
    onUpdateEpics(updated);
  };

  const handleReset = (epicId: string) => {
     const updated = epics.map(e => e.id === epicId ? { ...e, currentSize: e.originalSize } : e);
     onUpdateEpics(updated);
  };

  const moveEpic = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === epics.length - 1) return;

    const newEpics = [...epics];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    [newEpics[index], newEpics[targetIndex]] = [newEpics[targetIndex], newEpics[index]];
    onUpdateEpics(newEpics);
  };

  // Drag and Drop Handlers (Simplified for HTML5 DnD)
  const onDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id);
    setDraggedEpicId(id);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    const draggedIndex = epics.findIndex(e => e.id === id);
    
    if (draggedIndex === -1 || draggedIndex === targetIndex) return;

    const newEpics = [...epics];
    const [removed] = newEpics.splice(draggedIndex, 1);
    newEpics.splice(targetIndex, 0, removed);
    
    onUpdateEpics(newEpics);
    setDraggedEpicId(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      
      {/* Capacity Header */}
      <Card className="border-l-4 border-l-primary bg-secondary/10">
        <CardContent className="pt-6">
          <div className="flex justify-between items-end mb-2">
            <div>
              <h3 className="text-lg font-heading font-semibold">Increment Capacity Usage</h3>
              <p className="text-sm text-muted-foreground">
                {cumulativePoints} / {totalCapacity} Points based on {team.name} profile
              </p>
            </div>
            <div className={`text-2xl font-bold ${percentUsed > 100 ? 'text-destructive' : 'text-primary'}`}>
              {Math.round(percentUsed)}%
            </div>
          </div>
          <Progress 
            value={percentUsed > 100 ? 100 : percentUsed} 
            className={`h-3 ${percentUsed > 100 ? 'bg-destructive/20' : ''}`} 
          />
          {percentUsed > 100 && (
             <div className="flex items-center gap-2 mt-2 text-destructive text-sm font-medium">
                <AlertCircle className="w-4 h-4" />
                Capacity exceeded by {cumulativePoints - totalCapacity} points. Move items below the line.
             </div>
          )}
        </CardContent>
      </Card>

      {/* Epics List */}
      <div className="space-y-0">
        <div className="flex items-center justify-between px-4 py-2 text-sm text-muted-foreground font-medium uppercase tracking-wider">
           <div className="w-8"></div>
           <div className="flex-1">Epic / Initiative</div>
           <div className="w-32 text-center">Size</div>
           <div className="w-24 text-right">Points</div>
           <div className="w-24 text-center">Actions</div>
        </div>

        {epicsWithCumulative.map((epic, index) => {
          // Render "The Line"
          const showLine = epic.isAboveLine && epicsWithCumulative[index + 1] && !epicsWithCumulative[index + 1].isAboveLine;
          
          return (
            <div key={epic.id}>
              <div 
                draggable
                onDragStart={(e) => onDragStart(e, epic.id)}
                onDragOver={onDragOver}
                onDrop={(e) => onDrop(e, index)}
                className={`
                  group relative flex items-center gap-4 p-4 mb-2 rounded-lg border transition-all
                  ${epic.isAboveLine 
                    ? 'bg-card border-border hover:border-primary/50 shadow-sm' 
                    : 'bg-secondary/30 border-dashed border-border opacity-75 grayscale-[0.5]'}
                  ${draggedEpicId === epic.id ? 'opacity-50 border-primary' : ''}
                `}
              >
                {/* Drag Handle */}
                <div className="w-8 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
                  <GripVertical className="w-5 h-5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-base truncate">{epic.title}</h4>
                    {epic.originalSize !== epic.currentSize && (
                      <Badge variant="outline" className="text-xs text-amber-600 border-amber-200 bg-amber-50">
                        Modified
                      </Badge>
                    )}
                    <Badge variant="secondary" className="text-[10px] uppercase">{epic.source}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{epic.description}</p>
                </div>

                {/* Size Selector */}
                <div className="w-32">
                  <Select 
                    value={epic.currentSize} 
                    onValueChange={(val: TShirtSize) => handleSizeChange(epic.id, val)}
                  >
                    <SelectTrigger className={`h-8 font-mono font-medium ${epic.originalSize !== epic.currentSize ? 'border-amber-400 text-amber-700' : ''}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {team.sizeMappings.map(m => (
                        <SelectItem key={m.size} value={m.size}>
                          <span className="font-mono font-bold mr-2">{m.size}</span>
                          <span className="text-muted-foreground text-xs">({m.points} pts)</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Points Display */}
                <div className="w-24 text-right font-mono font-medium">
                  {epic.points} pts
                </div>

                {/* Actions */}
                <div className="w-28 flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {epic.originalSize !== epic.currentSize && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-600" onClick={() => handleReset(epic.id)} title="Reset Size">
                      <Undo2 className="w-4 h-4" />
                    </Button>
                  )}
                  <div className="flex flex-col gap-0.5">
                     <Button variant="ghost" size="icon" className="h-4 w-8" onClick={() => moveEpic(index, 'up')}>
                        <ArrowUp className="w-3 h-3" />
                     </Button>
                     <Button variant="ghost" size="icon" className="h-4 w-8" onClick={() => moveEpic(index, 'down')}>
                        <ArrowDown className="w-3 h-3" />
                     </Button>
                  </div>
                  {onDeleteEpic && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive hover:text-destructive" 
                      onClick={() => onDeleteEpic(epic.id)}
                      title="Delete Epic"
                      data-testid={`button-delete-epic-${epic.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* The Cut Line Indicator */}
              {showLine && (
                <div className="relative py-6 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t-2 border-dashed border-red-500/50"></div>
                  </div>
                  <div className="relative bg-background px-4 text-red-500 font-bold text-xs uppercase tracking-widest border border-red-200 rounded-full py-1 shadow-sm">
                    Capacity Cut Line
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Dynamic Fallback Line if capacity is completely full or empty */}
        {percentUsed <= 100 && epics.length > 0 && epicsWithCumulative[epics.length-1].isAboveLine && (
           <div className="py-8 text-center text-sm text-muted-foreground italic">
              All items fit within capacity! 🎉
           </div>
        )}
      </div>
    </div>
  );
}
