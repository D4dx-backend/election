import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, FileText, BarChart3, ExternalLink } from "lucide-react";

interface ElectionRow {
  _id: string;
  name?: string;
  title?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  totalVotes?: number;
  votesCount?: number;
}

function statusColor(status?: string) {
  const s = (status || "").toLowerCase();
  if (s === "active" || s === "ongoing") return "bg-green-100 text-green-800";
  if (s === "completed" || s === "closed") return "bg-gray-200 text-gray-700";
  if (s === "scheduled" || s === "upcoming") return "bg-blue-100 text-blue-800";
  if (s === "draft") return "bg-amber-100 text-amber-800";
  return "bg-gray-100 text-gray-800";
}

function formatDate(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString();
}

export default function Reports() {
  useEffect(() => {
    document.title = "Reports | Vote+";
  }, []);

  const { data, isLoading, error } = useQuery<ElectionRow[]>({
    queryKey: ["/api/elections"],
  });

  const elections = Array.isArray(data) ? data : [];
  const total = elections.length;
  const active = elections.filter(
    (e) => ["active", "ongoing"].includes((e.status || "").toLowerCase())
  ).length;
  const completed = elections.filter(
    (e) => ["completed", "closed"].includes((e.status || "").toLowerCase())
  ).length;

  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          Reports
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Overview of elections and quick access to results.
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Could not load reports</AlertTitle>
          <AlertDescription>{(error as Error).message}</AlertDescription>
        </Alert>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{isLoading ? "—" : total}</p>
            <p className="text-xs text-gray-500 mt-1">Total Elections</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{isLoading ? "—" : active}</p>
            <p className="text-xs text-gray-500 mt-1">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-gray-600">{isLoading ? "—" : completed}</p>
            <p className="text-xs text-gray-500 mt-1">Completed</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-900">Election Reports</h2>
        <Link href="/analytics">
          <Button variant="outline" size="sm" className="gap-1">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : elections.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            No elections found yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {elections.map((e) => (
            <Card key={e._id}>
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 truncate">
                      {e.name || e.title || "Untitled Election"}
                    </p>
                    <Badge className={statusColor(e.status)}>{e.status || "—"}</Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDate(e.startDate)} → {formatDate(e.endDate)}
                    {typeof (e.totalVotes ?? e.votesCount) === "number" && (
                      <span className="ml-2">· {e.totalVotes ?? e.votesCount} votes</span>
                    )}
                  </p>
                </div>
                <Link href={`/elections/${e._id}`}>
                  <Button variant="outline" size="sm" className="gap-1 shrink-0">
                    <ExternalLink className="h-4 w-4" />
                    Open Election
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </MainLayout>
  );
}
