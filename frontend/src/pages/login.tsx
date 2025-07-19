import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useMutation, ApolloError } from "@apollo/client"
import { LOGIN_USER } from "./graphql/mutations"
import { useState } from "react"
import { useRouter } from "next/router"
import { useAuth } from "@/context/AuthContext"
import { AlertCircle } from "lucide-react"
import Link from "next/link"
import { ModeToggle } from "@/components/ui/mode-toggle"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [displayError, setDisplayError] = useState<string | null>(null)
  const [loginMutation, { loading }] = useMutation(LOGIN_USER)
  const router = useRouter()
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setDisplayError(null)
    try {
      const { data } = await loginMutation({ variables: { input: { email, password } } })
      if (data.login.accessToken) {
        login(data.login.accessToken)
        router.push("/dashboard")
      }
    } catch (err) {
      if (err instanceof ApolloError) {
        setDisplayError(err.message)
      } else {
        setDisplayError("An unexpected error occurred.")
      }
    }
  }

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
      <div className="absolute top-4 right-4">
        <ModeToggle />
      </div>
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-bold">Login</h1>
            <p className="text-balance text-muted-foreground">
              Enter your email below to login to your account
            </p>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="m@example.com" required onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                </div>
                <Input id="password" type="password" required onChange={(e) => setPassword(e.target.value)} />
              </div>
              {displayError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Login Failed</AlertTitle>
                  <AlertDescription>{displayError}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </Button>
            </div>
          </form>
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="underline">
              Sign up
            </Link>
          </div>
        </div>
      </div>
      <div className="hidden bg-muted lg:block">
        <div className="flex flex-col justify-center items-center h-full p-12 text-center bg-gradient-to-br from-gray-900 to-black text-white">
            <h2 className="text-4xl font-bold">Unlock Financial Clarity</h2>
            <p className="mt-4 text-lg text-gray-300">Join thousands of investors making data-driven decisions.</p>
        </div>
      </div>
    </div>
  )
}