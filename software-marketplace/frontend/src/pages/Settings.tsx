import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Settings as SettingsIcon, User, Building2, Shield, Save, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

export function Settings() {
  const { user, isAuthenticated, updateUser } = useAuth();
  
  const [name, setName] = useState(user?.name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [companyName, setCompanyName] = useState(user?.company_name || '');
  const [companyDescription, setCompanyDescription] = useState(user?.company_description || '');
  const [newCompanyName, setNewCompanyName] = useState('');
  
  const [profileLoading, setProfileLoading] = useState(false);
  const [companyLoading, setCompanyLoading] = useState(false);
  const [becomeSellerLoading, setBecomeSellerLoading] = useState(false);
  
  const [profileSuccess, setProfileSuccess] = useState('');
  const [companySuccess, setCompanySuccess] = useState('');
  const [becomeSellerSuccess, setBecomeSellerSuccess] = useState('');
  
  const [profileError, setProfileError] = useState('');
  const [companyError, setCompanyError] = useState('');
  const [becomeSellerError, setBecomeSellerError] = useState('');

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    setProfileLoading(true);

    try {
      const updatedUser = await api.updateProfile({
        name: name.trim(),
        avatar_url: avatarUrl.trim() || undefined,
      });
      updateUser(updatedUser);
      setProfileSuccess('Profile updated successfully');
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleCompanyUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCompanyError('');
    setCompanySuccess('');
    setCompanyLoading(true);

    try {
      const updatedUser = await api.updateProfile({
        company_name: companyName.trim(),
        company_description: companyDescription.trim() || undefined,
      });
      updateUser(updatedUser);
      setCompanySuccess('Company information updated successfully');
    } catch (err) {
      setCompanyError(err instanceof Error ? err.message : 'Failed to update company information');
    } finally {
      setCompanyLoading(false);
    }
  };

  const handleBecomeSeller = async (e: React.FormEvent) => {
    e.preventDefault();
    setBecomeSellerError('');
    setBecomeSellerSuccess('');

    if (!newCompanyName.trim()) {
      setBecomeSellerError('Company name is required');
      return;
    }

    setBecomeSellerLoading(true);

    try {
      const updatedUser = await api.becomeSeller(newCompanyName.trim());
      updateUser(updatedUser);
      setCompanyName(updatedUser.company_name || '');
      setBecomeSellerSuccess('Congratulations! You are now a seller. You can start listing products.');
      setNewCompanyName('');
    } catch (err) {
      setBecomeSellerError(err instanceof Error ? err.message : 'Failed to become a seller');
    } finally {
      setBecomeSellerLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <SettingsIcon className="mx-auto h-16 w-16 text-gray-400" />
        <h1 className="mt-4 text-2xl font-bold text-gray-900">Please login</h1>
        <p className="mt-2 text-gray-600">Login to access your settings</p>
        <Link to="/login">
          <Button className="mt-6">Login</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account settings and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">
            <User className="mr-2 h-4 w-4" />
            Profile
          </TabsTrigger>
          {(user?.role === 'seller' || user?.role === 'admin') && (
            <TabsTrigger value="company">
              <Building2 className="mr-2 h-4 w-4" />
              Company
            </TabsTrigger>
          )}
          <TabsTrigger value="account">
            <Shield className="mr-2 h-4 w-4" />
            Account
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal information and how others see you on the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                {profileError && (
                  <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                    {profileError}
                  </div>
                )}
                {profileSuccess && (
                  <div className="rounded-md bg-green-50 p-3 text-sm text-green-600">
                    {profileSuccess}
                  </div>
                )}

                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="avatarUrl">Avatar URL</Label>
                  <Input
                    id="avatarUrl"
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Enter a URL to an image to use as your profile picture
                  </p>
                </div>

                {avatarUrl && (
                  <div>
                    <Label>Preview</Label>
                    <div className="mt-2 h-20 w-20 overflow-hidden rounded-full border">
                      <img
                        src={avatarUrl}
                        alt="Avatar preview"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                )}

                <Button type="submit" disabled={profileLoading}>
                  {profileLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {(user?.role === 'seller' || user?.role === 'admin') && (
          <TabsContent value="company">
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
                <CardDescription>
                  Update your company details that appear on your product listings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCompanyUpdate} className="space-y-4">
                  {companyError && (
                    <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                      {companyError}
                    </div>
                  )}
                  {companySuccess && (
                    <div className="rounded-md bg-green-50 p-3 text-sm text-green-600">
                      {companySuccess}
                    </div>
                  )}

                  <div>
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Your Company Inc."
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="companyDescription">Company Description</Label>
                    <Textarea
                      id="companyDescription"
                      value={companyDescription}
                      onChange={(e) => setCompanyDescription(e.target.value)}
                      placeholder="Tell customers about your company..."
                      rows={4}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      A brief description of your company that will be shown to customers
                    </p>
                  </div>

                  <Button type="submit" disabled={companyLoading}>
                    {companyLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="account">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>
                  Your account details and membership information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label className="text-gray-500">Email</Label>
                    <p className="mt-1 font-medium">{user?.email}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Account Type</Label>
                    <div className="mt-1">
                      <Badge
                        className={
                          user?.role === 'admin'
                            ? 'bg-purple-100 text-purple-800'
                            : user?.role === 'seller'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }
                      >
                        {user?.role === 'admin' ? 'Administrator' : user?.role === 'seller' ? 'Seller' : 'Buyer'}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-500">Member Since</Label>
                    <p className="mt-1 font-medium">
                      {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Account Status</Label>
                    <div className="mt-1">
                      <Badge className={user?.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {user?.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {user?.role === 'buyer' && (
              <Card>
                <CardHeader>
                  <CardTitle>Become a Seller</CardTitle>
                  <CardDescription>
                    Start selling your software products on SoftMarket
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleBecomeSeller} className="space-y-4">
                    {becomeSellerError && (
                      <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                        {becomeSellerError}
                      </div>
                    )}
                    {becomeSellerSuccess && (
                      <div className="rounded-md bg-green-50 p-3 text-sm text-green-600">
                        {becomeSellerSuccess}
                      </div>
                    )}

                    <div className="rounded-md bg-blue-50 p-4">
                      <h4 className="font-medium text-blue-900">Benefits of becoming a seller:</h4>
                      <ul className="mt-2 space-y-1 text-sm text-blue-800">
                        <li>List and sell your software products</li>
                        <li>Access to seller dashboard and analytics</li>
                        <li>Manage orders and customer reviews</li>
                        <li>Reach thousands of potential customers</li>
                      </ul>
                    </div>

                    <div>
                      <Label htmlFor="newCompanyName">Company Name</Label>
                      <Input
                        id="newCompanyName"
                        type="text"
                        value={newCompanyName}
                        onChange={(e) => setNewCompanyName(e.target.value)}
                        placeholder="Your Company Inc."
                        required
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Enter your company or business name to get started
                      </p>
                    </div>

                    <Button type="submit" disabled={becomeSellerLoading}>
                      {becomeSellerLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Building2 className="mr-2 h-4 w-4" />
                          Become a Seller
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
