import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertElectionSchema } from "@shared/schema";
import { ElectionGroup } from "@/lib/types";

// Extend the insert schema with validation rules
const formSchema = insertElectionSchema
  .extend({
    electionDate: z.string().min(1, "Election date is required"),
    numberToBeElected: z.number().min(1, "Must elect at least 1 person"),
    franchiseId: z.any().optional(), // Accept MongoDB ObjectId or number
    file: z.any().optional()
  });

type FormValues = z.infer<typeof formSchema>;

// Import Franchise type
import { Franchise } from "@shared/schema";

interface ElectionFormProps {
  initialValues?: Partial<FormValues>;
  electionGroups: ElectionGroup[];
  franchises?: Franchise[];
  showFranchiseSelect?: boolean;
  onSubmit: (values: FormValues) => void;
  onCancel: () => void;
}

export function ElectionForm({ 
  initialValues, 
  electionGroups,
  franchises = [],
  showFranchiseSelect = false,
  onSubmit, 
  onCancel 
}: ElectionFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const { register, handleSubmit, formState, setValue, watch } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      organization: initialValues?.organization || "",
      title: initialValues?.title || "",
      electionDate: initialValues?.electionDate 
        ? (initialValues.electionDate ? 
            (typeof initialValues.electionDate === 'string' 
              ? initialValues.electionDate 
              : initialValues.electionDate instanceof Date 
                ? initialValues.electionDate.toISOString().split('T')[0]
                : new Date().toISOString().split('T')[0])
            : new Date().toISOString().split('T')[0]) 
        : new Date().toISOString().split('T')[0],
      numberToBeElected: initialValues?.numberToBeElected || 1,
      nomineeDisplayOrder: initialValues?.nomineeDisplayOrder || "ALPHA",
      maxVoters: initialValues?.maxVoters || 0,
      maxNominees: initialValues?.maxNominees || 0,
      maleMinimum: initialValues?.maleMinimum || 0,
      femaleMinimum: initialValues?.femaleMinimum || 0,
      selfRegOpen: initialValues?.selfRegOpen || false,
      votingOpen: initialValues?.votingOpen || false,
      franchiseId: initialValues?.franchiseId || undefined, // No default franchise
      
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <Label htmlFor="organization">Organization Name</Label>
              <Input
                id="organization"
                placeholder="e.g. Global Technologies Corp"
                {...register("organization")}
                className="mt-1"
              />
              {formState.errors.organization && (
                <p className="text-sm text-red-500 mt-1">{formState.errors.organization.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="title">Election Title</Label>
              <Input
                id="title"
                placeholder="e.g. Board Member Election"
                {...register("title")}
                className="mt-1"
              />
              {formState.errors.title && (
                <p className="text-sm text-red-500 mt-1">{formState.errors.title.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <Label htmlFor="electionDate">Election Date</Label>
              <Input
                id="electionDate"
                type="date"
                {...register("electionDate")}
                className="mt-1"
              />
              {formState.errors.electionDate && (
                <p className="text-sm text-red-500 mt-1">{formState.errors.electionDate.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="numberToBeElected">Number of Positions</Label>
              <Input
                id="numberToBeElected"
                type="number"
                min="1"
                placeholder="e.g. 5"
                {...register("numberToBeElected", { valueAsNumber: true })}
                className="mt-1"
              />
              {formState.errors.numberToBeElected && (
                <p className="text-sm text-red-500 mt-1">{formState.errors.numberToBeElected.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="nomineeDisplayOrder">Nominee Display Order</Label>
              <Select 
                onValueChange={(value) => setValue("nomineeDisplayOrder", value)}
                defaultValue={watch("nomineeDisplayOrder") || undefined}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALPHA">Alphabetical</SelectItem>
                  <SelectItem value="VOTE">Vote Count</SelectItem>
                  <SelectItem value="CUSTOM">Custom Order</SelectItem>
                </SelectContent>
              </Select>
              {formState.errors.nomineeDisplayOrder && (
                <p className="text-sm text-red-500 mt-1">{formState.errors.nomineeDisplayOrder.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div>
              <Label htmlFor="maxVoters">Max Voters</Label>
              <Input
                id="maxVoters"
                type="number"
                min="0"
                placeholder="e.g. 500"
                {...register("maxVoters", { valueAsNumber: true })}
                className="mt-1"
              />
              {formState.errors.maxVoters && (
                <p className="text-sm text-red-500 mt-1">{formState.errors.maxVoters.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="maxNominees">Max Nominees</Label>
              <Input
                id="maxNominees"
                type="number"
                min="0"
                placeholder="e.g. 20"
                {...register("maxNominees", { valueAsNumber: true })}
                className="mt-1"
              />
              {formState.errors.maxNominees && (
                <p className="text-sm text-red-500 mt-1">{formState.errors.maxNominees.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="maleMinimum">Male Minimum</Label>
              <Input
                id="maleMinimum"
                type="number"
                min="0"
                placeholder="e.g. 2"
                {...register("maleMinimum", { valueAsNumber: true })}
                className="mt-1"
              />
              {formState.errors.maleMinimum && (
                <p className="text-sm text-red-500 mt-1">{formState.errors.maleMinimum.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="femaleMinimum">Female Minimum</Label>
              <Input
                id="femaleMinimum"
                type="number"
                min="0"
                placeholder="e.g. 2"
                {...register("femaleMinimum", { valueAsNumber: true })}
                className="mt-1"
              />
              {formState.errors.femaleMinimum && (
                <p className="text-sm text-red-500 mt-1">{formState.errors.femaleMinimum.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="selfRegOpen" 
                checked={watch("selfRegOpen") === true}
                onCheckedChange={(checked) => setValue("selfRegOpen", checked as boolean)}
              />
              <div>
                <Label 
                  htmlFor="selfRegOpen" 
                  className="font-medium text-gray-700 cursor-pointer"
                >
                  Allow Self Registration
                </Label>
                <p className="text-xs text-gray-500">Enable voters to self-register for this election</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="votingOpen" 
                checked={watch("votingOpen") === true}
                onCheckedChange={(checked) => setValue("votingOpen", checked as boolean)}
              />
              <div>
                <Label 
                  htmlFor="votingOpen" 
                  className="font-medium text-gray-700 cursor-pointer"
                >
                  Open Voting
                </Label>
                <p className="text-xs text-gray-500">Enable voting as soon as election is created</p>
              </div>
            </div>
          </div>

          {showFranchiseSelect && (
            <div className="mb-6">
              <Label htmlFor="franchiseId">Franchise</Label>
              <Select 
                onValueChange={(value) => {
                  // Store the franchise ID in the form
                  if (value) {
                    setValue("franchiseId", value);
                  } else {
                    setValue("franchiseId", undefined);
                  }
                }}
                defaultValue={
                  watch("franchiseId") 
                    ? String(watch("franchiseId")) 
                    : ""
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select franchise" />
                </SelectTrigger>
                <SelectContent>
                  {franchises && franchises.length > 0 && franchises.map(franchise => {
                    if (!franchise) return null;
                    
                    // Handle MongoDB _id or regular id
                    let franchiseId = '';
                    try {
                      franchiseId = franchise._id ? franchise._id.toString() : 
                                  franchise.id ? franchise.id.toString() : '';
                    } catch (err) {
                      console.log('Error getting franchise ID:', err);
                      return null;
                    }
                    
                    const name = franchise.name || '';
                    if (!franchiseId) return null;
                    
                    return (
                      <SelectItem key={franchiseId} value={franchiseId}>
                        {name}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {formState.errors.franchiseId && (
                <p className="text-sm text-red-500 mt-1">{formState.errors.franchiseId.message}</p>
              )}
            </div>
          )}

          

          <div className="mb-6">
            <Label htmlFor="logo">Election Logo (Optional)</Label>
            <div className="flex items-center mt-1">
              <Input
                id="logo"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <Label 
                htmlFor="logo"
                className="cursor-pointer inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                <Upload className="mr-2 h-4 w-4" />
                Choose File
              </Label>
              <span className="ml-2 text-sm text-gray-500">
                {selectedFile ? selectedFile.name : "No file chosen"}
              </span>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={formState.isSubmitting}>
              {initialValues ? "Update Election" : "Create Election"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
