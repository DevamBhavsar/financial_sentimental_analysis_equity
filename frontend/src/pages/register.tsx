import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useMutation } from "@apollo/client"
import { REGISTER_USER } from "./graphql/mutations"
import { useState } from "react"
import { useRouter } from "next/router"

export default function RegisterPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [register, { data, loading, error }] = useMutation(REGISTER_USER)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { data } = await register({ variables: { name, email, password } })
      if (data.register.token) {
        localStorage.setItem("token", data.register.token)
        router.push("/")
      }
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div className="flex items-center justify-center h-screen">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Register</CardTitle>
          <CardDescription>
            Enter your information to create an account.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="John Doe" required onChange={(e) => setName(e.target.value)} />
          </div>
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
          <Button className="w-full" onClick={handleSubmit} disabled={loading}>{loading ? "Creating account..." : "Create account"}</Button>
        </CardFooter>
        {error && <p className="text-red-500 text-center">{error.message}</p>}
      </Card>
    </div>
  )
}
