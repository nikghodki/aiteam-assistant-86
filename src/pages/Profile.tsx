
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { User, Mail, Building, MapPin, Calendar, Settings as SettingsIcon } from 'lucide-react';
import Header from '@/components/layout/Header';
import Settings from './Settings';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    company: 'Cisco Systems',
    location: 'San Jose, CA',
    joinDate: 'March 2023',
    bio: 'Engineering professional focused on cloud infrastructure and automation tools.',
    role: 'Senior DevOps Engineer',
    team: 'Cloud Infrastructure',
  });

  const handleInputChange = (field: string, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveChanges = () => {
    toast({
      title: "Profile updated",
      description: "Your profile information has been updated successfully.",
    });
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-professional-gray-light/30 to-professional-purple-light/10">
      <Header />
      <div className="container mx-auto px-4 pt-24 pb-10">
        <div className="flex flex-col space-y-2 mb-6">
          <h1 className="text-3xl font-bold">User Profile</h1>
          <p className="text-muted-foreground">
            Manage your account information and settings
          </p>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <div className="flex justify-between items-center">
            <TabsList className="grid w-full md:w-auto grid-cols-2 md:inline-flex">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User size={16} />
                <span className="hidden md:inline">Profile</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <SettingsIcon size={16} />
                <span className="hidden md:inline">Settings</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="profile" className="space-y-6">
            <Card className="border border-border/50 shadow-md backdrop-blur-sm">
              <CardHeader className="pb-4 flex flex-row justify-between items-start">
                <div>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>
                    Your profile details and personal information
                  </CardDescription>
                </div>
                <Button 
                  variant={isEditing ? "outline" : "default"} 
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? "Cancel" : "Edit Profile"}
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  <div className="flex flex-col items-center space-y-3">
                    <Avatar className="w-24 h-24">
                      <AvatarImage src={user?.photoUrl || ''} alt={user?.name || 'User'} />
                      <AvatarFallback className="text-2xl bg-professional-purple-light text-professional-purple-dark">
                        {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    {isEditing && (
                      <Button variant="outline" size="sm">
                        Change Photo
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Full Name
                      </label>
                      <div className="flex items-center border rounded-md focus-within:ring-1 focus-within:ring-ring">
                        <User className="ml-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="name" 
                          value={profileData.name} 
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          readOnly={!isEditing}
                          className="border-0 focus-visible:ring-0" 
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Email Address
                      </label>
                      <div className="flex items-center border rounded-md focus-within:ring-1 focus-within:ring-ring">
                        <Mail className="ml-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="email" 
                          value={user?.email || ''} 
                          disabled 
                          className="border-0 focus-visible:ring-0" 
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="company" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Company
                      </label>
                      <div className="flex items-center border rounded-md focus-within:ring-1 focus-within:ring-ring">
                        <Building className="ml-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="company" 
                          value={profileData.company} 
                          onChange={(e) => handleInputChange('company', e.target.value)}
                          readOnly={!isEditing}
                          className="border-0 focus-visible:ring-0" 
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="location" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Location
                      </label>
                      <div className="flex items-center border rounded-md focus-within:ring-1 focus-within:ring-ring">
                        <MapPin className="ml-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="location" 
                          value={profileData.location} 
                          onChange={(e) => handleInputChange('location', e.target.value)}
                          readOnly={!isEditing}
                          className="border-0 focus-visible:ring-0" 
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="role" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Role
                      </label>
                      <div className="flex items-center border rounded-md focus-within:ring-1 focus-within:ring-ring">
                        <User className="ml-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="role" 
                          value={profileData.role} 
                          onChange={(e) => handleInputChange('role', e.target.value)}
                          readOnly={!isEditing}
                          className="border-0 focus-visible:ring-0" 
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="team" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Team
                      </label>
                      <div className="flex items-center border rounded-md focus-within:ring-1 focus-within:ring-ring">
                        <Building className="ml-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="team" 
                          value={profileData.team} 
                          onChange={(e) => handleInputChange('team', e.target.value)}
                          readOnly={!isEditing}
                          className="border-0 focus-visible:ring-0" 
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="space-y-3">
                  <h3 className="text-lg font-medium">About Me</h3>
                  
                  <div className="space-y-2">
                    <label htmlFor="bio" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Bio
                    </label>
                    <textarea 
                      id="bio" 
                      value={profileData.bio} 
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      readOnly={!isEditing}
                      className="w-full min-h-[100px] p-3 rounded-md border border-input bg-background text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                </div>

                {isEditing && (
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                    <Button type="button" onClick={handleSaveChanges}>
                      Save Changes
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Settings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
