import { useState, useEffect, useMemo } from "react";
import { Epic, TeamProfile, TShirtSize } from "@/lib/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowDown, ArrowUp, GripVertical, Trash2, Undo2, Save, RotateCcw, Users, Target, Calculator, ChevronLeft, ChevronRight, Pencil, ArrowRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface EpicAllocation {
  epic: Epic;
  points: number;
  windowIndex: number;
  pointsInWindow: number;
  rolloverPoints: number;
  startsAt: number;
  endsAt: number;
  straddlesLine: boolean;
}

interface PlanningWindow {
  label: string;
  capacity: number;
  usedPoints: number;
  epics: EpicAllocation[];
}

interface ForecastPlannerProps {
  team: TeamProfile;
  epics: Epic[];
  onUpdateEpics: (epics: Epic[]) => void;
  onDeleteEpic?: (epicId: string) => void;
  onUpdateTeam?: (updates: Partial<TeamProfile>) => void;
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

export function ForecastPlanner({ team, epics, onUpdateEpics, onDeleteEpic, onUpdateTeam }: ForecastPlannerProps) {
  const [draggedEpicId, setDraggedEpicId] = useState<string | null>(null);
  const [startQuarter, setStartQuarter] = useState(3);
  const [startYear, setStartYear] = useState(2024);
  const [windowCount, setWindowCount] = useState(3);
  const [editingLabels, setEditingLabels] = useState(false);
  
  const [scenarioEngineers, setScenarioEngineers] = useState(team.engineerCount || 0);
  const [scenarioPointsPerEngineer, setScenarioPointsPerEngineer] = useState(team.avgPointsPerEngineer || 0);
  const [scenarioSprintsInIncrement, setScenarioSprintsInIncrement] = useState(team.sprintsInIncrement || 0);

  useEffect(() => {
    setScenarioEngineers(team.engineerCount || 0);
    setScenarioPointsPerEngineer(team.avgPointsPerEngineer || 0);
    setScenarioSprintsInIncrement(team.sprintsInIncrement || 0);
  }, [team.engineerCount, team.avgPointsPerEngineer, team.sprintsInIncrement]);

  const baseCapacity = (team.engineerCount || 0) * (team.avgPointsPerEngineer || 0) * (team.sprintsInIncrement || 0);
  const scenarioCapacity = scenarioEngineers * scenarioPointsPerEngineer * scenarioSprintsInIncrement;
  const windowLabels = generateWindowLabels(startQuarter, startYear, windowCount);
  
  const hasScenarioChanges = 
    scenarioEngineers !== (team.engineerCount || 0) ||
    scenarioPointsPerEngineer !== (team.avgPointsPerEngineer || 0) ||
    scenarioSprintsInIncrement !== (team.sprintsInIncrement || 0);

  const getEpicPoints = (epic: Epic): number => {
    const mapping = team.sizeMappings.find(m => m.size === epic.currentSize);
    return mapping?.points || 0;
  };

  const planningWindows = useMemo((): PlanningWindow[] => {
    const windows: PlanningWindow[] = windowLabels.map(label => ({
      label,
      capacity: scenarioCapacity,
      usedPoints: 0,
      epics: [],
    }));

    let cumulativePoints = 0;

    epics.forEach((epic, epicIndex) => {
      const points = getEpicPoints(epic);
      const startsAt = cumulativePoints;
      const endsAt = cumulativePoints + points;
      
      const startWindowIndex = Math.floor(startsAt / scenarioCapacity);
      const endWindowIndex = Math.floor((endsAt - 0.001) / scenarioCapacity);
      
      const windowIndex = Math.min(startWindowIndex, windows.length - 1);
      
      if (windowIndex >= 0 && windowIndex < windows.length) {
        const windowStartPoint = windowIndex * scenarioCapacity;
        const windowEndPoint = (windowIndex + 1) * scenarioCapacity;
        
        const straddlesLine = startsAt < windowEndPoint && endsAt > windowEndPoint && windowIndex < windows.length - 1;
        const pointsInWindow = straddlesLine ? windowEndPoint - startsAt : points;
        const rolloverPoints = straddlesLine ? endsAt - windowEndPoint : 0;

        const allocation: EpicAllocation = {
          epic,
          points,
          windowIndex,
          pointsInWindow,
          rolloverPoints,
          startsAt,
          endsAt,
          straddlesLine,
        };

        windows[windowIndex].epics.push(allocation);
        windows[windowIndex].usedPoints += pointsInWindow;

        if (straddlesLine && windowIndex + 1 < windows.length) {
          windows[windowIndex + 1].usedPoints += rolloverPoints;
        }
      }

      cumulativePoints = endsAt;
    });

    return windows;
  }, [epics, team.sizeMappings, scenarioCapacity, windowLabels]);

  const totalPoints = epics.reduce((sum, e) => sum + getEpicPoints(e), 0);
  const totalCapacity = scenarioCapacity * windowCount;
  const beyondCapacity = totalPoints > totalCapacity;

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

  const resetScenario = () => {
    setScenarioEngineers(team.engineerCount || 0);
    setScenarioPointsPerEngineer(team.avgPointsPerEngineer || 0);
    setScenarioSprintsInIncrement(team.sprintsInIncrement || 0);
  };

  const persistScenario = () => {
    if (onUpdateTeam) {
      onUpdateTeam({
        engineerCount: scenarioEngineers,
        avgPointsPerEngineer: scenarioPointsPerEngineer,
        sprintsInIncrement: scenarioSprintsInIncrement,
      });
    }
  };

  const getGlobalEpicIndex = (epicId: string): number => {
    return epics.findIndex(e => e.id === epicId);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calculator className="w-5 h-5 text-primary" />
                What-If Scenario
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Adjust parameters to see how changes affect the commitment line
              </p>
            </div>
            {hasScenarioChanges && (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={resetScenario}
                  data-testid="button-reset-scenario"
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Reset
                </Button>
                <Button 
                  size="sm"
                  onClick={persistScenario}
                  data-testid="button-save-scenario"
                >
                  <Save className="w-4 h-4 mr-1" />
                  Save to Team Profile
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Users className="w-3 h-3" />
                Engineers
              </Label>
              <Input
                type="number"
                value={scenarioEngineers}
                onChange={(e) => setScenarioEngineers(Math.max(0, parseInt(e.target.value) || 0))}
                className={`h-9 font-mono ${scenarioEngineers !== (team.engineerCount || 0) ? 'border-amber-400 bg-amber-50' : ''}`}
                data-testid="input-scenario-engineers"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Target className="w-3 h-3" />
                Points per Engineer
              </Label>
              <Input
                type="number"
                value={scenarioPointsPerEngineer}
                onChange={(e) => setScenarioPointsPerEngineer(Math.max(0, parseInt(e.target.value) || 0))}
                className={`h-9 font-mono ${scenarioPointsPerEngineer !== (team.avgPointsPerEngineer || 0) ? 'border-amber-400 bg-amber-50' : ''}`}
                data-testid="input-scenario-points"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Sprints in Increment</Label>
              <Input
                type="number"
                value={scenarioSprintsInIncrement}
                onChange={(e) => setScenarioSprintsInIncrement(Math.max(1, parseInt(e.target.value) || 1))}
                className={`h-9 font-mono ${scenarioSprintsInIncrement !== (team.sprintsInIncrement || 0) ? 'border-amber-400 bg-amber-50' : ''}`}
                data-testid="input-scenario-sprints"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Planning Windows</Label>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => setWindowCount(Math.max(1, windowCount - 1))}
                  data-testid="button-decrease-windows"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="flex-1 h-9 flex items-center justify-center border rounded-md bg-background font-mono">
                  {windowCount}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => setWindowCount(Math.min(6, windowCount + 1))}
                  data-testid="button-increase-windows"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {editingLabels && (
            <div className="flex items-center gap-4 p-3 bg-secondary/50 rounded-lg mt-4">
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
              <span className="text-sm font-medium text-muted-foreground">→</span>
              <span className="text-sm font-medium">{windowLabels.join(' → ')}</span>
            </div>
          )}
          
          <div className="mt-4 pt-4 border-t flex items-center justify-between">
            <div className="flex gap-6 items-center">
              <div>
                <span className="text-xs text-muted-foreground block">Capacity per Window</span>
                <span className="text-lg font-bold font-mono">{scenarioCapacity} pts</span>
              </div>
              <div className="text-muted-foreground">×</div>
              <div>
                <span className="text-xs text-muted-foreground block">Windows</span>
                <span className="text-lg font-bold font-mono">{windowCount}</span>
              </div>
              <div className="text-muted-foreground">=</div>
              <div>
                <span className="text-xs text-muted-foreground block">Total Capacity</span>
                <span className="text-lg font-bold font-mono">{totalCapacity} pts</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingLabels(!editingLabels)}
                className="gap-1"
                data-testid="button-edit-labels"
              >
                <Pencil className="w-4 h-4" />
                {editingLabels ? 'Done' : 'Edit Labels'}
              </Button>
              <div className="text-right">
                <span className="text-xs text-muted-foreground block">Total Demand</span>
                <span className={`text-lg font-bold font-mono ${beyondCapacity ? 'text-destructive' : 'text-green-600'}`}>
                  {totalPoints} pts
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg">Multi-Window Commitment Forecast</CardTitle>
              <p className="text-sm text-muted-foreground">
                Epics straddling the line show split between windows. Drag to reorder.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-0">
          {epics.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground border-2 border-dashed rounded-lg">
              <p>No epics to display. Add epics to see them distributed across planning windows.</p>
            </div>
          ) : (
            planningWindows.map((window, windowIdx) => {
              const isOverCapacity = window.usedPoints > window.capacity;
              const percentUsed = Math.min(100, Math.round((window.usedPoints / window.capacity) * 100));
              const isCurrent = windowIdx === 0;

              return (
                <div key={windowIdx}>
                  <div className={`
                    rounded-lg border mb-4
                    ${isCurrent ? 'border-primary/50 bg-primary/5' : 'border-border'}
                    ${isOverCapacity ? 'border-amber-400' : ''}
                  `}>
                    <div className="flex items-center justify-between p-3 border-b bg-secondary/30 rounded-t-lg">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">{window.label}</h3>
                        {isCurrent && (
                          <Badge variant="default" className="text-[10px]">Current</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-32">
                          <Progress 
                            value={percentUsed} 
                            className={`h-2 ${isOverCapacity ? 'bg-amber-100' : ''}`}
                          />
                        </div>
                        <Badge 
                          variant={isOverCapacity ? "outline" : "secondary"}
                          className={`font-mono ${isOverCapacity ? 'border-amber-400 text-amber-600' : ''}`}
                        >
                          {window.usedPoints}/{window.capacity} pts
                        </Badge>
                      </div>
                    </div>

                    {window.epics.length === 0 ? (
                      <div className="p-6 text-center text-sm text-muted-foreground">
                        No epics scheduled for this window
                      </div>
                    ) : (
                      <div>
                        {window.epics.map((allocation) => {
                          const { epic, points, pointsInWindow, rolloverPoints, straddlesLine } = allocation;
                          const globalIndex = getGlobalEpicIndex(epic.id);
                          const percentInWindow = Math.round((pointsInWindow / points) * 100);

                          return (
                            <div
                              key={epic.id}
                              draggable
                              onDragStart={(e) => onDragStart(e, epic.id)}
                              onDragOver={onDragOver}
                              onDrop={(e) => onDrop(e, epic.id)}
                              className={`
                                group flex items-center gap-4 p-3 border-b last:border-b-0 transition-all cursor-grab active:cursor-grabbing
                                ${straddlesLine ? 'bg-gradient-to-r from-card via-card to-amber-50' : 'bg-card hover:bg-secondary/30'}
                                ${draggedEpicId === epic.id ? 'opacity-50 bg-primary/10' : ''}
                              `}
                              data-testid={`epic-row-${epic.id}`}
                            >
                              <div className="flex items-center gap-2 text-muted-foreground w-14 shrink-0">
                                <GripVertical className="w-5 h-5" />
                                <span className="font-mono text-xs w-6">{globalIndex + 1}</span>
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium truncate">{epic.title}</h4>
                                  {epic.originalSize !== epic.currentSize && (
                                    <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300 bg-amber-50 shrink-0">
                                      Modified
                                    </Badge>
                                  )}
                                  {straddlesLine && (
                                    <Badge variant="outline" className="text-[10px] text-orange-600 border-orange-300 bg-orange-50 shrink-0 gap-1">
                                      <ArrowRight className="w-3 h-3" />
                                      Rollover
                                    </Badge>
                                  )}
                                </div>
                                {epic.description && (
                                  <p className="text-sm text-muted-foreground truncate mt-0.5">{epic.description}</p>
                                )}
                              </div>

                              <div className="flex items-center gap-4 shrink-0">
                                <div className="w-20">
                                  <Select 
                                    value={epic.currentSize} 
                                    onValueChange={(val: TShirtSize) => handleSizeChange(epic.id, val)}
                                  >
                                    <SelectTrigger className={`h-8 w-full font-mono ${epic.originalSize !== epic.currentSize ? 'border-amber-400' : ''}`}>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {team.sizeMappings.map(m => (
                                        <SelectItem key={m.size} value={m.size}>
                                          <span className="font-mono">{m.size}</span>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                
                                {straddlesLine ? (
                                  <div className="w-28">
                                    <div className="flex items-center gap-1 text-xs">
                                      <span className="font-mono font-medium text-green-600">{pointsInWindow}</span>
                                      <span className="text-muted-foreground">+</span>
                                      <span className="font-mono font-medium text-orange-600">{rolloverPoints}</span>
                                      <span className="text-muted-foreground">pts</span>
                                    </div>
                                    <div className="flex h-1.5 rounded-full overflow-hidden mt-1 bg-secondary">
                                      <div 
                                        className="bg-green-500" 
                                        style={{ width: `${percentInWindow}%` }}
                                      />
                                      <div 
                                        className="bg-orange-400" 
                                        style={{ width: `${100 - percentInWindow}%` }}
                                      />
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-right w-16">
                                    <div className="font-mono font-medium">{points} pts</div>
                                  </div>
                                )}

                                <Badge variant="secondary" className="text-[10px] uppercase w-16 justify-center">
                                  {epic.source}
                                </Badge>

                                <div className="flex gap-1 w-32 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                  {epic.originalSize !== epic.currentSize && (
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-8 w-8 text-amber-600" 
                                      onClick={() => handleReset(epic.id)}
                                      title="Reset to original size"
                                    >
                                      <Undo2 className="w-4 h-4" />
                                    </Button>
                                  )}
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8" 
                                    onClick={() => moveEpic(epic.id, 'up')}
                                    disabled={globalIndex === 0}
                                    title="Move up"
                                  >
                                    <ArrowUp className="w-4 h-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8" 
                                    onClick={() => moveEpic(epic.id, 'down')}
                                    disabled={globalIndex === epics.length - 1}
                                    title="Move down"
                                  >
                                    <ArrowDown className="w-4 h-4" />
                                  </Button>
                                  {onDeleteEpic && (
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-8 w-8 text-destructive hover:text-destructive" 
                                      onClick={() => onDeleteEpic(epic.id)}
                                      title="Delete epic"
                                      data-testid={`button-delete-epic-${epic.id}`}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {windowIdx < planningWindows.length - 1 && (
                    <div className="relative py-2 my-2" data-testid={`capacity-line-${windowIdx}`}>
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t-2 border-dashed border-primary/40"></div>
                      </div>
                      <div className="relative flex justify-center">
                        <Badge variant="outline" className="bg-background px-3 text-xs">
                          End of {window.label} → Start of {planningWindows[windowIdx + 1].label}
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}

          {beyondCapacity && (
            <div className="mt-4 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
              <div className="flex items-center gap-2 text-destructive font-medium">
                <span>Demand exceeds total capacity by {totalPoints - totalCapacity} points</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Consider adding more planning windows, increasing capacity, or reducing scope.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
