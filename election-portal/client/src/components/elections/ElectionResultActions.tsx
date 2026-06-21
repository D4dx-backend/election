import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import jsPDF from "jspdf";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Eye, EyeOff, Printer, CheckCircle2, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { generateElectionResultPdf } from "@/lib/resultPdf";

interface ResultNominee {
  name: string;
  gender?: string;
  voteCount?: number;
  percentage?: number;
}

interface ElectionResultActionsProps {
  electionId: string;
  electionTitle?: string;
  organization?: string;
  electionDate?: string | Date;
  resultsPublished?: boolean;
  resultsPublishedAt?: string | Date | null;
  results: {
    totalBallots?: number;
    eligibleVoters?: number;
    turnout?: number;
    nominees?: ResultNominee[];
  } | null;
  numberToBeElected?: number;
  genderBasedSelection?: boolean;
}

// Load and cache the Vote+ logo for PDF embedding.
let cachedLogo: HTMLImageElement | null = null;
const loadLogo = (): Promise<HTMLImageElement | null> =>
  new Promise((resolve) => {
    if (cachedLogo) return resolve(cachedLogo);
    const img = new Image();
    img.onload = () => {
      cachedLogo = img;
      resolve(img);
    };
    img.onerror = () => resolve(null);
    img.src = "/logo.png";
  });

