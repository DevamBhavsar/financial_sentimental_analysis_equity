import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, TrendingUp, BarChart3, DollarSign, X } from "lucide-react";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

interface FullscreenUploadAnimationProps {
  isVisible: boolean;
  uploadResult?: {
    message: string;
    created?: number;
    updated?: number;
    skipped?: number;
  };
  error?: string | null;
  onComplete?: () => void;
}

export function FullscreenUploadAnimation({ 
  isVisible, 
  uploadResult, 
  error, 
  onComplete 
}: FullscreenUploadAnimationProps) {
  const router = useRouter();
  const isSuccess = !!uploadResult && !error;

  const handleClose = () => {
    if (isSuccess) {
      router.push("/dashboard");
    }
    onComplete?.();
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          {/* Blurred backdrop */}
          <motion.div
            initial={{ backdropFilter: "blur(0px)" }}
            animate={{ backdropFilter: "blur(12px)" }}
            exit={{ backdropFilter: "blur(0px)" }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 bg-black/30 dark:bg-black/50"
          />
          
          {/* Animation content */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            transition={{ 
              duration: 0.6, 
              type: "spring", 
              stiffness: 150,
              damping: 20
            }}
            className="relative z-10 max-w-md w-full mx-4 p-2"
          >
            {isSuccess ? (
              <SuccessAnimation result={uploadResult} onClose={handleClose} />
            ) : (
              <ErrorAnimation error={error} onClose={handleClose} />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SuccessAnimation({ result, onClose }: { result?: any; onClose: () => void }) {
  return (
    <motion.div className="bg-card border border-border rounded-xl p-4 md:p-8 text-center shadow-2xl relative">

      {/* Background particles */}
      <div className="absolute inset-0 overflow-hidden rounded-xl">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-green-400 rounded-full"
            initial={{
              x: "50%",
              y: "50%",
              scale: 0,
            }}
            animate={{
              x: `${Math.random() * 100}%`,
              y: `${Math.random() * 100}%`,
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 3,
              delay: i * 0.2,
              ease: "easeOut",
            }}
          />
        ))}
      </div>

      {/* Success icon */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ 
          delay: 0.2, 
          duration: 0.8, 
          type: "spring", 
          stiffness: 150 
        }}
        className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full mb-6"
      >
        <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
      </motion.div>

      {/* Title */}
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="text-2xl md:text-3xl font-bold text-foreground mb-3"
      >
        🎉 Upload Successful!
      </motion.h2>

      {/* Message */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        className="text-muted-foreground mb-6"
      >
        {result?.message}
      </motion.p>

      {/* Stats */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6"
        >
          {[
            { label: "Created", value: result.created || 0, icon: TrendingUp, color: "text-blue-600" },
            { label: "Updated", value: result.updated || 0, icon: BarChart3, color: "text-orange-600" },
            { label: "Skipped", value: result.skipped || 0, icon: DollarSign, color: "text-purple-600" },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ 
                delay: 1 + index * 0.1, 
                duration: 0.4,
                type: "spring",
                stiffness: 120
              }}
              className="bg-muted/50 rounded-lg p-3 text-center"
            >
              <stat.icon className={`h-5 w-5 ${stat.color} mx-auto mb-2`} />
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Close button */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.5 }}
        className="mt-6 relative z-10"
      >
        <Button
          onClick={onClose}
          className="w-full bg-green-600 hover:bg-green-700 text-white"
          size="lg"
        >
          <X className="h-5 w-5 mr-2" />
          Continue to Dashboard
        </Button>
      </motion.div>
    </motion.div>
  );
}

function ErrorAnimation({ error, onClose }: { error?: string; onClose: () => void }) {
  return (
    <motion.div className="bg-card border border-border rounded-xl p-4 md:p-8 text-center shadow-2xl relative">

      {/* Error pulse effect */}
      <motion.div
        className="absolute inset-0 bg-red-500/5 rounded-xl pointer-events-none"
        animate={{
          scale: [1, 1.02, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Error icon */}
      <motion.div
        initial={{ scale: 0, rotate: 180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ 
          delay: 0.1, 
          duration: 0.8, 
          type: "spring", 
          stiffness: 150 
        }}
        className="inline-flex items-center justify-center w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full mb-6"
      >
        <XCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
      </motion.div>

      {/* Title */}
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="text-2xl md:text-3xl font-bold text-foreground mb-3"
      >
        ⚠️ Upload Failed
      </motion.h2>

      {/* Error message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="bg-muted/50 p-4 rounded-lg border border-red-200 dark:border-red-800/50 mb-6"
      >
        <pre className="text-sm text-foreground whitespace-pre-wrap font-mono">
          {error}
        </pre>
      </motion.div>
      
      {/* Help text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.3 }}
        className="text-sm text-muted-foreground mb-6"
      >
        💡 Please check your file format and try again.
      </motion.p>

      {/* Close button */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.5 }}
        className="relative z-10"
      >
        <Button
          onClick={onClose}
          variant="outline"
          className="w-full"
          size="lg"
        >
          <X className="h-5 w-5 mr-2" />
          Close
        </Button>
      </motion.div>
    </motion.div>
  );
}
