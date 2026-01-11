"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Search,
  FileText,
  MoreVertical,
  Edit,
  Eye,
  Trash2,
  Link as LinkIcon,
  ArrowLeft,
  Filter,
} from "lucide-react";
import { toast } from "sonner";

type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
type WorksheetCategory = "grammar" | "vocabulary" | "reading" | "writing" | "mixed";
type WorksheetStatus = "processing" | "draft" | "published" | "archived";

const LEVEL_COLORS: Record<CEFRLevel, string> = {
  A1: "bg-green-100 text-green-700",
  A2: "bg-lime-100 text-lime-700",
  B1: "bg-yellow-100 text-yellow-700",
  B2: "bg-orange-100 text-orange-700",
  C1: "bg-red-100 text-red-700",
  C2: "bg-purple-100 text-purple-700",
};

const STATUS_COLORS: Record<WorksheetStatus, string> = {
  processing: "bg-blue-100 text-blue-700",
  draft: "bg-gray-100 text-gray-700",
  published: "bg-green-100 text-green-700",
  archived: "bg-red-100 text-red-700",
};

export default function PDFEditorPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<CEFRLevel | "all">("all");
  const [statusFilter, setStatusFilter] = useState<WorksheetStatus | "all">("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [worksheetToDelete, setWorksheetToDelete] = useState<Id<"pdfWorksheets"> | null>(null);

  const worksheetsData = useQuery(api.pdfWorksheets.listWorksheets, {});
  const deleteWorksheet = useMutation(api.pdfWorksheets.deleteWorksheet);

  const worksheets = (worksheetsData || []).map((w) => ({
    _id: w._id,
    title: w.title,
    cefrLevel: w.cefrLevel as CEFRLevel,
    category: w.category as WorksheetCategory,
    status: w.status as WorksheetStatus,
    pageCount: w.pageCount,
    fieldCount: w.fields.length,
    shareToken: w.shareToken,
    updatedAt: w.updatedAt,
  }));

  const filteredWorksheets = worksheets.filter((worksheet) => {
    const matchesSearch = worksheet.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = levelFilter === "all" || worksheet.cefrLevel === levelFilter;
    const matchesStatus = statusFilter === "all" || worksheet.status === statusFilter;
    return matchesSearch && matchesLevel && matchesStatus;
  });

  const handleDelete = async () => {
    if (!worksheetToDelete) return;
    try {
      await deleteWorksheet({ worksheetId: worksheetToDelete });
      toast.success("Worksheet deleted");
    } catch (error) {
      toast.error("Failed to delete worksheet");
      console.error(error);
    } finally {
      setDeleteDialogOpen(false);
      setWorksheetToDelete(null);
    }
  };

  const handleCopyLink = (shareToken: string) => {
    const url = `${window.location.origin}/worksheet/${shareToken}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  };

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin/tools">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Tools
              </Button>
            </Link>
            <div>
              <h2 className="text-2xl font-bold">PDF Editor</h2>
              <p className="text-muted-foreground">
                Create assessment worksheets with auto-grading
              </p>
            </div>
          </div>
          <Link href="/admin/tools/pdf-editor/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Worksheet
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search worksheets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={levelFilter} onValueChange={(v) => setLevelFilter(v as CEFRLevel | "all")}>
            <SelectTrigger className="w-[120px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              {(["A1", "A2", "B1", "B2", "C1", "C2"] as CEFRLevel[]).map((level) => (
                <SelectItem key={level} value={level}>{level}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as WorksheetStatus | "all")}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Worksheets Grid */}
        {filteredWorksheets.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWorksheets.map((worksheet) => (
              <Card key={worksheet._id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-500" />
                      <Badge className={LEVEL_COLORS[worksheet.cefrLevel]}>
                        {worksheet.cefrLevel}
                      </Badge>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/tools/pdf-editor/${worksheet._id}/edit`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/tools/pdf-editor/${worksheet._id}/preview`}>
                            <Eye className="h-4 w-4 mr-2" />
                            Preview
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleCopyLink(worksheet.shareToken)}>
                          <LinkIcon className="h-4 w-4 mr-2" />
                          Copy Link
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setWorksheetToDelete(worksheet._id);
                            setDeleteDialogOpen(true);
                          }}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <CardTitle className="text-lg mt-2">{worksheet.title}</CardTitle>
                  <CardDescription className="capitalize">
                    {worksheet.category} • {worksheet.pageCount} pages • {worksheet.fieldCount} fields
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className={STATUS_COLORS[worksheet.status]}>
                      {worksheet.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(worksheet.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No worksheets yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first PDF worksheet to get started with assessments.
              </p>
              <Link href="/admin/tools/pdf-editor/create">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Worksheet
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Worksheet?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The worksheet and all its data will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
