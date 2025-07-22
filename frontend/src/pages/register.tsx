import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { useAuth } from "@/context/AuthContext";
import { REGISTER_USER } from "@/graphql/mutations";
import { ApolloError, useMutation } from "@apollo/client";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";

export default function RegisterPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayError, setDisplayError] = useState<string | null>(null);
  const [registerMutation, { loading }] = useMutation(REGISTER_USER);
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDisplayError(null);
    try {
      const { data } = await registerMutation({
        variables: {
          input: {
            first_name: firstName,
            last_name: lastName,
            email,
            password,
          },
        },
      });
      if (data.register.accessToken) {
        login(data.register.accessToken);
        router.push("/dashboard");
      }
    } catch (err) {
      if (err instanceof ApolloError) {
        // Extract the actual error message from GraphQL errors
        const errorMessage =
          err.graphQLErrors?.[0]?.message ||
          err.message ||
          "Registration failed";
        setDisplayError(errorMessage);
      } else {
        setDisplayError("An unexpected error occurred. Please try again.");
      }
    }
  };

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
      <div className="absolute top-4 right-4 z-10">
        <ModeToggle />
      </div>
      <div className="hidden bg-muted lg:block">
        <div className="flex flex-col justify-center items-center h-full p-12 text-center bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
          <h2 className="text-4xl font-bold">Start Your Journey</h2>
          <p className="mt-4 text-lg text-primary-foreground/80">
            Gain an edge with AI-powered market insights today.
          </p>
        </div>
      </div>
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-bold">Create an Account</h1>
            <p className="text-balance text-muted-foreground">
              Enter your information to get started
            </p>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    required
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    required
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {displayError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Registration Failed</AlertTitle>
                  <AlertDescription>{displayError}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating Account..." : "Create Account"}
              </Button>
            </div>
          </form>
          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="underline">
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