export function ElectionResultActions({
  electionId,
  electionTitle,
  organization,
  electionDate,
  resultsPublished = false,
  resultsPublishedAt,
  results,
  numberToBeElected = 1,
  genderBasedSelection = false,
}: ElectionResultActionsProps) {
  const { toast } = useToast();
  const [printOpen, setPrintOpen] = useState(false);
  const [preparedBy, setPreparedBy] = useState("");

  const publishMutation = useMutation({
    mutationFn: async (publish: boolean) => {
      const res = await apiRequest("PATCH", `/api/elections/${electionId}/publish`, { publish });
      return res.json();
    },
    onSuccess: (_data, publish) => {
      queryClient.invalidateQueries({ queryKey: [`/api/elections/${electionId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/elections"] });
      toast({
        title: publish ? "Results published" : "Results hidden",
        description: publish
          ? "Voters can now view the result of this election."
          : "The result is no longer visible to voters.",
        variant: publish ? "success" : "default",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Action failed",
        description: err?.message || "Could not update result visibility.",
        variant: "destructive",
      });
    },
  });

  const fmtDate = (d?: string | Date | null) => {
    if (!d) return "";
    try {
      return new Date(d).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return String(d);
    }
  };

  const generatePdf = async () => {
    const logo = await loadLogo();
    const logoRatio = logo && logo.naturalHeight ? logo.naturalWidth / logo.naturalHeight : 2.62;

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 16;
    const navy: [number, number, number] = [10, 36, 99];
    const red: [number, number, number] = [225, 29, 42];

    // ---- Header ----
    if (logo) {
      const lw = 34;
      const lh = lw / logoRatio;
      doc.addImage(logo, "PNG", margin, 12, lw, lh);
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(navy[0], navy[1], navy[2]);
    doc.text("ELECTION RESULT", pageWidth - margin, 18, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text("Official Result Summary", pageWidth - margin, 24, { align: "right" });

    doc.setDrawColor(navy[0], navy[1], navy[2]);
    doc.setLineWidth(0.6);
    doc.line(margin, 30, pageWidth - margin, 30);

    // ---- Election title block ----
    let y = 42;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(20, 20, 20);
    doc.text(electionTitle || "Election", pageWidth / 2, y, { align: "center" });
    y += 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(90, 90, 90);
    if (organization) {
      doc.text(organization, pageWidth / 2, y, { align: "center" });
      y += 6;
    }
    if (electionDate) {
      doc.setFontSize(10);
      doc.text(`Election Date: ${fmtDate(electionDate)}`, pageWidth / 2, y, { align: "center" });
      y += 6;
    }

    // ---- Summary tiles ----
    y += 4;
    const tileW = (pageWidth - margin * 2 - 8) / 3;
    const tileH = 20;
    const summary = [
      { label: "Eligible Voters", value: String(results?.eligibleVoters ?? 0) },
      { label: "Votes Cast", value: String(results?.totalBallots ?? 0) },
      { label: "Turnout", value: `${results?.turnout ?? 0}%` },
    ];
    summary.forEach((s, i) => {
      const tx = margin + i * (tileW + 4);
      doc.setFillColor(244, 246, 251);
      doc.setDrawColor(225, 228, 236);
      doc.setLineWidth(0.3);
      doc.roundedRect(tx, y, tileW, tileH, 2, 2, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.setTextColor(navy[0], navy[1], navy[2]);
      doc.text(s.value, tx + tileW / 2, y + 9, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(110, 110, 110);
      doc.text(s.label, tx + tileW / 2, y + 15, { align: "center" });
    });
    y += tileH + 10;

    // ---- Results table ----
    const sorted = [...(results?.nominees || [])].sort(
      (a, b) => (b.voteCount || 0) - (a.voteCount || 0)
    );

    const cols = genderBasedSelection
      ? [
          { title: "Rank", x: margin, w: 14, align: "center" as const },
          { title: "Nominee", x: margin + 14, w: 74, align: "left" as const },
          { title: "Gender", x: margin + 88, w: 22, align: "left" as const },
          { title: "Votes", x: margin + 110, w: 20, align: "right" as const },
          { title: "%", x: margin + 130, w: 18, align: "right" as const },
          { title: "Result", x: margin + 148, w: pageWidth - margin - (margin + 148), align: "center" as const },
        ]
      : [
          { title: "Rank", x: margin, w: 16, align: "center" as const },
          { title: "Nominee", x: margin + 16, w: 90, align: "left" as const },
          { title: "Votes", x: margin + 106, w: 22, align: "right" as const },
          { title: "%", x: margin + 128, w: 20, align: "right" as const },
          { title: "Result", x: margin + 148, w: pageWidth - margin - (margin + 148), align: "center" as const },
        ];
    const tableW = pageWidth - margin * 2;
    const rowH = 9;

    // Header row
    doc.setFillColor(navy[0], navy[1], navy[2]);
    doc.rect(margin, y, tableW, rowH, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(255, 255, 255);
    cols.forEach((c) => {
      const cx = c.align === "right" ? c.x + c.w - 3 : c.align === "center" ? c.x + c.w / 2 : c.x + 3;
      doc.text(c.title, cx, y + 6, { align: c.align });
    });
    y += rowH;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    sorted.forEach((n, idx) => {
      const elected = idx < numberToBeElected;
      // page break
      if (y + rowH > pageHeight - 40) {
        doc.addPage();
        y = margin;
      }
      if (elected) {
        doc.setFillColor(232, 245, 233);
      } else {
        doc.setFillColor(idx % 2 === 0 ? 255 : 249, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
      }
      doc.rect(margin, y, tableW, rowH, "F");
      doc.setDrawColor(230, 230, 230);
      doc.setLineWidth(0.1);
      doc.line(margin, y + rowH, margin + tableW, y + rowH);

      doc.setTextColor(elected ? 22 : 40, elected ? 101 : 40, elected ? 52 : 40);
      const resultColIdx = genderBasedSelection ? 5 : 4;
      const values = genderBasedSelection
        ? [
            String(idx + 1),
            n.name || "-",
            n.gender ? n.gender.charAt(0).toUpperCase() + n.gender.slice(1) : "-",
            String(n.voteCount ?? 0),
            `${(n.percentage ?? 0).toFixed(1)}%`,
            elected ? "ELECTED" : "-",
          ]
        : [
            String(idx + 1),
            n.name || "-",
            String(n.voteCount ?? 0),
            `${(n.percentage ?? 0).toFixed(1)}%`,
            elected ? "ELECTED" : "-",
          ];
      cols.forEach((c, ci) => {
        if (ci === 1 || ci === resultColIdx) doc.setFont("helvetica", elected ? "bold" : "normal");
        else doc.setFont("helvetica", "normal");
        const cx = c.align === "right" ? c.x + c.w - 3 : c.align === "center" ? c.x + c.w / 2 : c.x + 3;
        doc.text(values[ci], cx, y + 6, { align: c.align });
      });
      y += rowH;
    });

    // table border
    doc.setDrawColor(navy[0], navy[1], navy[2]);
    doc.setLineWidth(0.3);
    doc.rect(margin, y - rowH * (sorted.length + 1), tableW, rowH * (sorted.length + 1));

    if (sorted.length === 0) {
      doc.setTextColor(120, 120, 120);
      doc.text("No nominees / votes recorded.", pageWidth / 2, y + 8, { align: "center" });
      y += 12;
    }

    // ---- Signature / prepared-by ----
    let signY = pageHeight - 36;
    if (y + 30 > signY) signY = y + 20;
    doc.setDrawColor(120, 120, 120);
    doc.setLineWidth(0.3);
    doc.line(pageWidth - margin - 60, signY, pageWidth - margin, signY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text(preparedBy ? preparedBy : "Authorised Signatory", pageWidth - margin - 30, signY + 5, {
      align: "center",
    });
    doc.setFontSize(8);
    doc.setTextColor(130, 130, 130);
    doc.text("Prepared by", pageWidth - margin - 30, signY + 10, { align: "center" });

    // ---- Footer ----
    doc.setDrawColor(225, 228, 236);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 16, pageWidth - margin, pageHeight - 16);
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text(`Generated on ${new Date().toLocaleString()}`, margin, pageHeight - 11);
    doc.setTextColor(red[0], red[1], red[2]);
    doc.setFont("helvetica", "bold");
    doc.text("Powered by Vote+", pageWidth - margin, pageHeight - 11, { align: "right" });

    const safeTitle = (electionTitle || "election").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    doc.save(`result-${safeTitle}-${Date.now()}.pdf`);
  };

  const handlePrint = async () => {
    try {
      await generateElectionResultPdf({
        electionTitle,
        organization,
        electionDate,
        results,
        numberToBeElected,
        genderBasedSelection,
        preparedBy,
        mode: "download",
      });
      setPrintOpen(false);
      toast({ title: "Result PDF generated", description: "The election result has been downloaded.", variant: "success" });
    } catch (err: any) {
      toast({
        title: "Failed to generate PDF",
        description: err?.message || "Unknown error",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
                resultsPublished ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
              }`}
            >
              {resultsPublished ? <Globe className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-gray-900">Result visible to voters</h3>
                {resultsPublished ? (
                  <Badge variant="outline" className="bg-green-100 text-green-800">
                    Published
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-gray-100 text-gray-700">
                    Hidden
                  </Badge>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5 max-w-md">
                {resultsPublished
                  ? "Voters can now see the full result tally for this election."
                  : "Enable this to let voters view the result. They will only see vote counts, no private details."}
              </p>
              {resultsPublished && resultsPublishedAt && (
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Published on {fmtDate(resultsPublishedAt)}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant={resultsPublished ? "outline" : "default"}
                  size="sm"
                  disabled={publishMutation.isPending}
                >
                  {resultsPublished ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-1.5" /> Hide Result
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-1.5" /> Enable / Publish
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {resultsPublished ? "Hide result from voters?" : "Make the result public?"}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {resultsPublished
                      ? "Voters will no longer be able to see the result tally for this election."
                      : "Do you want to confirm and make the result public? Voters who can access this election will be able to view the full vote tally."}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => publishMutation.mutate(!resultsPublished)}>
                    {resultsPublished ? "Yes, hide it" : "Yes, publish"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button variant="outline" size="sm" onClick={() => setPrintOpen(true)}>
              <Printer className="h-4 w-4 mr-1.5" /> Print Result
            </Button>
          </div>
        </div>

        {/* Print dialog with optional name */}
        <Dialog open={printOpen} onOpenChange={setPrintOpen}>
          <DialogContent className="sm:max-w-[440px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Printer className="h-5 w-5 text-primary" /> Print Election Result
              </DialogTitle>
              <DialogDescription>
                Generates a standard A4 result sheet with the election name and the Vote+ logo.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div>
                <Label htmlFor="preparedBy">Prepared by / Returning Officer (optional)</Label>
                <Input
                  id="preparedBy"
                  placeholder="e.g. John Mathew"
                  value={preparedBy}
                  onChange={(e) => setPreparedBy(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This name appears above the signature line on the printed sheet.
                </p>
              </div>
              <div className="rounded-md bg-gray-50 p-3 text-xs text-gray-600 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                {results?.nominees?.length || 0} nominees · {results?.totalBallots ?? 0} votes ·{" "}
                {results?.turnout ?? 0}% turnout
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPrintOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-1.5" /> Generate PDF
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
