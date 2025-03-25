
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, Play } from 'lucide-react';

interface Release {
  id: string;
  name: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'failed';
  scheduledTime: string;
  completedTime?: string;
  environments: string[];
}

interface ReleaseTimelineProps {
  releases: Release[];
  isLoading: boolean;
}

const ReleaseTimeline = ({ releases, isLoading }: ReleaseTimelineProps) => {
  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!releases.length) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No releases found. Use the assistant to schedule a release.
      </div>
    );
  }

  // Sort releases by scheduled time (newest first)
  const sortedReleases = [...releases].sort((a, b) => 
    new Date(b.scheduledTime).getTime() - new Date(a.scheduledTime).getTime()
  );

  return (
    <div className="relative space-y-0">
      {/* Vertical line */}
      <div className="absolute left-7 top-0 bottom-0 w-0.5 bg-muted" />
      
      {sortedReleases.map((release, index) => (
        <div key={release.id} className="relative pl-14 pb-8">
          {/* Status icon */}
          <div className="absolute left-4 z-10 transform -translate-x-1/2 bg-white dark:bg-gray-900 p-1 rounded-full">
            {release.status === 'completed' && (
              <div className="bg-green-100 dark:bg-green-900 p-1.5 rounded-full">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            )}
            {release.status === 'failed' && (
              <div className="bg-red-100 dark:bg-red-900 p-1.5 rounded-full">
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
            )}
            {release.status === 'scheduled' && (
              <div className="bg-yellow-100 dark:bg-yellow-900 p-1.5 rounded-full">
                <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
            )}
            {release.status === 'in-progress' && (
              <div className="bg-blue-100 dark:bg-blue-900 p-1.5 rounded-full">
                <Play className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            )}
          </div>
          
          {/* Release card */}
          <div className="border p-4 rounded-md shadow-sm">
            <div className="flex justify-between items-center mb-1">
              <h3 className="font-medium">{release.name}</h3>
              <Badge 
                className={
                  release.status === 'completed' ? 'bg-green-500' : 
                  release.status === 'failed' ? 'bg-red-500' : 
                  release.status === 'in-progress' ? 'bg-blue-500' : 
                  'bg-yellow-500'
                }
              >
                {release.status}
              </Badge>
            </div>
            
            <div className="text-sm text-muted-foreground mb-2">
              <div>Scheduled: {new Date(release.scheduledTime).toLocaleString()}</div>
              {release.completedTime && (
                <div>Completed: {new Date(release.completedTime).toLocaleString()}</div>
              )}
            </div>
            
            <div className="flex flex-wrap gap-1 mt-2">
              {release.environments.map((env) => (
                <Badge key={env} variant="outline">{env}</Badge>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ReleaseTimeline;
