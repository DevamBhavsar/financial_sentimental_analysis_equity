import { motion } from "framer-motion";
import { CheckCircle, XCircle, TrendingUp, BarChart3, DollarSign } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface UploadAnimationProps {
  result?: {
    message: string;
    created?: number;
    updated?: number;
    skipped?: number;
  };
  error?: string;
  onComplete?: () => void;
}

export function UploadSuccessAnimation({ result, onComplete }: UploadAnimationProps) {
  if (!result) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: -20 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative overflow-hidden"
    >
      {/* Background particles effect */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.8 }}
      >
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-green-400 rounded-full"
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
              duration: 2,
              delay: i * 0.1 + 0.3,
              ease: "easeOut",
            }}
          />
        ))}
      </motion.div>

      <Alert className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 relative">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            delay: 0.2, 
            duration: 0.6, 
            type: "spring", 
            stiffness: 150 
          }}
          className="inline-block"
        >
          <CheckCircle className="h-6 w-6 text-green-600" />
        </motion.div>
        
        <div className="space-y-3">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <AlertTitle className="text-green-800 text-lg font-semibold">
              🎉 Upload Successful!
            </AlertTitle>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <AlertDescription>
              <div className="space-y-3">
                <p className="text-green-700 font-medium">{result.message}</p>
                
                {/* Animated stats cards */}
                <div className="grid grid-cols-3 gap-2">
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
                        delay: 0.8 + index * 0.1, 
                        duration: 0.4,
                        type: "spring",
                        stiffness: 120
                      }}
                      className="bg-white/70 rounded-lg p-2 text-center border border-green-100"
                    >
                      <motion.div
                        initial={{ y: -10 }}
                        animate={{ y: 0 }}
                        transition={{ delay: 1 + index * 0.1, duration: 0.3 }}
                        className="flex flex-col items-center"
                      >
                        <stat.icon className={`h-4 w-4 ${stat.color} mb-1`} />
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 1.2 + index * 0.1 }}
                          className="text-lg font-bold text-foreground"
                        >
                          {stat.value}
                        </motion.span>
                        <span className="text-xs text-muted-foreground">{stat.label}</span>
                      </motion.div>
                    </motion.div>
                  ))}
                </div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.5, duration: 0.5 }}
                  className="text-sm font-medium text-green-700 text-center"
                >
                  <motion.div
                    animate={{ 
                      scale: [1, 1.05, 1],
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 1
                    }}
                  >
                    ✨ Redirecting to dashboard in 2 seconds...
                  </motion.div>
                </motion.div>
              </div>
            </AlertDescription>
          </motion.div>
        </div>
      </Alert>
    </motion.div>
  );
}

export function UploadErrorAnimation({ error }: UploadAnimationProps) {
  if (!error) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: -20 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative overflow-hidden"
    >
      {/* Error pulse effect */}
      <motion.div
        className="absolute inset-0 bg-red-100 rounded-lg opacity-20"
        animate={{
          scale: [1, 1.02, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      <Alert variant="destructive" className="border-red-200 bg-gradient-to-br from-red-50 to-rose-50 relative">
        <motion.div
          initial={{ scale: 0, rotate: 180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            delay: 0.1, 
            duration: 0.6, 
            type: "spring", 
            stiffness: 150 
          }}
          className="inline-block"
        >
          <XCircle className="h-6 w-6" />
        </motion.div>
        
        <div className="space-y-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <AlertTitle className="text-red-800 font-semibold">
              ⚠️ Upload Failed
            </AlertTitle>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <AlertDescription className="text-red-700">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.3 }}
                className="bg-white/50 p-3 rounded border border-red-100 mt-2"
              >
                <pre className="text-sm whitespace-pre-wrap font-mono">
                  {error}
                </pre>
              </motion.div>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9, duration: 0.3 }}
                className="text-sm mt-3 text-red-600"
              >
                💡 Please check your file format and try again.
              </motion.p>
            </AlertDescription>
          </motion.div>
        </div>
      </Alert>
    </motion.div>
  );
}
