import { useState, useEffect, useMemo } from "react";
import { Epic, TeamProfile, TShirtSize } from "@/lib/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, ArrowDown, ArrowUp, GripVertical, Trash2, Undo2, Save, RotateCcw, Minus, Users, Target, Calculator } from "lucide-react";
import { Separator } from "@/components/ui/separator";

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
  onUpdateTeam?: (updates: Partial<TeamProfile>) => void;
}

export function ForecastPlanner({ team, epics, onUpdateEpics, onDeleteEpic, onUpdateTeam }: ForecastPlannerProps) {
  const [draggedEpicId, setDraggedEpicId] = useState<string | null>(null);
  
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
  
  const hasScenarioChanges = 
    scenarioEngineers !== (team.engineerCount || 0) ||
    scenarioPointsPerEngineer !== (team.avgPointsPerEngineer || 0) ||
    scenarioSprintsInIncrement !== (team.sprintsInIncrement || 0);

  const getEpicPoints = (epic: Epic): number => {
    const mapping = team.sizeMappings.find(m => m.size === epic.currentSize);
    return mapping?.points || 0;
  };

  const epicsWithCalculations = useMemo((): EpicWithPoints[] => {
    let cumulative = 0;
    return epics.map(epic => {
      const points = getEpicPoints(epic);
      cumulative += points;
      return {
        ...epic,
        points,
        cumulativePoints: cumulative,
        isAboveLine: cumulative <= scenarioCapacity,
      };
    });
  }, [epics, team.sizeMappings, scenarioCapacity]);

  const totalPoints = epicsWithCalculations.reduce((sum, e) => sum + e.points, 0);
  const aboveLineCount = epicsWithCalculations.filter(e => e.isAboveLine).length;
  const belowLineCount = epicsWithCalculations.length - aboveLineCount;

  const linePosition = epicsWithCalculations.findIndex(e => !e.isAboveLine);
  const hasItemsBelowLine = linePosition !== -1;

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
          <div className="grid grid-cols-3 gap-6">
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
          </div>
          
          <div className="mt-4 pt-4 border-t flex items-center justify-between">
            <div className="flex gap-6">
              <div>
                <span className="text-xs text-muted-foreground block">Base Capacity</span>
                <span className="text-lg font-bold font-mono">{baseCapacity} pts</span>
              </div>
              {hasScenarioChanges && (
                <>
                  <div className="text-muted-foreground self-center">→</div>
                  <div>
                    <span className="text-xs text-amber-600 block">Scenario Capacity</span>
                    <span className={`text-lg font-bold font-mono ${scenarioCapacity > baseCapacity ? 'text-green-600' : scenarioCapacity < baseCapacity ? 'text-red-600' : ''}`}>
                      {scenarioCapacity} pts
                      {scenarioCapacity !== baseCapacity && (
                        <span className="text-sm ml-1">
                          ({scenarioCapacity > baseCapacity ? '+' : ''}{scenarioCapacity - baseCapacity})
                        </span>
                      )}
                    </span>
                  </div>
                </>
              )}
            </div>
            <div className="text-right">
              <span className="text-xs text-muted-foreground block">Total Demand</span>
              <span className={`text-lg font-bold font-mono ${totalPoints > scenarioCapacity ? 'text-destructive' : 'text-green-600'}`}>
                {totalPoints} pts
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg">Prioritized Backlog</CardTitle>
              <p className="text-sm text-muted-foreground">
                Drag to reorder. Items below the red line exceed capacity.
              </p>
            </div>
            <div className="flex gap-3">
              <Badge variant="default" className="gap-1">
                <span className="font-mono">{aboveLineCount}</span> above
              </Badge>
              {belowLineCount > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <span className="font-mono">{belowLineCount}</span> at risk
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {epics.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground border-2 border-dashed rounded-lg">
              <p>No epics to display. Add epics to see them in the prioritized backlog.</p>
            </div>
          ) : (
            <div className="space-y-0">
              {epicsWithCalculations.map((epic, index) => {
                const showLineAbove = index === linePosition && linePosition > 0;
                const isFirstBelowLine = index === linePosition;
                const isLastAboveLine = hasItemsBelowLine && index === linePosition - 1;
                
                return (
                  <div key={epic.id}>
                    {showLineAbove && (
                      <div className="relative py-3 my-2" data-testid="capacity-line">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t-2 border-dashed border-destructive"></div>
                        </div>
                        <div className="relative flex justify-center">
                          <Badge variant="destructive" className="gap-1 px-4">
                            <Minus className="w-3 h-3" />
                            Capacity Line ({scenarioCapacity} pts)
                            <Minus className="w-3 h-3" />
                          </Badge>
                        </div>
                      </div>
                    )}
                    
                    <div
                      draggable
                      onDragStart={(e) => onDragStart(e, epic.id)}
                      onDragOver={onDragOver}
                      onDrop={(e) => onDrop(e, epic.id)}
                      className={`
                        group flex items-center gap-4 p-4 border-b transition-all cursor-grab active:cursor-grabbing
                        ${epic.isAboveLine 
                          ? 'bg-card hover:bg-secondary/30' 
                          : 'bg-destructive/5 hover:bg-destructive/10'}
                        ${isLastAboveLine ? 'border-b-0' : ''}
                        ${isFirstBelowLine ? 'border-t-0' : ''}
                        ${draggedEpicId === epic.id ? 'opacity-50 bg-primary/10' : ''}
                      `}
                      data-testid={`epic-row-${epic.id}`}
                    >
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <GripVertical className="w-5 h-5" />
                        <span className="font-mono text-xs w-6">{index + 1}</span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium truncate">{epic.title}</h4>
                          {epic.originalSize !== epic.currentSize && (
                            <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300 bg-amber-50 shrink-0">
                              Modified
                            </Badge>
                          )}
                        </div>
                        {epic.description && (
                          <p className="text-sm text-muted-foreground truncate mt-0.5">{epic.description}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <Select 
                          value={epic.currentSize} 
                          onValueChange={(val: TShirtSize) => handleSizeChange(epic.id, val)}
                        >
                          <SelectTrigger className={`h-8 w-20 font-mono ${epic.originalSize !== epic.currentSize ? 'border-amber-400' : ''}`}>
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
                        
                        <div className="text-right w-20">
                          <div className="font-mono font-medium">{epic.points} pts</div>
                          <div className="text-xs text-muted-foreground font-mono">
                            Σ {epic.cumulativePoints}
                          </div>
                        </div>

                        <Badge variant="secondary" className="text-[10px] uppercase w-16 justify-center">
                          {epic.source}
                        </Badge>

                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                            disabled={index === 0}
                            title="Move up"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8" 
                            onClick={() => moveEpic(epic.id, 'down')}
                            disabled={index === epics.length - 1}
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
                  </div>
                );
              })}
              
              {!hasItemsBelowLine && epics.length > 0 && (
                <div className="relative py-3 mt-2" data-testid="capacity-line-end">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t-2 border-dashed border-green-500"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <Badge className="gap-1 px-4 bg-green-600">
                      All epics fit! ({totalPoints}/{scenarioCapacity} pts used)
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
