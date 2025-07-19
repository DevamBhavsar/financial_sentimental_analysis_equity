import { Layout } from '@/components/layouts/Layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useMutation } from '@apollo/client'
import { UPLOAD_HOLDINGS } from './graphql/mutations'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { UploadCloud } from 'lucide-react'

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
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return
    try {
      // This mutation needs to be implemented on the backend to handle file uploads
      // For now, we'll simulate a successful upload and redirect.
      console.log("Uploading file:", file.name)
      // const { data } = await uploadHoldings({ variables: { file } })
      // if (data.uploadHoldings.success) {
      //   router.push('/dashboard')
      // }
      alert("File upload functionality needs to be connected to the backend. Simulating success.")
      router.push('/dashboard')

    } catch (error) {
      console.error(error)
    }
  }

  return (
    <Layout>
      <div className="flex items-center justify-center">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Upload Your Holdings</CardTitle>
            <CardDescription>
              Upload an Excel (.xlsx) file with your mutual fund and equity holdings to get started.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-6">
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="holdings-file" className="text-center">
                  <div className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                      <p className="mb-2 text-sm text-muted-foreground">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground">XLSX file (MAX. 10MB)</p>
                    </div>
                    <Input id="holdings-file" type="file" className="hidden" onChange={handleFileChange} accept=".xlsx" />
                  </div>
                </Label>
              </div>
              {file && (
                <div className="text-sm text-center text-muted-foreground">
                  Selected file: <strong>{file.name}</strong>
                </div>
              )}
              <Button type="submit" className="w-full" disabled={loading || !file}>
                {loading ? "Uploading..." : "Upload and Analyze"}
              </Button>
              {error && <p className="text-red-500 text-center text-sm">{error.message}</p>}
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}