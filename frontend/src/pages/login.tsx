import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useMutation, ApolloError } from "@apollo/client"
import { LOGIN_USER } from "./graphql/mutations"
import { useState } from "react"
import { useRouter } from "next/router"
import { useAuth } from "@/context/AuthContext"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [displayError, setDisplayError] = useState<string | null>(null)
  const [loginMutation, { loading }] = useMutation(LOGIN_USER)
  const router = useRouter()
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setDisplayError(null) // Clear previous errors
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
    <div className="flex items-center justify-center h-screen">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>
            Enter your email below to login to your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="m@example.com" required onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required onChange={(e) => setPassword(e.target.value)} />
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={handleSubmit} disabled={loading}>{loading ? "Logging in..." : "Log in"}</Button>
        </CardFooter>
        {displayError && <p className="text-red-500 text-center text-sm mt-2">{displayError}</p>}
        <p className="text-center text-sm text-muted-foreground mt-4">
          Don't have an account?{" "}
          <a href="/register" className="underline underline-offset-4 hover:text-primary">
            Sign up
          </a>
        </p>
      </Card>
    </div>
  )
}
