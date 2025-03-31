
import React from 'react';
import { Release } from '@/services/releaseApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ReleaseListProps {
  releases: Release[];
  onSelectRelease: (release: Release) => void;
  selectedReleaseId?: string;
  isLoading: boolean;
}

const ReleaseList: React.FC<ReleaseListProps> = ({
  releases,
  onSelectRelease,
  selectedReleaseId,
  isLoading
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-professional-purple border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (releases.length === 0) {
    return (
      <Card className="border border-dashed border-gray-300 h-64 flex flex-col items-center justify-center">
        <div className="text-center p-6">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No releases found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating a new release using the chat assistant.
          </p>
        </div>
      </Card>
    );
  }

  const getStatusColor = (status: Release['status']) => {
    switch(status) {
      case 'planned':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-4">
      {releases.map((release) => (
        <Card 
          key={release.id} 
          className={cn(
            "cursor-pointer hover:border-professional-purple transition-colors",
            selectedReleaseId === release.id && "border-professional-purple"
          )}
          onClick={() => onSelectRelease(release)}
        >
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{release.name}</CardTitle>
                <CardDescription>Version {release.version}</CardDescription>
              </div>
              <Badge
                className={cn(
                  "uppercase text-xs font-medium",
                  getStatusColor(release.status)
                )}
              >
                {release.status}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="text-sm">
              <p className="text-muted-foreground mb-2">Environments</p>
              <div className="flex flex-wrap gap-2">
                {release.environments.map((env, i) => (
                  <Badge key={i} variant="outline">{env}</Badge>
                ))}
              </div>
              <div className="flex justify-between mt-4 text-xs text-muted-foreground">
                <span>Created: {new Date(release.createdAt).toLocaleString()}</span>
                <span>Updated: {new Date(release.updatedAt).toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ReleaseList;
