import { Layout } from '@/components/layouts/Layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useMutation } from '@apollo/client'
import { UPLOAD_HOLDINGS } from './graphql/mutations'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [uploadHoldings, { data, loading, error }] = useMutation(UPLOAD_HOLDINGS)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
    }
  }, [router])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return
    try {
      const { data } = await uploadHoldings({ variables: { file } })
      if (data.uploadHoldings.success) {
        router.push('/dashboard')
      }
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <Layout>
      <div className="flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">Upload Holdings</CardTitle>
            <CardDescription>
              Upload an Excel file with your mutual fund and equity holdings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="file">Excel File</Label>
                <Input id="file" type="file" onChange={handleFileChange} />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={handleSubmit} disabled={loading || !file}>{loading ? "Uploading..." : "Upload"}</Button>
          </CardFooter>
          {error && <p className="text-red-500 text-center">{error.message}</p>}
        </Card>
      </div>
    </Layout>
  )
}