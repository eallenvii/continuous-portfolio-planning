import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TShirtSize } from "@/lib/mockData";
import { Plus, Upload, FileSpreadsheet, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface EpicManagementProps {
  onCreateEpic: (epic: {
    title: string;
    description: string;
    originalSize: TShirtSize;
    currentSize: TShirtSize;
    source: 'Jira' | 'Trello' | 'Template';
    isTemplate?: boolean;
  }) => void;
  onImportEpics: (epics: Array<{
    title: string;
    description: string;
    originalSize: TShirtSize;
    currentSize: TShirtSize;
    source: 'Jira' | 'Trello' | 'Template';
  }>) => void;
  isLoading?: boolean;
}

const T_SHIRT_SIZES: TShirtSize[] = ['2-XS', 'XS', 'S', 'M', 'L', 'XL', '2-XL', '3-XL'];

export function EpicManagement({ onCreateEpic, onImportEpics, isLoading }: EpicManagementProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [size, setSize] = useState<TShirtSize>("M");
  const [source, setSource] = useState<'Jira' | 'Trello' | 'Template'>("Template");
  const [csvContent, setCsvContent] = useState("");
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (!title.trim()) {
      toast({ title: "Title required", description: "Please enter an epic title", variant: "destructive" });
      return;
    }
    onCreateEpic({
      title: title.trim(),
      description: description.trim(),
      originalSize: size,
      currentSize: size,
      source,
      isTemplate: source === 'Template',
    });
    resetForm();
    setOpen(false);
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setSize("M");
    setSource("Template");
    setCsvContent("");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvContent(content);
    };
    reader.readAsText(file);
  };

  const parseCSV = (content: string): Array<{
    title: string;
    description: string;
    originalSize: TShirtSize;
    currentSize: TShirtSize;
    source: 'Jira' | 'Trello' | 'Template';
  }> => {
    const lines = content.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''));
    const titleIdx = headers.findIndex(h => h.includes('title') || h.includes('summary') || h.includes('name'));
    const descIdx = headers.findIndex(h => h.includes('description') || h.includes('desc'));
    const sizeIdx = headers.findIndex(h => h.includes('size') || h.includes('estimate') || h.includes('points'));

    if (titleIdx === -1) {
      toast({ title: "Invalid CSV", description: "CSV must have a 'title' or 'summary' column", variant: "destructive" });
      return [];
    }

    const epics: Array<{
      title: string;
      description: string;
      originalSize: TShirtSize;
      currentSize: TShirtSize;
      source: 'Jira' | 'Trello' | 'Template';
    }> = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length <= titleIdx) continue;

      const title = values[titleIdx]?.trim();
      if (!title) continue;

      const description = descIdx >= 0 ? values[descIdx]?.trim() || "" : "";
      let sizeValue = sizeIdx >= 0 ? values[sizeIdx]?.trim().toUpperCase() : "M";
      
      const normalizedSize = normalizeSize(sizeValue);

      epics.push({
        title,
        description,
        originalSize: normalizedSize,
        currentSize: normalizedSize,
        source: 'Template',
      });
    }

    return epics;
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const normalizeSize = (value: string): TShirtSize => {
    const upper = value.toUpperCase().replace(/\s/g, '');
    if (T_SHIRT_SIZES.includes(upper as TShirtSize)) return upper as TShirtSize;
    if (upper === '2XS' || upper === 'XXS') return '2-XS';
    if (upper === '2XL' || upper === 'XXL') return '2-XL';
    if (upper === '3XL' || upper === 'XXXL') return '3-XL';
    const numMatch = upper.match(/(\d+)/);
    if (numMatch) {
      const num = parseInt(numMatch[1]);
      if (num <= 3) return '2-XS';
      if (num <= 8) return 'XS';
      if (num <= 20) return 'S';
      if (num <= 40) return 'M';
      if (num <= 100) return 'L';
      if (num <= 250) return 'XL';
      if (num <= 500) return '2-XL';
      return '3-XL';
    }
    return 'M';
  };

  const handleImport = () => {
    if (!csvContent.trim()) {
      toast({ title: "No data", description: "Please paste CSV content or upload a file", variant: "destructive" });
      return;
    }

    setImporting(true);
    const epics = parseCSV(csvContent);
    
    if (epics.length === 0) {
      toast({ title: "No epics found", description: "Could not parse any epics from the CSV", variant: "destructive" });
      setImporting(false);
      return;
    }

    onImportEpics(epics);
    toast({ title: "Import started", description: `Importing ${epics.length} epics...` });
    setImporting(false);
    setCsvContent("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" data-testid="button-add-epic" className="gap-2">
          <Plus className="w-4 h-4" /> Add Epic
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Epics</DialogTitle>
          <DialogDescription>
            Create a single epic manually or import multiple from CSV.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="manual" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual" className="gap-2">
              <Plus className="w-4 h-4" /> Manual
            </TabsTrigger>
            <TabsTrigger value="csv" className="gap-2">
              <FileSpreadsheet className="w-4 h-4" /> CSV Import
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                data-testid="input-epic-title"
                placeholder="Enter epic title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                data-testid="input-epic-description"
                placeholder="Brief description of the epic"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>T-Shirt Size</Label>
                <Select value={size} onValueChange={(v) => setSize(v as TShirtSize)}>
                  <SelectTrigger data-testid="select-epic-size">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {T_SHIRT_SIZES.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Source</Label>
                <Select value={source} onValueChange={(v) => setSource(v as 'Jira' | 'Trello' | 'Template')}>
                  <SelectTrigger data-testid="select-epic-source">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Template">Template</SelectItem>
                    <SelectItem value="Jira">Jira</SelectItem>
                    <SelectItem value="Trello">Trello</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button 
                onClick={handleSubmit} 
                disabled={isLoading}
                data-testid="button-submit-epic"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Create Epic
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="csv" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Upload CSV File</Label>
              <div className="flex gap-2">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="flex-1"
                  data-testid="input-csv-file"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Or Paste CSV Content</Label>
              <Textarea
                placeholder="title,description,size&#10;Epic 1,Description here,M&#10;Epic 2,Another desc,L"
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                rows={6}
                className="font-mono text-sm"
                data-testid="input-csv-content"
              />
            </div>

            <div className="bg-secondary/50 p-3 rounded-lg text-sm">
              <p className="font-medium mb-1">CSV Format Tips:</p>
              <ul className="text-muted-foreground space-y-1 list-disc list-inside">
                <li>First row should be headers (title, description, size)</li>
                <li>Jira/Trello exports work automatically</li>
                <li>Size can be T-shirt (M, L, XL) or story points (5, 13, 21)</li>
              </ul>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button 
                onClick={handleImport} 
                disabled={importing || !csvContent.trim()}
                data-testid="button-import-csv"
                className="gap-2"
              >
                {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                Import Epics
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
