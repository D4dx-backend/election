import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Election } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Upload, FileSpreadsheet, List, UploadCloud } from 'lucide-react';

// Form schema for single nominee
const singleNomineeSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  electionId: z.string().min(1, { message: 'Please select an election' }),
  gender: z.enum(['male', 'female']).optional(),
});

// Form schema for bulk nominees
const bulkNomineeSchema = z.object({
  namesWithGender: z.string().min(2, { message: 'Please enter comma-separated nominee names with gender (e.g., John Doe-male, Jane Smith-female)' }),
  electionId: z.string().min(1, { message: 'Please select an election' }),
});

// Form schema for import from previous election
const importPreviousSchema = z.object({
  sourceElectionId: z.string().min(1, { message: 'Please select a source election' }),
  targetElectionId: z.string().min(1, { message: 'Please select a target election' }),
});

type SingleNomineeFormValues = z.infer<typeof singleNomineeSchema>;
type BulkNomineeFormValues = {
  namesWithGender: string;
  electionId: string;
};
type ImportPreviousFormValues = z.infer<typeof importPreviousSchema>;

interface NomineeFormProps {
  onSuccess: () => void;
  elections: Election[];
  initialData?: any;
  isEdit?: boolean;
}

export function NomineeForm({ onSuccess, elections, initialData, isEdit = false }: NomineeFormProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>(isEdit ? 'single' : 'single');
  const [importFile, setImportFile] = useState<File | null>(null);

  // Resolve whether a given election uses gender-based selection.
  const isGenderBased = (electionId?: string) => {
    if (!electionId) return false;
    const found = (elections || []).find(
      (e) => (e._id?.toString() || (e as any).id?.toString()) === electionId
    );
    return !!(found as any)?.genderBasedSelection;
  };

  // Single nominee form
  const singleForm = useForm<SingleNomineeFormValues>({
    resolver: zodResolver(singleNomineeSchema),
    defaultValues: {
      name: initialData?.name || '',
      electionId: initialData?.electionId || '',
      gender: initialData?.gender || 'male',
    },
  });

  // Bulk nominees form
  const bulkForm = useForm<BulkNomineeFormValues>({
    resolver: zodResolver(bulkNomineeSchema),
    defaultValues: {
      namesWithGender: '',
      electionId: '',
    },
  });

  // Import from previous election form
  const importPreviousForm = useForm<ImportPreviousFormValues>({
    resolver: zodResolver(importPreviousSchema),
    defaultValues: {
      sourceElectionId: '',
      targetElectionId: '',
    },
  });

  // File import handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportFile(file);
    }
  };

  // Single nominee submission handler
  const onSubmitSingle = async (data: SingleNomineeFormValues) => {
    try {
      if (isEdit && initialData) {
        // Update existing nominee
        await apiRequest(
          'PATCH',
          `/api/nominees/${initialData._id || initialData.id}`,
          {
            name: data.name,
            electionId: data.electionId,
            gender: data.gender, // Include gender field
          }
        );

        toast({
          title: 'Nominee updated',
          description: 'The nominee has been updated successfully',
          variant: 'success'
        });
      } else {
        // Create new nominee
        await apiRequest(
          'POST',
          '/api/nominees',
          {
            name: data.name,
            electionId: data.electionId,
            gender: data.gender, // Include gender field
          }
        );

        toast({
          title: 'Nominee created',
          description: 'The nominee has been successfully created',
          variant: 'success'
        });
      }

      singleForm.reset();
      onSuccess();
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to ${isEdit ? 'update' : 'create'} nominee: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive'
      });
    }
  };

  // Bulk nominees submission handler
  const onSubmitBulk = async (data: BulkNomineeFormValues) => {
    try {
      const genderBased = isGenderBased(data.electionId);
      // First, normalize the input by combining both commas and newlines as separators
      const input = data.namesWithGender.replace(/\n/g, ',');
      
      const entries = input.split(',');
      const nominees = [];
      const errors = [];
      
      for (const entry of entries) {
        const trimmed = entry.trim();
        if (!trimmed) continue;

        if (!genderBased) {
          // Neutral selection: each entry is simply a nominee name.
          nominees.push({
            name: trimmed,
            electionId: data.electionId,
            status: 'active'
          });
          continue;
        }

        // Parse the name-gender format (e.g., "John Doe-m" or "Jane Smith-f")
        const parts = trimmed.split('-');
        
        if (parts.length !== 2) {
          errors.push(`"${trimmed}" doesn't follow the required format "Name-m" or "Name-f"`);
          continue;
        }
        
        const name = parts[0].trim();
        const genderCode = parts[1].trim().toLowerCase();
        
        // Validate gender code is either m or f
        if (genderCode !== 'm' && genderCode !== 'f') {
          errors.push(`Gender code for "${name}" must be "m" or "f", not "${genderCode}"`);
          continue;
        }
        
        nominees.push({
          name,
          electionId: data.electionId,
          gender: genderCode === 'm' ? 'male' : 'female',
          status: 'active'
        });
      }
      
      // Report any validation errors
      if (errors.length > 0) {
        toast({
          title: 'Format errors detected',
          description: errors.slice(0, 3).join('; ') + (errors.length > 3 ? ` and ${errors.length - 3} more errors` : ''),
          variant: 'destructive'
        });
        return;
      }
      
      if (nominees.length === 0) {
        toast({
          title: 'No valid nominees',
          description: 'Please enter nominee names with gender using format: "Name-m" or "Name-f", separated by commas',
          variant: 'destructive'
        });
        return;
      }

      // Log the nominees being sent to help with debugging
      console.log('Sending nominees to API:', nominees);
      
      await apiRequest(
        'POST',
        '/api/nominees/bulk',
        {
          nominees,
          electionId: data.electionId
        }
      );

      toast({
        title: 'Nominees created',
        description: `Successfully created ${nominees.length} nominees`,
        variant: 'success'
      });

      bulkForm.reset();
      onSuccess();
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to create nominees: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive'
      });
    }
  };

  // Import from previous election submission handler
  const onSubmitImportPrevious = async (data: ImportPreviousFormValues) => {
    try {
      await apiRequest(
        'POST',
        '/api/nominees/import-previous',
        {
          sourceElectionId: data.sourceElectionId,
          targetElectionId: data.targetElectionId
        }
      );

      toast({
        title: 'Nominees imported',
        description: 'Successfully imported nominees from the selected election',
        variant: 'success'
      });

      importPreviousForm.reset();
      onSuccess();
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to import nominees: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive'
      });
    }
  };

  // File import submission handler
  const onSubmitFileImport = async () => {
    if (!importFile) {
      toast({
        title: 'No file selected',
        description: 'Please select a file to import',
        variant: 'destructive'
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', importFile);

      // Use fetch directly for file upload
      const response = await fetch('/api/nominees/import-file', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      toast({
        title: 'File uploaded',
        description: 'The nominees are being processed and will be added shortly',
        variant: 'success'
      });

      setImportFile(null);
      onSuccess();
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to import file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive'
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{isEdit ? 'Edit Nominee' : 'Add Nominees'}</CardTitle>
      </CardHeader>
      <CardContent>
        {isEdit ? (
          <Form {...singleForm}>
            <form onSubmit={singleForm.handleSubmit(onSubmitSingle)} className="space-y-6">
              <div className="space-y-4">
                {/* Election selection (disabled in edit mode) */}
                <FormField
                  control={singleForm.control}
                  name="electionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Election</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={true} // Can't change election in edit mode
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an election" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.isArray(elections) && elections.map((election) => {
                                const electionId = election._id?.toString() || election.id?.toString();
                                const title = election.title || 'Untitled';
                                const organization = election.organization || 'Organization';

                                if (!electionId) return null;
                                return (
                                  <SelectItem key={electionId} value={electionId}>
                                    {title} - {organization}
                                  </SelectItem>
                                );
                              })}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Nominee name */}
                <FormField
                  control={singleForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter nominee name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Nominee gender */}
                {isGenderBased(singleForm.watch('electionId')) && (
                <FormField
                  control={singleForm.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                )}
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onSuccess()}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={singleForm.formState.isSubmitting}>
                  {singleForm.formState.isSubmitting ? 'Updating...' : 'Update Nominee'}
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <Tabs defaultValue="single" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 mb-6">
              <TabsTrigger value="single">Single</TabsTrigger>
              <TabsTrigger value="bulk">Bulk</TabsTrigger>
              <TabsTrigger value="previous">From Previous</TabsTrigger>
              <TabsTrigger value="file">Excel Import</TabsTrigger>
            </TabsList>

            {/* Single nominee tab */}
            <TabsContent value="single">
              <Form {...singleForm}>
                <form onSubmit={singleForm.handleSubmit(onSubmitSingle)} className="space-y-6">
                  <div className="space-y-4">
                    {/* Election selection */}
                    <FormField
                      control={singleForm.control}
                      name="electionId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Election</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select an election" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Array.isArray(elections) && elections.map((election) => {
                                const electionId = election._id?.toString() || election.id?.toString();
                                const title = election.title || 'Untitled';
                                const organization = election.organization || 'Organization';

                                if (!electionId) return null;
                                return (
                                  <SelectItem key={electionId} value={electionId}>
                                    {title} - {organization}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Nominee name */}
                    <FormField
                      control={singleForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter nominee name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Nominee gender */}
                    {isGenderBased(singleForm.watch('electionId')) && (
                    <FormField
                      control={singleForm.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gender</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select gender" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    )}
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onSuccess()}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={singleForm.formState.isSubmitting}>
                      {singleForm.formState.isSubmitting ? 'Creating...' : 'Create Nominee'}
                    </Button>
                  </div>
                </form>
              </Form>
            </TabsContent>

            {/* Bulk nominees tab */}
            <TabsContent value="bulk">
              <Form {...bulkForm}>
                <form onSubmit={bulkForm.handleSubmit(onSubmitBulk)} className="space-y-6">
                  <div className="space-y-4">
                    {/* Election selection */}
                    <FormField
                      control={bulkForm.control}
                      name="electionId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Election</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select an election" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Array.isArray(elections) && elections.map((election) => {
                                const electionId = election._id?.toString() || election.id?.toString();
                                const title = election.title || 'Untitled';
                                const organization = election.organization || 'Organization';

                                if (!electionId) return null;
                                return (
                                  <SelectItem key={electionId} value={electionId}>
                                    {title} - {organization}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Comma-separated names with gender */}
                    <FormField
                      control={bulkForm.control}
                      name="namesWithGender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {isGenderBased(bulkForm.watch('electionId'))
                              ? 'Nominee Names with Gender (comma-separated)'
                              : 'Nominee Names (comma-separated)'}
                          </FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder={isGenderBased(bulkForm.watch('electionId'))
                                ? 'Enter nominee names with gender separated by commas, e.g: John Doe-m, Jane Smith-f'
                                : 'Enter nominee names separated by commas, e.g: John Doe, Jane Smith, Alex Johnson'}
                              className="min-h-[100px]"
                              {...field} 
                            />
                          </FormControl>
                          <div className="text-xs text-muted-foreground">
                            {isGenderBased(bulkForm.watch('electionId'))
                              ? 'Format: Name-gender (m for male, f for female) separated by commas. Example: John Doe-m, Jane Smith-f'
                              : 'Enter one name per entry, separated by commas or new lines.'}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onSuccess()}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={bulkForm.formState.isSubmitting}>
                      {bulkForm.formState.isSubmitting ? 'Creating...' : 'Create Nominees'}
                    </Button>
                  </div>
                </form>
              </Form>
            </TabsContent>

            {/* Import from previous election tab */}
            <TabsContent value="previous">
              <Form {...importPreviousForm}>
                <form onSubmit={importPreviousForm.handleSubmit(onSubmitImportPrevious)} className="space-y-6">
                  <div className="space-y-4">
                    {/* Source election selection */}
                    <FormField
                      control={importPreviousForm.control}
                      name="sourceElectionId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Source Election</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select source election" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Array.isArray(elections) && elections.map((election) => {
                                const electionId = election._id?.toString() || election.id?.toString();
                                const title = election.title || 'Untitled';
                                const organization = election.organization || 'Organization';

                                if (!electionId) return null;
                                return (
                                  <SelectItem key={electionId} value={electionId}>
                                    {title} - {organization}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                          <div className="text-xs text-muted-foreground">
                            Select the election to import nominees from
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Target election selection */}
                    <FormField
                      control={importPreviousForm.control}
                      name="targetElectionId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target Election</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select target election" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Array.isArray(elections) && elections.map((election) => {
                                const electionId = election._id?.toString() || election.id?.toString();
                                const title = election.title || 'Untitled';
                                const organization = election.organization || 'Organization';

                                if (!electionId) return null;
                                return (
                                  <SelectItem key={electionId} value={electionId}>
                                    {title} - {organization}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                          <div className="text-xs text-muted-foreground">
                            Select the election to add the nominees to
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onSuccess()}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={importPreviousForm.formState.isSubmitting}>
                      {importPreviousForm.formState.isSubmitting ? 'Importing...' : 'Import Nominees'}
                    </Button>
                  </div>
                </form>
              </Form>
            </TabsContent>

            {/* Excel import tab */}
            <TabsContent value="file">
              <div className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-medium mb-2">Excel File</div>
                    <div className="mt-2 flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <div className="w-8 h-8 mb-2 text-gray-500">📊</div>
                          <p className="mb-2 text-sm text-gray-500">
                            <span className="font-semibold">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-gray-500">Excel (.xlsx) or CSV (.csv)</p>
                          {importFile && (
                            <p className="mt-2 text-sm text-blue-600 font-semibold">
                              {importFile.name}
                            </p>
                          )}
                        </div>
                        <input 
                          type="file" 
                          className="hidden" 
                          onChange={handleFileChange}
                          accept=".xlsx,.csv"
                        />
                      </label>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      Upload an Excel file with nominee names. The file should have a column labeled 'name'.
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onSuccess()}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="button" 
                    onClick={onSubmitFileImport}
                    disabled={!importFile}
                  >
                    Import Nominees
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}