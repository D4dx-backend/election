import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FilterIcon } from "lucide-react";
import { ElectionFilter } from "@/lib/types";
import { Franchise } from "@shared/schema";

interface ElectionFiltersProps {
  franchises: Franchise[];
  onApplyFilters: (filters: ElectionFilter) => void;
}

export function ElectionFilters({ franchises, onApplyFilters }: ElectionFiltersProps) {
  const [franchiseId, setFranchiseId] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("");

  // Get user role from localStorage to determine if franchise filter should be shown
  useEffect(() => {
    const userDataString = localStorage.getItem('user');
    if (userDataString) {
      const userData = JSON.parse(userDataString);
      setUserRole(userData?.role || "");
      
      // If franchise admin, set their franchise ID in the filter
      if (userData?.role === 'franchise_admin' && userData?.franchiseId) {
        setFranchiseId(userData.franchiseId.toString());
      }
    }
  }, []);

  const handleApplyFilters = () => {
    const filters: ElectionFilter = {};
    
    if (franchiseId && franchiseId !== "all") {
      filters.franchiseId = franchiseId;
    }
    
    if (status) {
      filters.status = status;
    }
    
    if (dateFrom) {
      filters.dateFrom = new Date(dateFrom);
    }
    
    onApplyFilters(filters);
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Only show franchise filter if user is not a franchise admin */}
          {userRole !== 'franchise_admin' && (
            <div>
              <Label htmlFor="franchise-filter">Franchise</Label>
              <Select
                value={franchiseId}
                onValueChange={setFranchiseId}
              >
                <SelectTrigger id="franchise-filter" className="mt-1">
                  <SelectValue placeholder="All Franchises" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Franchises</SelectItem>
                  {franchises && franchises.map((franchise) => (
                    <SelectItem 
                      key={franchise._id?.toString() || String(franchise.id)} 
                      value={franchise._id?.toString() || String(franchise.id)}
                    >
                      {franchise.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor="status-filter">Status</Label>
            <Select
              value={status}
              onValueChange={setStatus}
            >
              <SelectTrigger id="status-filter" className="mt-1">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="date-filter">Date From</Label>
            <Input
              id="date-filter"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="mt-1"
            />
          </div>

          <div className="flex items-end">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleApplyFilters}
            >
              <FilterIcon className="mr-2 h-4 w-4" />
              Apply Filters
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
