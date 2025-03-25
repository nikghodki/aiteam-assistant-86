
import React from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import ReleaseChat from '@/components/release/ReleaseChat';
import ReleaseTimeline from '@/components/release/ReleaseTimeline';
import { getReleases } from '@/services/releaseApi';

interface Release {
  id: string;
  name: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'failed';
  scheduledTime: string;
  completedTime?: string;
  environments: string[];
}

const ReleaseDeployment = () => {
  // Fetch releases from the API
  const { data: releases = [], isLoading } = useQuery({
    queryKey: ['releases'],
    queryFn: getReleases,
  });

  // Get active/ongoing release if any
  const activeRelease = releases.find((release: Release) => release.status === 'in-progress');
  
  // Get upcoming releases (scheduled)
  const upcomingReleases = releases.filter((release: Release) => release.status === 'scheduled');
  
  // Recent releases (completed or failed)
  const recentReleases = releases.filter(
    (release: Release) => ['completed', 'failed'].includes(release.status)
  ).slice(0, 5);

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Release Deployment Management</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Release Status Column */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Active Release */}
              <Card>
                <CardHeader>
                  <CardTitle>Active Release</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center p-4">
                      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : activeRelease ? (
                    <div className="p-4 border rounded-md">
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium">{activeRelease.name}</h3>
                        <Badge className="bg-blue-500">in-progress</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        Started: {new Date(activeRelease.scheduledTime).toLocaleString()}
                      </p>
                      <div className="mt-2">
                        <p className="text-sm font-medium">Environments:</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {activeRelease.environments.map((env) => (
                            <Badge key={env} variant="outline">{env}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 p-4">
                      No active releases at the moment
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Upcoming Releases */}
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Releases</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center p-4">
                      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : upcomingReleases.length === 0 ? (
                    <div className="text-center text-gray-500 p-4">
                      No upcoming releases scheduled
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {upcomingReleases.map((release: Release) => (
                        <div key={release.id} className="p-3 border rounded-md">
                          <div className="flex justify-between items-center">
                            <h3 className="font-medium">{release.name}</h3>
                            <Badge className="bg-yellow-500">scheduled</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            Scheduled: {new Date(release.scheduledTime).toLocaleString()}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {release.environments.map((env) => (
                              <Badge key={env} variant="outline">{env}</Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Recent Releases */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Releases</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center p-4">
                      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : recentReleases.length === 0 ? (
                    <div className="text-center text-gray-500 p-4">
                      No recent releases
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentReleases.map((release: Release) => (
                        <div key={release.id} className="p-3 border rounded-md">
                          <div className="flex justify-between items-center">
                            <h3 className="font-medium">{release.name}</h3>
                            <Badge className={release.status === 'completed' ? 'bg-green-500' : 'bg-red-500'}>
                              {release.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            Completed: {new Date(release.completedTime || '').toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Main Content Column */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {/* Release Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle>Deployment Timeline</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <ReleaseTimeline releases={releases} isLoading={isLoading} />
                </CardContent>
              </Card>
              
              {/* Chat Interface */}
              <Card>
                <CardHeader>
                  <CardTitle>Release Assistant</CardTitle>
                </CardHeader>
                <CardContent>
                  <ReleaseChat />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ReleaseDeployment;
