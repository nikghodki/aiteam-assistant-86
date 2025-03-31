
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Settings, UserCircle, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/'); // Updated to redirect to home page
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account",
      });
    } catch (error) {
      console.error('Logout failed:', error);
      toast({
        title: "Logout failed",
        description: "There was a problem logging you out",
        variant: "destructive",
      });
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div className="bg-gradient-professional p-8 rounded-lg shadow-sm border border-border/30">
          <h1 className="text-3xl font-bold text-foreground">Profile</h1>
          <p className="text-muted-foreground mt-2 max-w-3xl">
            Manage your personal information and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>User Information</CardTitle>
              <CardDescription>Your basic account information</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center pt-6">
              <Avatar className="h-32 w-32 mb-4">
                <AvatarImage src={user?.photoUrl || ''} alt={user?.name || 'User'} />
                <AvatarFallback>
                  <UserCircle className="h-16 w-16" />
                </AvatarFallback>
              </Avatar>
              <h3 className="text-xl font-medium">{user?.name}</h3>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <div className="flex gap-2 mt-6">
                <Button variant="outline" size="sm">
                  <Settings className="mr-2 h-4 w-4" />
                  Edit Profile
                </Button>
                <Button variant="destructive" size="sm" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Account Details</CardTitle>
              <CardDescription>Your account information and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-1">Full Name</h4>
                <p className="text-sm text-muted-foreground pb-2">{user?.name}</p>
                <Separator />
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">Email Address</h4>
                <p className="text-sm text-muted-foreground pb-2">{user?.email}</p>
                <Separator />
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">Role</h4>
                <p className="text-sm text-muted-foreground pb-2">User</p>
                <Separator />
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">Member Since</h4>
                <p className="text-sm text-muted-foreground">January 1, 2023</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
