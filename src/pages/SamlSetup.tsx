
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { Shield, Upload, Download, Info, Copy, X, Check } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const SamlSetup = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('general');
  const [samlConfig, setSamlConfig] = useState({
    entityId: window.location.origin,
    assertionConsumerServiceUrl: `${window.location.origin}/api/auth/saml/callback`,
    idpEntityId: '',
    idpSsoUrl: '',
    idpCertificate: '',
    spPrivateKey: '',
    spCertificate: '',
    nameIdFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
    attributeMapping: JSON.stringify({
      email: 'email',
      firstName: 'firstName',
      lastName: 'lastName',
      groups: 'groups'
    }, null, 2)
  });

  const [configSaved, setConfigSaved] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [copied, setCopied] = useState<Record<string, boolean>>({});

  const handleInputChange = (field: string, value: string) => {
    setSamlConfig(prev => ({
      ...prev,
      [field]: value
    }));
    setConfigSaved(false);
  };

  const handleSaveConfig = async () => {
    // In a real implementation, this would save to the backend
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setConfigSaved(true);
      toast({
        title: "SAML Configuration Saved",
        description: "Your SAML settings have been successfully saved.",
      });
    } catch (error) {
      toast({
        title: "Save failed",
        description: "Failed to save SAML configuration.",
        variant: "destructive",
      });
    }
  };

  const handleTestConnection = async () => {
    setTestStatus('loading');
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      setTestStatus('success');
      toast({
        title: "SAML Connection Successful",
        description: "Successfully connected to your Identity Provider.",
      });
    } catch (error) {
      setTestStatus('error');
      toast({
        title: "SAML Connection Failed",
        description: "Failed to connect to your Identity Provider. Please check your settings.",
        variant: "destructive",
      });
    }
  };

  const handleCopyText = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied({ ...copied, [field]: true });
    setTimeout(() => {
      setCopied({ ...copied, [field]: false });
    }, 2000);
  };

  const generateMetadata = () => {
    // In a real implementation, this would generate proper SAML metadata XML
    return `<?xml version="1.0"?>
<md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata" entityID="${samlConfig.entityId}">
  <md:SPSSODescriptor AuthnRequestsSigned="true" WantAssertionsSigned="true" protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <md:KeyDescriptor use="signing">
      <ds:KeyInfo xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
        <ds:X509Data>
          <ds:X509Certificate>
            ${samlConfig.spCertificate.replace(/-----(BEGIN|END) CERTIFICATE-----/g, '')}
          </ds:X509Certificate>
        </ds:X509Data>
      </ds:KeyInfo>
    </md:KeyDescriptor>
    <md:SingleLogoutService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" Location="${window.location.origin}/api/auth/saml/logout"/>
    <md:NameIDFormat>${samlConfig.nameIdFormat}</md:NameIDFormat>
    <md:AssertionConsumerService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="${samlConfig.assertionConsumerServiceUrl}" index="1"/>
  </md:SPSSODescriptor>
</md:EntityDescriptor>`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-professional-gray-light/30 to-professional-purple-light/10 p-6">
      <div className="container mx-auto">
        <div className="flex flex-col space-y-2 mb-6">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">SAML Authentication Setup</h1>
          </div>
          <p className="text-muted-foreground">Configure SAML Single Sign-On for enterprise authentication</p>
        </div>

        <div className="grid gap-6">
          <Card className="border border-border/50 shadow-md">
            <CardHeader>
              <CardTitle>SAML SSO Configuration</CardTitle>
              <CardDescription>
                Set up SAML-based Single Sign-On with your Identity Provider
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="mb-6 w-full grid grid-cols-3">
                  <TabsTrigger value="general">General Settings</TabsTrigger>
                  <TabsTrigger value="idp">Identity Provider</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced Settings</TabsTrigger>
                </TabsList>
                
                <TabsContent value="general">
                  <div className="space-y-6">
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertTitle>Service Provider Information</AlertTitle>
                      <AlertDescription>
                        Share these details with your Identity Provider to establish the SAML connection.
                      </AlertDescription>
                    </Alert>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Entity ID (Issuer)</label>
                        <div className="flex gap-2">
                          <Input 
                            value={samlConfig.entityId} 
                            onChange={(e) => handleInputChange('entityId', e.target.value)}
                            className="flex-1"
                          />
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => handleCopyText(samlConfig.entityId, 'entityId')}
                          >
                            {copied.entityId ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Unique identifier for your application as a Service Provider
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Assertion Consumer Service URL (ACS URL)</label>
                        <div className="flex gap-2">
                          <Input 
                            value={samlConfig.assertionConsumerServiceUrl} 
                            onChange={(e) => handleInputChange('assertionConsumerServiceUrl', e.target.value)}
                            className="flex-1"
                          />
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => handleCopyText(samlConfig.assertionConsumerServiceUrl, 'acsUrl')}
                          >
                            {copied.acsUrl ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          The URL where SAML responses are sent after authentication
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">SP Metadata</label>
                        <div className="relative">
                          <Textarea 
                            value={generateMetadata()} 
                            className="font-mono text-xs h-48"
                            readOnly
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            className="absolute top-2 right-2"
                            onClick={() => handleCopyText(generateMetadata(), 'metadata')}
                          >
                            {copied.metadata ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                            {copied.metadata ? "Copied" : "Copy"}
                          </Button>
                        </div>
                        <div className="flex justify-end mt-2">
                          <Button variant="outline" className="text-xs">
                            <Download className="h-3.5 w-3.5 mr-1" />
                            Download Metadata
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="idp">
                  <div className="space-y-6">
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertTitle>Identity Provider Information</AlertTitle>
                      <AlertDescription>
                        Enter the details provided by your Identity Provider (IdP).
                      </AlertDescription>
                    </Alert>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">IdP Entity ID</label>
                        <Input 
                          value={samlConfig.idpEntityId} 
                          onChange={(e) => handleInputChange('idpEntityId', e.target.value)}
                          placeholder="https://idp.example.com/saml/metadata"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          The unique identifier for your Identity Provider
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">IdP SSO URL</label>
                        <Input 
                          value={samlConfig.idpSsoUrl} 
                          onChange={(e) => handleInputChange('idpSsoUrl', e.target.value)}
                          placeholder="https://idp.example.com/saml/sso"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          The URL to send SAML authentication requests to
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">IdP Certificate</label>
                        <Textarea 
                          value={samlConfig.idpCertificate}
                          onChange={(e) => handleInputChange('idpCertificate', e.target.value)}
                          placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                          className="font-mono text-xs h-32"
                        />
                        <div className="flex justify-end mt-2">
                          <Button variant="outline" className="text-xs">
                            <Upload className="h-3.5 w-3.5 mr-1" />
                            Upload Certificate
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="advanced">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium mb-1">SP Certificate</label>
                      <Textarea 
                        value={samlConfig.spCertificate}
                        onChange={(e) => handleInputChange('spCertificate', e.target.value)}
                        placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                        className="font-mono text-xs h-24"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">SP Private Key</label>
                      <Textarea 
                        value={samlConfig.spPrivateKey}
                        onChange={(e) => handleInputChange('spPrivateKey', e.target.value)}
                        placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
                        className="font-mono text-xs h-24"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">NameID Format</label>
                      <Input 
                        value={samlConfig.nameIdFormat}
                        onChange={(e) => handleInputChange('nameIdFormat', e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Format of the user identifier in SAML assertions
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Attribute Mapping</label>
                      <Textarea 
                        value={samlConfig.attributeMapping}
                        onChange={(e) => handleInputChange('attributeMapping', e.target.value)}
                        className="font-mono text-xs h-32"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        JSON mapping of SAML attributes to user profile fields
                      </p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
            
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => navigate('/settings')}>
                Back to Settings
              </Button>
              
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  onClick={handleTestConnection}
                  disabled={testStatus === 'loading'}
                >
                  {testStatus === 'loading' ? (
                    <>
                      <div className="w-4 h-4 border-2 border-t-transparent border-current rounded-full animate-spin mr-2" />
                      Testing...
                    </>
                  ) : testStatus === 'success' ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Connection Verified
                    </>
                  ) : testStatus === 'error' ? (
                    <>
                      <X className="h-4 w-4 mr-2" />
                      Test Failed
                    </>
                  ) : (
                    'Test Connection'
                  )}
                </Button>
                
                <Button onClick={handleSaveConfig}>
                  {configSaved ? 'Configuration Saved' : 'Save Configuration'}
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SamlSetup;
