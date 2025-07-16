import { Layout } from '@/components/layouts/Layout'
import { useState } from 'react'
import * as XLSX from 'xlsx'

export default function Upload() {
  const [file, setFile] = useState<File | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!file) return

    const data = await file.arrayBuffer()
    const workbook = XLSX.read(data)
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    const jsonData = XLSX.utils.sheet_to_json(worksheet)

    console.log(jsonData)
    // Here you would typically send the data to your backend
  }

  return (
    <Layout>
      <h1 className="text-3xl font-bold">Upload Holdings</h1>
      <div className="mt-4">
        <input type="file" onChange={handleFileChange} />
        <button
          onClick={handleUpload}
          className="mt-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Upload
        </button>
      </div>
    </Layout>
  )
}
