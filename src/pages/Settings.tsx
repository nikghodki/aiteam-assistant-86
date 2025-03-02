
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { oidcApi, OIDCConfig } from '@/services/api';
import { Loader2 } from 'lucide-react';

const defaultConfig: Record<string, OIDCConfig> = {
  google: {
    clientId: '',
    authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenEndpoint: 'https://oauth2.googleapis.com/token',
    redirectUri: `${window.location.origin}/auth/callback`,
    scope: 'openid profile email',
    responseType: 'code',
  },
  azure: {
    clientId: '',
    authorizationEndpoint: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenEndpoint: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    redirectUri: `${window.location.origin}/auth/callback`,
    scope: 'openid profile email',
    responseType: 'code',
  },
  custom: {
    clientId: '',
    authorizationEndpoint: '',
    tokenEndpoint: '',
    redirectUri: `${window.location.origin}/auth/callback`,
    scope: 'openid profile email',
    responseType: 'code',
  }
};

const Settings = () => {
  const { saveOIDCConfig } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('google');
  const [configs, setConfigs] = useState<Record<string, OIDCConfig>>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchConfigs = async () => {
      setLoading(true);
      try {
        const providers = ['google', 'azure', 'custom'];
        const fetchedConfigs: Record<string, OIDCConfig> = { ...defaultConfig };
        
        for (const provider of providers) {
          try {
            const config = await oidcApi.getConfig(provider);
            if (config) {
              fetchedConfigs[provider] = config;
            }
          } catch (error) {
            console.log(`No saved configuration for ${provider}`);
          }
        }
        
        setConfigs(fetchedConfigs);
      } catch (error) {
        console.error('Error fetching OIDC configurations:', error);
        toast({
          title: "Error loading configurations",
          description: "Failed to load saved OIDC configurations.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchConfigs();
  }, []);

  const handleInputChange = (provider: string, field: keyof OIDCConfig, value: string) => {
    setConfigs(prev => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        [field]: value
      }
    }));
  };

  const handleSave = async (provider: string) => {
    setSaving(true);
    try {
      // Save to API
      await oidcApi.saveConfig(provider, configs[provider]);
      
      // Also save to local storage for backward compatibility
      saveOIDCConfig(provider, configs[provider]);
      
      toast({
        title: "Settings saved",
        description: `OIDC configuration for ${provider} has been saved.`,
      });
    } catch (error) {
      console.error(`Error saving ${provider} configuration:`, error);
      toast({
        title: "Save failed",
        description: `Failed to save OIDC configuration for ${provider}.`,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading configurations...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-professional-gray-light/30 to-professional-purple-light/10 p-6">
      <div className="container mx-auto">
        <div className="flex flex-col space-y-2 mb-6">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Configure your application settings and integrations</p>
        </div>

        <div className="grid gap-6">
          <Card className="border border-border/50 shadow-md backdrop-blur-sm">
            <CardHeader>
              <CardTitle>OIDC Authentication Configuration</CardTitle>
              <CardDescription>
                Configure OIDC providers for Single Sign-On capabilities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="mb-4 w-full md:w-auto">
                  <TabsTrigger value="google">Google</TabsTrigger>
                  <TabsTrigger value="azure">Microsoft Azure</TabsTrigger>
                  <TabsTrigger value="custom">Custom Provider</TabsTrigger>
                </TabsList>
                
                {(['google', 'azure', 'custom'] as const).map(provider => (
                  <TabsContent key={provider} value={provider} className="space-y-4">
                    <div className="space-y-4">
                      <div>
                        <label htmlFor={`${provider}-client-id`} className="block text-sm font-medium mb-1">
                          Client ID
                        </label>
                        <Input
                          id={`${provider}-client-id`}
                          value={configs[provider].clientId}
                          onChange={e => handleInputChange(provider, 'clientId', e.target.value)}
                          placeholder="Enter your client ID"
                        />
                      </div>
                      
                      {provider === 'custom' && (
                        <>
                          <div>
                            <label htmlFor="auth-endpoint" className="block text-sm font-medium mb-1">
                              Authorization Endpoint
                            </label>
                            <Input
                              id="auth-endpoint"
                              value={configs.custom.authorizationEndpoint}
                              onChange={e => handleInputChange('custom', 'authorizationEndpoint', e.target.value)}
                              placeholder="https://your-identity-provider.com/authorize"
                            />
                          </div>
                          
                          <div>
                            <label htmlFor="token-endpoint" className="block text-sm font-medium mb-1">
                              Token Endpoint
                            </label>
                            <Input
                              id="token-endpoint"
                              value={configs.custom.tokenEndpoint}
                              onChange={e => handleInputChange('custom', 'tokenEndpoint', e.target.value)}
                              placeholder="https://your-identity-provider.com/token"
                            />
                          </div>
                        </>
                      )}
                      
                      <div>
                        <label htmlFor={`${provider}-redirect-uri`} className="block text-sm font-medium mb-1">
                          Redirect URI
                        </label>
                        <Input
                          id={`${provider}-redirect-uri`}
                          value={configs[provider].redirectUri}
                          onChange={e => handleInputChange(provider, 'redirectUri', e.target.value)}
                          placeholder="Your application callback URL"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          You need to register this URI in your OIDC provider's configuration
                        </p>
                      </div>
                      
                      <div>
                        <label htmlFor={`${provider}-scope`} className="block text-sm font-medium mb-1">
                          Scope
                        </label>
                        <Input
                          id={`${provider}-scope`}
                          value={configs[provider].scope}
                          onChange={e => handleInputChange(provider, 'scope', e.target.value)}
                          placeholder="openid profile email"
                        />
                      </div>
                    </div>
                    
                    <div className="pt-4">
                      <Button 
                        onClick={() => handleSave(provider)}
                        disabled={saving}
                      >
                        {saving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          `Save ${provider.charAt(0).toUpperCase() + provider.slice(1)} Settings`
                        )}
                      </Button>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
          
          <Card className="border border-border/50 shadow-md backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Advanced Configuration</CardTitle>
              <CardDescription>
                Additional configuration options and settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label htmlFor="jwt-validation" className="block text-sm font-medium mb-1">
                    JWT Validation Rules
                  </label>
                  <Textarea
                    id="jwt-validation"
                    placeholder="Enter custom JWT validation rules (JSON format)"
                    className="min-h-[120px]"
                  />
                </div>
                
                <Separator className="my-4" />
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Security Settings
                  </label>
                  <div className="flex space-x-4">
                    <Button variant="outline">Configure MFA</Button>
                    <Button variant="outline">Session Settings</Button>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => navigate('/dashboard')}>
                Back to Dashboard
              </Button>
              <Button variant="secondary">Save Advanced Settings</Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
