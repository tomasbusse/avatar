"use client";

import { useState } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  ChevronLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  RefreshCcw,
  Trash2,
  Zap,
  DollarSign,
  FileQuestion,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

// ============================================
// TYPES
// ============================================

type JobStatus = "pending" | "processing" | "completed" | "failed";

const QUESTION_TYPE_LABELS: Record<string, string> = {
  reading_comprehension: "Reading Comprehension",
  grammar_mcq: "Grammar (MCQ)",
  grammar_fill_blank: "Grammar (Fill Blank)",
  vocabulary_mcq: "Vocabulary (MCQ)",
  vocabulary_matching: "Vocabulary (Matching)",
  listening_mcq: "Listening (MCQ)",
  listening_fill_blank: "Listening (Fill Blank)",
  writing_prompt: "Writing Prompt",
  speaking_prompt: "Speaking Prompt",
};

// ============================================
// JOB ROW COMPONENT
// ============================================

interface Job {
  _id: Id<"entryTestGenerationJobs">;
  type: string;
  parameters: {
    questionType?: string;
    cefrLevel?: string;
    count: number;
    topic?: string;
  };
  model: string;
  status: JobStatus;
  progress: number;
  generatedQuestionIds: Id<"entryTestQuestionBank">[];
  error?: string;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalCost?: number;
  };
  createdAt: number;
  completedAt?: number;
}

interface JobRowProps {
  job: Job;
  onRetry: () => void;
  onDelete: () => void;
}

function JobRow({ job, onRetry, onDelete }: JobRowProps) {
  const statusConfig: Record<
    JobStatus,
    { icon: React.ReactNode; color: string; label: string }
  > = {
    pending: {
      icon: <Clock className="h-4 w-4 animate-pulse" />,
      color: "bg-yellow-100 text-yellow-800",
      label: "Pending",
    },
    processing: {
      icon: <Loader2 className="h-4 w-4 animate-spin" />,
      color: "bg-blue-100 text-blue-800",
      label: "Processing",
    },
    completed: {
      icon: <CheckCircle2 className="h-4 w-4" />,
      color: "bg-green-100 text-green-800",
      label: "Completed",
    },
    failed: {
      icon: <XCircle className="h-4 w-4" />,
      color: "bg-red-100 text-red-800",
      label: "Failed",
    },
  };

  const { icon, color, label } = statusConfig[job.status];
  const modelName = job.model.split("/").pop() || job.model;

  return (
    <TableRow>
      <TableCell>
        <div className="flex flex-col gap-1">
          <span className="font-medium">
            {job.parameters.questionType
              ? QUESTION_TYPE_LABELS[job.parameters.questionType]
              : job.type}
          </span>
          <span className="text-xs text-muted-foreground">
            {job.parameters.cefrLevel} • {job.parameters.count} questions
            {job.parameters.topic && ` • ${job.parameters.topic}`}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="text-xs">
          {modelName}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge className={color}>
          <span className="flex items-center gap-1">
            {icon}
            {label}
          </span>
        </Badge>
        {job.status === "processing" && (
          <div className="mt-1 text-xs text-muted-foreground">
            {job.progress}%
          </div>
        )}
      </TableCell>
      <TableCell>
        {job.status === "completed" && (
          <div className="text-sm">
            <span className="font-medium text-green-700">
              {job.generatedQuestionIds.length}
            </span>
            <span className="text-muted-foreground"> saved</span>
          </div>
        )}
        {job.status === "failed" && (
          <span className="text-sm text-red-600 truncate max-w-[200px] block">
            {job.error || "Unknown error"}
          </span>
        )}
      </TableCell>
      <TableCell>
        {job.tokenUsage && (
          <div className="text-xs text-muted-foreground space-y-0.5">
            <div className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              {job.tokenUsage.promptTokens + job.tokenUsage.completionTokens}
            </div>
            {job.tokenUsage.totalCost !== undefined && (
              <div className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                ${job.tokenUsage.totalCost.toFixed(4)}
              </div>
            )}
          </div>
        )}
      </TableCell>
      <TableCell>
        <span className="text-xs text-muted-foreground">
          {formatDistanceToNow(job.createdAt, { addSuffix: true })}
        </span>
      </TableCell>
      <TableCell>
        <div className="flex gap-1">
          {job.status === "failed" && (
            <Button variant="ghost" size="icon" onClick={onRetry}>
              <RefreshCcw className="h-4 w-4" />
            </Button>
          )}
          {(job.status === "completed" || job.status === "failed") && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

// ============================================
// MAIN PAGE
// ============================================

export default function GenerationJobsPage() {
  // Fetch jobs
  const jobs = useQuery(api.entryTestGenerationJobs.listJobs, { limit: 50 });
  const jobCounts = useQuery(api.entryTestGenerationJobs.getJobCounts);
  const activeJobs = useQuery(api.entryTestGenerationJobs.getActiveJobs);

  // Mutations
  const retryJob = useMutation(api.entryTestGenerationJobs.retryJob);
  const deleteJob = useMutation(api.entryTestGenerationJobs.deleteJob);

  const handleRetry = async (jobId: Id<"entryTestGenerationJobs">) => {
    try {
      await retryJob({ jobId });
      toast.success("Job retry started");
    } catch (error) {
      toast.error("Failed to retry job");
    }
  };

  const handleDelete = async (jobId: Id<"entryTestGenerationJobs">) => {
    if (!confirm("Are you sure you want to delete this job?")) return;
    try {
      await deleteJob({ jobId });
      toast.success("Job deleted");
    } catch (error) {
      toast.error("Failed to delete job");
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/entry-tests/questions">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-purple-500" />
              Generation Jobs
            </h1>
            <p className="text-muted-foreground mt-1">
              Track AI question generation jobs
            </p>
          </div>
        </div>
        <Link href="/admin/entry-tests/questions/generate">
          <Button>
            <Sparkles className="h-4 w-4 mr-2" />
            New Generation
          </Button>
        </Link>
      </div>

      {/* Stats */}
      {jobCounts && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="text-2xl font-bold">{jobCounts.total}</div>
              <div className="text-sm text-muted-foreground">Total Jobs</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="text-2xl font-bold text-yellow-600">
                {jobCounts.pending}
              </div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="text-2xl font-bold text-blue-600">
                {jobCounts.processing}
              </div>
              <div className="text-sm text-muted-foreground">Processing</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="text-2xl font-bold text-green-600">
                {jobCounts.completed}
              </div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="text-2xl font-bold text-red-600">
                {jobCounts.failed}
              </div>
              <div className="text-sm text-muted-foreground">Failed</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Active Jobs Banner */}
      {activeJobs && activeJobs.length > 0 && (
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
              <span className="font-medium text-blue-800">
                {activeJobs.length} job{activeJobs.length > 1 ? "s" : ""} currently running
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Jobs Table */}
      {jobs === undefined ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Sparkles className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No generation jobs yet
          </h3>
          <p className="text-gray-500 mb-4">
            Start generating questions with AI to see job history here
          </p>
          <Link href="/admin/entry-tests/questions/generate">
            <Button>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Questions
            </Button>
          </Link>
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job Details</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Result</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => (
                <JobRow
                  key={job._id}
                  job={job as Job}
                  onRetry={() => handleRetry(job._id)}
                  onDelete={() => handleDelete(job._id)}
                />
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
