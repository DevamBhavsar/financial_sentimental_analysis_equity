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
import { Progress } from "@/components/ui/progress";
import { FullscreenUploadAnimation } from "@/components/ui/fullscreen-upload-animation";
import { validateExcelTemplate, readExcelFile } from "@/lib/excel";
import { useMutation } from "@apollo/client";
import { UploadCloud } from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { UPLOAD_HOLDINGS } from "@/graphql/mutations";
import { GET_DASHBOARD_DATA } from "@/graphql/queries";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<any | null>(null);
  const [showFullscreenAnimation, setShowFullscreenAnimation] = useState(false);
  const [uploadHoldings] = useMutation(UPLOAD_HOLDINGS, {
    refetchQueries: [{ query: GET_DASHBOARD_DATA }],
    awaitRefetchQueries: true,
  });
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    try {
      // Validate file size
      if (selectedFile.size > 10 * 1024 * 1024) {
        throw new Error("File size must be less than 10MB");
      }

      // Read and validate Excel content
      const data = await readExcelFile(selectedFile);
      const validation = validateExcelTemplate(data);

      if (!validation.isValid) {
        throw new Error(validation.errors.join("\n"));
      }

      setFile(selectedFile);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid file");
      setFile(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    try {
      setUploading(true);
      setProgress(0);
      setError(null);
      setUploadResult(null);

      const { data } = await uploadHoldings({
        variables: { file },
        context: {
          fetchOptions: {
            onUploadProgress: (progressEvent: any) => {
              const progress =
                (progressEvent.loaded / progressEvent.total) * 100;
              setProgress(Math.round(progress));
            },
          },
        },
      });

      if (data.upload_holdings.success) {
        setUploadResult(data.upload_holdings);
        setShowFullscreenAnimation(true);
      } else {
        throw new Error(data.upload_holdings.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setShowFullscreenAnimation(true);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Layout>
      <div className="flex items-center justify-center">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Upload Your Holdings</CardTitle>
            <CardDescription>
              Upload an Excel (.xlsx) file with your mutual fund and equity
              holdings to get started.
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
                        <span className="font-semibold">Click to upload</span>{" "}
                        or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground">
                        XLSX file (MAX. 10MB)
                      </p>
                    </div>
                    <Input
                      id="holdings-file"
                      type="file"
                      className="hidden"
                      onChange={handleFileChange}
                      accept=".xlsx, .csv"
                    />
                  </div>
                </Label>
              </div>
              {file && (
                <div className="text-sm text-center text-muted-foreground">
                  Selected file: <strong>{file.name}</strong>
                </div>
              )}
              {uploading && (
                <div className="space-y-2">
                  <Progress value={progress} />
                  <p className="text-sm text-center text-muted-foreground">
                    Uploading... {progress}%
                  </p>
                </div>
              )}
              {/* Animations are now handled by full-screen overlay */}
              <Button
                type="submit"
                className="w-full"
                disabled={uploading || !file}
              >
                {uploading ? "Uploading..." : "Upload and Analyze"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      
      {/* Full-screen upload animation */}
      <FullscreenUploadAnimation
        isVisible={showFullscreenAnimation}
        uploadResult={uploadResult}
        error={error}
        onComplete={() => {
          setShowFullscreenAnimation(false);
          setUploadResult(null);
          setError(null);
        }}
      />
    </Layout>
  );
}
