import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { SelectCheckbox } from "@/components/ui/row-select-checkbox";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { InfoIcon, UserCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { NomineeWithVotes } from "@/lib/types";

interface NomineeCardProps {
  nominee: NomineeWithVotes;
  isSelectable?: boolean;
  isSelected?: boolean;
  onSelect?: (id: number, selected: boolean) => void;
  showDetailsOnClick?: boolean;
}

export function NomineeCard({
  nominee,
  isSelectable = false,
  isSelected = false,
  onSelect,
  showDetailsOnClick = false,
}: NomineeCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const handleSelect = () => {
    if (isSelectable && onSelect) {
      onSelect(nominee.id, !isSelected);
    }
  };

  const handleShowDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDetails(true);
  };

  return (
    <>
      <Card 
        className={`border border-gray-200 rounded-lg p-4 hover:bg-primary/5 transition ${isSelectable ? 'cursor-pointer' : ''}`}
        onClick={showDetailsOnClick ? handleShowDetails : undefined}
      >
        <CardContent className="p-0 flex items-center">
          {isSelectable && (
            <SelectCheckbox
              checked={isSelected}
              onCheckedChange={handleSelect}
              aria-label={`Select ${nominee.name}`}
            />
          )}
          <div className={`${isSelectable ? 'ml-2' : ''} flex-1`}>
            <p className="font-medium text-gray-700">{nominee.name}</p>
            {nominee.additionalInfo?.department && (
              <p className="text-sm text-gray-500">{nominee.additionalInfo.department}</p>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-gray-500 hover:text-primary transition ml-2"
            onClick={handleShowDetails}
          >
            <InfoIcon className="h-5 w-5" />
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nominee Details</DialogTitle>
            <DialogDescription>
              Information about {nominee.name}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center py-4">
            <Avatar className="h-24 w-24 mb-4">
              <AvatarImage src={(nominee as any).photo?.url || nominee.photoUrl || undefined} alt={nominee.name} />
              <AvatarFallback>
                <UserCircle2 className="h-16 w-16 text-gray-300" />
              </AvatarFallback>
            </Avatar>
            <h3 className="text-lg font-semibold">{nominee.name}</h3>
            <p className="text-sm text-gray-500">
              {[
                nominee.additionalInfo?.department,
                nominee.additionalInfo?.age ? `Age: ${nominee.additionalInfo.age}` : null,
              ].filter(Boolean).join(' • ')}
            </p>
            {nominee.bio && (
              <div className="mt-4 text-sm text-gray-700 w-full">
                <h4 className="font-semibold mb-1">Bio</h4>
                <p>{nominee.bio}</p>
              </div>
            )}
            {nominee.voteCount !== undefined && (
              <div className="mt-4 text-sm text-gray-700 w-full">
                <h4 className="font-semibold mb-1">Election Statistics</h4>
                <p>Votes received: {nominee.voteCount} ({nominee.percentage}%)</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
