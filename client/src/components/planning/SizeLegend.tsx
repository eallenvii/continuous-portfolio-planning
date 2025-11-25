import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SIZE_DEFINITIONS, TShirtSize } from "@/lib/mockData";

const sizeColors: Record<TShirtSize, string> = {
    XS: "bg-blue-500",
    S: "bg-emerald-500",
    M: "bg-indigo-500",
    L: "bg-purple-500",
    XL: "bg-amber-500",
};

export function SizeLegend() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Reference: Capacity Translation
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        {SIZE_DEFINITIONS.map((def) => (
          <div key={def.size} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-md flex items-center justify-center text-white font-bold text-xs shadow-sm ${sizeColors[def.size]}`}>
                {def.size}
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-foreground">{def.points} Points</span>
                <span className="text-xs text-muted-foreground">{def.description}</span>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
