import { Layout } from "@/components/layouts/Layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation, useQuery } from "@apollo/client";
import { User, Lock, Save, AlertCircle, CheckCircle } from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { UPDATE_PROFILE, CHANGE_PASSWORD, GET_DASHBOARD_DATA, GET_CURRENT_USER } from "@/graphql/queries";
import Head from "next/head";

interface ProfileForm {
  first_name: string;
  last_name: string;
  email: string;
}

interface PasswordForm {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export default function ProfilePage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const { data: dashboardData } = useQuery(GET_DASHBOARD_DATA);
  const { data: userData, loading: userLoading } = useQuery(GET_CURRENT_USER);
  
  const [updateProfile] = useMutation(UPDATE_PROFILE, {
    refetchQueries: [{ query: GET_CURRENT_USER }],
  });
  const [changePassword] = useMutation(CHANGE_PASSWORD);
  
  const [profileForm, setProfileForm] = useState<ProfileForm>({
    first_name: "",
    last_name: "",
    email: "",
  });
  
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  // Populate form with current user data
  useEffect(() => {
    if (userData?.me) {
      setProfileForm({
        first_name: userData.me.first_name || "",
        last_name: userData.me.last_name || "",
        email: userData.me.email || "",
      });
    }
  }, [userData]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);
    setIsUpdatingProfile(true);
    
    try {
      await updateProfile({
        variables: {
          input: {
            first_name: profileForm.first_name,
            last_name: profileForm.last_name,
            email: profileForm.email,
          },
        },
      });
      
      setProfileSuccess("Profile updated successfully!");
    } catch (err: any) {
      // Extract the actual error message from GraphQL errors
      const errorMessage = err.graphQLErrors?.[0]?.message || err.message || "Failed to update profile";
      setProfileError(errorMessage);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);
    
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError("New passwords don't match");
      return;
    }
    
    if (passwordForm.new_password.length < 6) {
      setPasswordError("Password must be at least 6 characters long");
      return;
    }
    
    setIsChangingPassword(true);
    
    try {
      await changePassword({
        variables: {
          input: {
            current_password: passwordForm.current_password,
            new_password: passwordForm.new_password,
          },
        },
      });
      
      setPasswordSuccess("Password changed successfully!");
      setPasswordForm({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
    } catch (err: any) {
      // Extract the actual error message from GraphQL errors  
      const errorMessage = err.graphQLErrors?.[0]?.message || err.message || "Failed to change password";
      setPasswordError(errorMessage);
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (userLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <>
      <Head>
        <title>Profile Settings - SSA | Manage Your Account</title>
        <meta name="description" content="Update your profile information and change your password in SSA." />
      </Head>
      <Layout>
        <div className="max-w-4xl mx-auto space-y-8 p-6">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <User className="h-8 w-8" />
              Profile Settings
            </h1>
            <p className="text-muted-foreground">
              Manage your account information and security settings.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {/* Profile Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Information
                </CardTitle>
                <CardDescription>
                  Update your personal information and email address.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first_name">First Name</Label>
                      <Input
                        id="first_name"
                        value={profileForm.first_name}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, first_name: e.target.value })
                        }
                        placeholder="Enter first name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last_name">Last Name</Label>
                      <Input
                        id="last_name"
                        value={profileForm.last_name}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, last_name: e.target.value })
                        }
                        placeholder="Enter last name"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileForm.email}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, email: e.target.value })
                      }
                      placeholder="Enter email address"
                    />
                  </div>

                  {profileError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{profileError}</AlertDescription>
                    </Alert>
                  )}

                  {profileSuccess && (
                    <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertTitle className="text-green-800 dark:text-green-400">Success</AlertTitle>
                      <AlertDescription className="text-green-700 dark:text-green-300">
                        {profileSuccess}
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isUpdatingProfile}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isUpdatingProfile ? "Updating..." : "Update Profile"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Change Password */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Change Password
                </CardTitle>
                <CardDescription>
                  Update your password to keep your account secure.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current_password">Current Password</Label>
                    <Input
                      id="current_password"
                      type="password"
                      value={passwordForm.current_password}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, current_password: e.target.value })
                      }
                      placeholder="Enter current password"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="new_password">New Password</Label>
                    <Input
                      id="new_password"
                      type="password"
                      value={passwordForm.new_password}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, new_password: e.target.value })
                      }
                      placeholder="Enter new password"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirm_password">Confirm New Password</Label>
                    <Input
                      id="confirm_password"
                      type="password"
                      value={passwordForm.confirm_password}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, confirm_password: e.target.value })
                      }
                      placeholder="Confirm new password"
                    />
                  </div>

                  {passwordError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{passwordError}</AlertDescription>
                    </Alert>
                  )}

                  {passwordSuccess && (
                    <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertTitle className="text-green-800 dark:text-green-400">Success</AlertTitle>
                      <AlertDescription className="text-green-700 dark:text-green-300">
                        {passwordSuccess}
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isChangingPassword}
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    {isChangingPassword ? "Changing..." : "Change Password"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Account Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Account Statistics</CardTitle>
              <CardDescription>
                Overview of your account activity and portfolio.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-foreground">
                    {dashboardData?.dashboard?.totalStocks || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Holdings</div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-foreground">
                    {dashboardData?.dashboard?.sectorsCount || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Sectors</div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    ₹{(dashboardData?.dashboard?.portfolio?.totalMarketValue || 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Portfolio Value</div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className={`text-2xl font-bold ${
                    (dashboardData?.dashboard?.portfolio?.totalGainLoss || 0) >= 0 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    ₹{(dashboardData?.dashboard?.portfolio?.totalGainLoss || 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Total P&L</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    </>
  );
}
