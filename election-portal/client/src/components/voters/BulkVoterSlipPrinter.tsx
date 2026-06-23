import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { User, Election } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Printer, FileDown } from "lucide-react";
import jsPDF from "jspdf";
import 'jspdf-autotable';

// Load the Vote+ logo once and cache it for PDF embedding/watermarking.
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
    img.src = '/logo.png';
  });

interface BulkVoterSlipPrinterProps {
  voters: User[];
  elections: Election[];
  selectedElectionId?: string;
  label?: string;
  className?: string;
}

export function BulkVoterSlipPrinter({ 
  voters, 
  elections,
  selectedElectionId,
  label = "Bulk Print Slips",
  className,
}: BulkVoterSlipPrinterProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  
  // Function to get election names for voters
  const getElectionNamesForVoter = (voter: User) => {
    if (!elections || elections.length === 0) {
      return [];
    }

    // Convert electionAccess from array of ObjectIds to array of strings
    const voterElectionIds = Array.isArray(voter.electionAccess) 
      ? voter.electionAccess.map(id => id.toString())
      : [];

    // If selectedElectionId is provided and not "all", only return that election
    if (selectedElectionId && selectedElectionId !== "all") {
      const selectedElection = elections.find(election => {
        const electionId = election._id?.toString() || election.id?.toString();
        return electionId === selectedElectionId;
      });
      
      if (selectedElection) {
        return [`${selectedElection.title} - ${selectedElection.organization}`];
      }
      return [];
    }
    
    // If voter doesn't have election access or it's empty, return empty array
    if (!voter.electionAccess || voter.electionAccess.length === 0) {
      return [];
    }

    // Otherwise return all matching elections
    return elections
      .filter(election => {
        const electionId = election._id?.toString() || election.id?.toString();
        return electionId && voterElectionIds.includes(electionId);
      })
      .map(election => `${election.title} - ${election.organization}`);
  };

  const printBulkSlips = async () => {
    // If we've already filtered on the backend, use all voters
    // They'll already be filtered by the selected election
    const filteredVoters = voters;

    if (filteredVoters.length === 0) {
      toast({
        title: "No voters found",
        description: "There are no voters assigned to the selected election.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Load the Vote+ logo for the header and per-slip watermark.
      const logo = await loadLogo();
      const logoRatio = logo && logo.naturalHeight
        ? logo.naturalWidth / logo.naturalHeight
        : 2.62; // fallback to the wordmark aspect ratio

      // Create a new PDF document
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Define slip dimensions (2 columns x 5 rows on A4)
      const slipsPerPage = 10;
      const columns = 2;
      const rows = 5;
      const slipWidth = pageWidth / columns - 10; // With margins
      const slipHeight = pageHeight / rows - 10; // With margins

      // Draws a faint, centered Vote+ watermark inside the given slip area.
      const drawWatermark = (sx: number, sy: number) => {
        if (!logo) return;
        const wmWidth = slipWidth * 0.6;
        const wmHeight = wmWidth / logoRatio;
        const wmX = sx + (slipWidth - wmWidth) / 2;
        const wmY = sy + (slipHeight - wmHeight) / 2;
        const anyDoc = doc as any;
        if (anyDoc.GState && anyDoc.setGState) {
          anyDoc.setGState(new anyDoc.GState({ opacity: 0.07 }));
          doc.addImage(logo, 'PNG', wmX, wmY, wmWidth, wmHeight);
          anyDoc.setGState(new anyDoc.GState({ opacity: 1 }));
        } else {
          doc.addImage(logo, 'PNG', wmX, wmY, wmWidth, wmHeight);
        }
      };
      
      // Add title to first page
      if (logo) {
        const headerLogoW = 26;
        const headerLogoH = headerLogoW / logoRatio;
        doc.addImage(logo, 'PNG', 10, 4, headerLogoW, headerLogoH);
      }
      doc.setFontSize(16);
      doc.text("Voter Credentials", pageWidth / 2, 10, { align: 'center' });
      doc.setFontSize(10);
      doc.text(`Election: ${selectedElectionId ? getElectionTitle(selectedElectionId) : 'All Elections'}`, pageWidth / 2, 15, { align: 'center' });
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, 20, { align: 'center' });
      
      // Calculate how many voters to process based on slips per page
      let startY = 25; // Start after header
      let currentPage = 1;
      let votersProcessed = 0;
      
      // Create slips for each voter
      filteredVoters.forEach((voter, index) => {
        // Calculate position on page
        const column = index % columns;
        const row = Math.floor((index % slipsPerPage) / columns);
        
        // If we've filled a page, add a new page
        if (index > 0 && index % slipsPerPage === 0) {
          doc.addPage();
          currentPage++;
          startY = 10; // Reset Y position for new page
        }
        
        const x = 5 + (column * (slipWidth + 5));
        const y = startY + (row * (slipHeight + 5));
        
        // Get election names for this voter
        const electionNames = getElectionNamesForVoter(voter);
        
        // Draw slip border
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.rect(x, y, slipWidth, slipHeight);

        // Faint Vote+ watermark behind the slip content
        drawWatermark(x, y);
        
        // Voter Credentials Header
        doc.setFillColor(240, 240, 240);
        doc.rect(x, y, slipWidth, 10, 'F');
        // Vote+ logo in the header bar
        if (logo) {
          const slipLogoW = 16;
          const slipLogoH = slipLogoW / logoRatio;
          doc.addImage(logo, 'PNG', x + 4, y + (10 - slipLogoH) / 2, slipLogoW, slipLogoH);
        }
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.text("Voter Credentials", x + 23, y + 7);
        
        // Serial number at top right
        doc.setFontSize(8);
        doc.text(`#${voter.sequenceNumber || index + 1}`, x + slipWidth - 10, y + 7);
        
        // Voter details
        doc.setFontSize(10);
        doc.text(`Username: ${voter.username}`, x + 5, y + 20);
        doc.text(`Password: ${(voter as any).plainPassword || voter.username?.toLowerCase() || 'N/A'}`, x + 5, y + 27);
        doc.text(`Status: ${voter.status || 'Active'}`, x + 5, y + 34);
        
        // Elections list
        doc.text('Elections:', x + 5, y + 41);
        if (electionNames.length > 0) {
          electionNames.forEach((name, idx) => {
            if (idx < 2) { // Limit to 2 elections per slip to prevent overflow
              doc.setFontSize(8);
              doc.text(`• ${name}`, x + 10, y + 48 + (idx * 6));
            } else if (idx === 2) {
              doc.text(`• ... and ${electionNames.length - 2} more`, x + 10, y + 48 + (idx * 6));
            }
          });
        } else {
          doc.setFontSize(8);
          doc.text('No elections assigned', x + 10, y + 48);
        }
        
        // Footer
        doc.setFontSize(6);
        doc.text('Please keep these credentials confidential.', x + slipWidth / 2, y + slipHeight - 5, { align: 'center' });
        
        votersProcessed++;
      });
      
      // Save the PDF
      doc.save(`voter-slips-${new Date().getTime()}.pdf`);

      toast({
        title: "Voter slips generated",
        description: `Successfully generated ${votersProcessed} voter slips`,
        variant: "success",
      });

      setOpen(false);
    } catch (error) {
      toast({
        title: "Failed to generate PDF",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    }
  };

  // Helper function to get election title by ID
  const getElectionTitle = (electionId: string): string => {
    const election = elections.find(e => {
      const id = e._id?.toString() || e.id?.toString();
      return id === electionId;
    });
    
    return election ? `${election.title} - ${election.organization}` : 'Unknown Election';
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <Printer className="mr-2 h-4 w-4" />
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Print Voter Slips</DialogTitle>
          <DialogDescription>
            Generate printable PDF with voter credentials for the {selectedElectionId ? 'selected election' : 'all elections'}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 my-4">
          <div className="rounded-md bg-blue-50 p-4">
            <div className="flex">
              <div className="ml-3 flex-1 md:flex md:justify-between">
                <p className="text-sm text-blue-700">
                  This will generate a PDF with up to 10 voter slips per page, formatted for A4 paper.
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-md p-4">
            <p className="text-sm font-medium mb-2">Voter slips will include:</p>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
              <li>Username and password</li>
              <li>Serial number (for tracking)</li>
              <li>Election information</li>
              <li>Status</li>
            </ul>
          </div>
          
          <div className="bg-gray-50 rounded-md p-4">
            <p className="text-sm font-medium">
              {selectedElectionId 
                ? `Printing voter slips for: ${getElectionTitle(selectedElectionId)}`
                : `Printing slips for all voters (${voters.length})`
              }
            </p>
          </div>
        </div>
        
        <DialogFooter className="flex justify-between items-center">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={printBulkSlips}>
            <FileDown className="h-4 w-4 mr-2" />
            Generate PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}