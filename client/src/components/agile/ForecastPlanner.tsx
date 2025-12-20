import { useState } from "react";
import { Epic, TeamProfile, TShirtSize } from "@/lib/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { AlertCircle, ArrowDown, ArrowUp, ChevronLeft, ChevronRight, GripVertical, Pencil, Trash2, Undo2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface PlanningWindow {
  id: string;
  label: string;
  epics: EpicWithPoints[];
  totalPoints: number;
  capacity: number;
}

interface EpicWithPoints extends Epic {
  points: number;
  cumulativePoints: number;
  isAboveLine: boolean;
}

interface ForecastPlannerProps {
  team: TeamProfile;
  epics: Epic[];
  onUpdateEpics: (epics: Epic[]) => void;
  onDeleteEpic?: (epicId: string) => void;
}

const generateWindowLabels = (startQuarter: number, startYear: number, count: number): string[] => {
  const labels: string[] = [];
  let q = startQuarter;
  let y = startYear;
  for (let i = 0; i < count; i++) {
    labels.push(`Q${q} ${y}`);
    q++;
    if (q > 4) {
      q = 1;
      y++;
    }
  }
  return labels;
};

export function ForecastPlanner({ team, epics, onUpdateEpics, onDeleteEpic }: ForecastPlannerProps) {
  const [draggedEpicId, setDraggedEpicId] = useState<string | null>(null);
  const [startQuarter, setStartQuarter] = useState(3);
  const [startYear, setStartYear] = useState(2024);
  const [windowCount, setWindowCount] = useState(3);
  const [editingLabels, setEditingLabels] = useState(false);

  const engineerCount = team.engineerCount || 0;
  const avgPointsPerEngineer = team.avgPointsPerEngineer || 0;
  const sprintsInIncrement = team.sprintsInIncrement || 0;
  const capacity = engineerCount * avgPointsPerEngineer * sprintsInIncrement;
  const windowLabels = generateWindowLabels(startQuarter, startYear, windowCount);

  const getEpicPoints = (epic: Epic): number => {
    const mapping = team.sizeMappings.find(m => m.size === epic.currentSize);
    return mapping?.points || 0;
  };

  const distributeEpicsToWindows = (): PlanningWindow[] => {
    const windows: PlanningWindow[] = windowLabels.map((label, idx) => ({
      id: `window-${idx}`,
      label,
      epics: [],
      totalPoints: 0,
      capacity,
    }));

    let currentWindowIdx = 0;
    let currentWindowPoints = 0;

    epics.forEach(epic => {
      const points = getEpicPoints(epic);
      
      while (currentWindowIdx < windows.length - 1 && currentWindowPoints + points > capacity) {
        currentWindowIdx++;
        currentWindowPoints = 0;
      }

      if (currentWindowIdx < windows.length) {
        const isAboveLine = currentWindowPoints + points <= capacity;
        currentWindowPoints += points;
        
        windows[currentWindowIdx].epics.push({
          ...epic,
          points,
          cumulativePoints: currentWindowPoints,
          isAboveLine,
        });
        windows[currentWindowIdx].totalPoints = currentWindowPoints;
      }
    });

    return windows;
  };

  const planningWindows = distributeEpicsToWindows();

  const handleSizeChange = (epicId: string, newSize: TShirtSize) => {
    const updated = epics.map(e => e.id === epicId ? { ...e, currentSize: newSize } : e);
    onUpdateEpics(updated);
  };

  const handleReset = (epicId: string) => {
    const updated = epics.map(e => e.id === epicId ? { ...e, currentSize: e.originalSize } : e);
    onUpdateEpics(updated);
  };

  const moveEpic = (epicId: string, direction: 'up' | 'down') => {
    const index = epics.findIndex(e => e.id === epicId);
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === epics.length - 1) return;

    const newEpics = [...epics];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newEpics[index], newEpics[targetIndex]] = [newEpics[targetIndex], newEpics[index]];
    onUpdateEpics(newEpics);
  };

  const onDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id);
    setDraggedEpicId(id);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = (e: React.DragEvent, targetEpicId: string) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData("text/plain");
    const draggedIndex = epics.findIndex(e => e.id === draggedId);
    const targetIndex = epics.findIndex(e => e.id === targetEpicId);
    
    if (draggedIndex === -1 || targetIndex === -1 || draggedIndex === targetIndex) return;

    const newEpics = [...epics];
    const [removed] = newEpics.splice(draggedIndex, 1);
    newEpics.splice(targetIndex, 0, removed);
    
    onUpdateEpics(newEpics);
    setDraggedEpicId(null);
  };

  const totalPoints = epics.reduce((sum, e) => sum + getEpicPoints(e), 0);
  const totalCapacity = capacity * windowCount;
  const overallPercent = Math.round((totalPoints / totalCapacity) * 100);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      
      <Card className="border-l-4 border-l-primary bg-secondary/10">
        <CardContent className="pt-6">
          <div className="flex justify-between items-end mb-4">
            <div>
              <h3 className="text-lg font-heading font-semibold">Multi-Increment Planning View</h3>
              <p className="text-sm text-muted-foreground">
                {totalPoints} total points across {windowCount} increments ({capacity} pts/increment)
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setWindowCount(Math.max(1, windowCount - 1))}
                  data-testid="button-decrease-windows"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm font-medium w-20 text-center">{windowCount} Windows</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setWindowCount(Math.min(6, windowCount + 1))}
                  data-testid="button-increase-windows"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingLabels(!editingLabels)}
                className="gap-2"
                data-testid="button-edit-labels"
              >
                <Pencil className="w-4 h-4" />
                {editingLabels ? 'Done' : 'Edit Labels'}
              </Button>
            </div>
          </div>

          {editingLabels && (
            <div className="flex items-center gap-4 p-4 bg-secondary/50 rounded-lg mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Start:</span>
                <Select value={startQuarter.toString()} onValueChange={(v) => setStartQuarter(parseInt(v))}>
                  <SelectTrigger className="w-20 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Q1</SelectItem>
                    <SelectItem value="2">Q2</SelectItem>
                    <SelectItem value="3">Q3</SelectItem>
                    <SelectItem value="4">Q4</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  value={startYear}
                  onChange={(e) => setStartYear(parseInt(e.target.value) || 2024)}
                  className="w-20 h-8"
                  data-testid="input-start-year"
                />
              </div>
              <span className="text-sm text-muted-foreground">→</span>
              <span className="text-sm font-medium">{windowLabels.join(' → ')}</span>
            </div>
          )}

          <div className="flex gap-2 items-center">
            <Progress 
              value={overallPercent > 100 ? 100 : overallPercent} 
              className={`h-2 flex-1 ${overallPercent > 100 ? 'bg-destructive/20' : ''}`} 
            />
            <span className={`text-sm font-bold ${overallPercent > 100 ? 'text-destructive' : 'text-primary'}`}>
              {overallPercent}%
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${windowCount}, 1fr)` }}>
        {planningWindows.map((window, windowIdx) => {
          const percentUsed = Math.round((window.totalPoints / window.capacity) * 100);
          const isOverCapacity = window.totalPoints > window.capacity;
          const isCurrent = windowIdx === 0;

          return (
            <Card 
              key={window.id} 
              className={`
                ${isCurrent ? 'border-primary/50 shadow-lg' : 'border-border'}
                ${isOverCapacity ? 'border-destructive/50' : ''}
              `}
              data-testid={`window-${windowIdx}`}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    {window.label}
                    {isCurrent && (
                      <Badge variant="default" className="text-[10px]">Current</Badge>
                    )}
                  </CardTitle>
                  <Badge 
                    variant={isOverCapacity ? "destructive" : "secondary"}
                    className="font-mono"
                  >
                    {window.totalPoints}/{window.capacity}
                  </Badge>
                </div>
                <Progress 
                  value={percentUsed > 100 ? 100 : percentUsed} 
                  className={`h-1.5 ${isOverCapacity ? 'bg-destructive/20' : ''}`} 
                />
                {isOverCapacity && (
                  <div className="flex items-center gap-1 text-destructive text-xs">
                    <AlertCircle className="w-3 h-3" />
                    Over by {window.totalPoints - window.capacity} pts
                  </div>
                )}
              </CardHeader>
              <CardContent className="pt-0">
                {window.epics.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground border-2 border-dashed rounded-lg">
                    No epics scheduled
                  </div>
                ) : (
                  <div className="space-y-2">
                    {window.epics.map((epic) => (
                      <div
                        key={epic.id}
                        draggable
                        onDragStart={(e) => onDragStart(e, epic.id)}
                        onDragOver={onDragOver}
                        onDrop={(e) => onDrop(e, epic.id)}
                        className={`
                          group relative p-3 rounded-lg border transition-all cursor-grab active:cursor-grabbing
                          ${epic.isAboveLine 
                            ? 'bg-card border-border hover:border-primary/50 shadow-sm' 
                            : 'bg-destructive/5 border-dashed border-destructive/30'}
                          ${draggedEpicId === epic.id ? 'opacity-50 border-primary' : ''}
                        `}
                        data-testid={`epic-card-${epic.id}`}
                      >
                        <div className="flex items-start gap-2">
                          <GripVertical className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1 mb-1">
                              <h4 className="font-medium text-sm truncate">{epic.title}</h4>
                              {epic.originalSize !== epic.currentSize && (
                                <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-200 bg-amber-50 flex-shrink-0">
                                  Mod
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Select 
                                value={epic.currentSize} 
                                onValueChange={(val: TShirtSize) => handleSizeChange(epic.id, val)}
                              >
                                <SelectTrigger className={`h-6 w-16 text-xs font-mono ${epic.originalSize !== epic.currentSize ? 'border-amber-400' : ''}`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {team.sizeMappings.map(m => (
                                    <SelectItem key={m.size} value={m.size}>
                                      <span className="font-mono text-xs">{m.size}</span>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <span className="text-xs text-muted-foreground font-mono">
                                {epic.points} pts
                              </span>
                              <Badge variant="secondary" className="text-[9px] uppercase ml-auto">
                                {epic.source}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          {epic.originalSize !== epic.currentSize && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 text-amber-600" 
                              onClick={() => handleReset(epic.id)}
                            >
                              <Undo2 className="w-3 h-3" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6" 
                            onClick={() => moveEpic(epic.id, 'up')}
                          >
                            <ArrowUp className="w-3 h-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6" 
                            onClick={() => moveEpic(epic.id, 'down')}
                          >
                            <ArrowDown className="w-3 h-3" />
                          </Button>
                          {onDeleteEpic && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 text-destructive hover:text-destructive" 
                              onClick={() => onDeleteEpic(epic.id)}
                              data-testid={`button-delete-epic-${epic.id}`}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {planningWindows.every(w => w.epics.length === 0) && epics.length === 0 && (
        <div className="py-12 text-center text-muted-foreground">
          <p>No epics to display. Add epics to see them distributed across planning windows.</p>
        </div>
      )}
    </div>
  );
}
