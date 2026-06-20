import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { Link } from "wouter";

interface VoteConfirmationProps {
  onReturn: () => void;
}

export function VoteConfirmation({ onReturn }: VoteConfirmationProps) {
  return (
    <Card className="bg-white rounded-lg shadow p-6 text-center">
      <CardContent className="p-0">
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-green-100 p-3">
            <CheckCircle className="text-green-600 h-12 w-12" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Vote Successfully Submitted</h2>
        <p className="text-gray-600 mb-6">Thank you for participating in the election.</p>
        <Button onClick={onReturn}>
          Return to Dashboard
        </Button>
      </CardContent>
    </Card>
  );
}
