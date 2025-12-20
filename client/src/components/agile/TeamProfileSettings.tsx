import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TeamProfile } from "@/lib/mockData";
import { Calculator, Users, Calendar } from "lucide-react";

interface TeamProfileSettingsProps {
  team: TeamProfile;
  onUpdate: (team: TeamProfile) => void;
}

export function TeamProfileSettings({ team, onUpdate }: TeamProfileSettingsProps) {
  
  const updateField = (field: keyof TeamProfile, value: number) => {
    onUpdate({ ...team, [field]: value });
  };

  const updateMapping = (index: number, field: 'points' | 'confidence', value: number) => {
    const newMappings = [...team.sizeMappings];
    newMappings[index] = { ...newMappings[index], [field]: value };
    onUpdate({ ...team, sizeMappings: newMappings });
  };

  // Calculate Derived Capacity (handle null/undefined values)
  const engineerCount = team.engineerCount || 0;
  const avgPointsPerEngineer = team.avgPointsPerEngineer || 0;
  const sprintsInIncrement = team.sprintsInIncrement || 0;
  const sprintCapacity = engineerCount * avgPointsPerEngineer;
  const incrementCapacity = sprintCapacity * sprintsInIncrement;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Team Stats */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <CardTitle>Team Capacity Calculator</CardTitle>
          </div>
          <CardDescription>Define your team's composition to calculate available velocity.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Number of Engineers</Label>
            <Input 
              type="number" 
              value={engineerCount} 
              onChange={(e) => updateField('engineerCount', parseInt(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-2">
            <Label>Avg Points / Engineer / Sprint</Label>
            <Input 
              type="number" 
              value={avgPointsPerEngineer} 
              onChange={(e) => updateField('avgPointsPerEngineer', parseInt(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-2">
            <Label>Sprints in Increment</Label>
            <Input 
              type="number" 
              value={sprintsInIncrement} 
              onChange={(e) => updateField('sprintsInIncrement', parseInt(e.target.value) || 0)}
            />
          </div>

          <div className="md:col-span-3 bg-secondary/30 p-4 rounded-lg flex justify-between items-center border border-border">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calculator className="w-4 h-4" />
              <span>Calculated Increment Capacity</span>
            </div>
            <div className="text-2xl font-bold font-heading text-primary">
              {incrementCapacity} <span className="text-sm font-normal text-muted-foreground">Points</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* T-Shirt Sizing Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            <CardTitle>T-Shirt Size Mappings</CardTitle>
          </div>
          <CardDescription>
            Map historical complexity (points) to project sizes. Use the confidence slider to indicate certainty.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Size</TableHead>
                <TableHead>Anchor Description</TableHead>
                <TableHead className="w-[150px]">Story Points</TableHead>
                <TableHead className="w-[200px]">Confidence %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {team.sizeMappings.map((mapping, idx) => (
                <TableRow key={mapping.size}>
                  <TableCell className="font-bold font-mono text-primary">{mapping.size}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{mapping.anchorDescription}</TableCell>
                  <TableCell>
                    <Input 
                      type="number" 
                      className="w-24 h-8" 
                      value={mapping.points}
                      onChange={(e) => updateMapping(idx, 'points', parseInt(e.target.value) || 0)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Slider 
                        value={[mapping.confidence]} 
                        max={100} 
                        step={5} 
                        onValueChange={(val) => updateMapping(idx, 'confidence', val[0])}
                        className="w-[120px]"
                      />
                      <span className={`text-xs font-mono w-8 ${mapping.confidence < 50 ? 'text-red-500' : 'text-emerald-600'}`}>
                        {mapping.confidence}%
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
