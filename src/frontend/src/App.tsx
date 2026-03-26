import { Toaster } from "@/components/ui/sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImageIcon, Loader2, RefreshCw, Upload } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "./backend";
import { useActor } from "./hooks/useActor";

export default function App() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const { data: imageUrl, isLoading } = useQuery<string | null>({
    queryKey: ["image"],
    queryFn: async () => {
      if (!actor) return null;
      const blob = await actor.getImage();
      if (!blob) return null;
      return blob.getDirectURL();
    },
    enabled: !!actor && !isFetching,
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!actor) throw new Error("No actor");
      const bytes = new Uint8Array(await file.arrayBuffer());
      const externalBlob = ExternalBlob.fromBytes(bytes).withUploadProgress(
        (pct) => setUploadProgress(pct),
      );
      await actor.updateImage(externalBlob);
      return externalBlob.getDirectURL();
    },
    onSuccess: () => {
      setUploadProgress(null);
      queryClient.invalidateQueries({ queryKey: ["image"] });
      toast.success("Image saved");
    },
    onError: () => {
      setUploadProgress(null);
      toast.error("Upload failed");
    },
  });

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }
      uploadMutation.mutate(file);
    },
    [uploadMutation],
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const isUploading = uploadMutation.isPending;
  const showUpload = !isLoading && !imageUrl && !isUploading;
  const showImage = !!imageUrl && !isUploading;

  return (
    <>
      <Toaster theme="dark" />
      <main
        className="relative w-screen h-screen overflow-hidden"
        style={{ background: "#0a0a0a" }}
      >
        {/* Subtle title */}
        <span
          className="absolute top-5 left-5 z-20 text-xs font-light tracking-[0.3em] uppercase"
          style={{ color: "rgba(255,255,255,0.18)" }}
        >
          Why
        </span>

        {/* Loading state */}
        <AnimatePresence>
          {(isLoading || isFetching) && !imageUrl && (
            <motion.div
              key="loading"
              className="absolute inset-0 flex items-center justify-center z-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              data-ocid="app.loading_state"
            >
              <Loader2
                className="animate-spin"
                size={24}
                style={{ color: "rgba(255,255,255,0.25)" }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upload state */}
        <AnimatePresence>
          {showUpload && (
            <motion.div
              key="upload"
              className="absolute inset-0 flex flex-col items-center justify-center z-10 cursor-pointer select-none"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              data-ocid="upload.dropzone"
            >
              <motion.div
                className="flex flex-col items-center gap-5 px-8 py-10 rounded-2xl transition-colors duration-200"
                style={{
                  border: `1.5px dashed ${
                    isDragging
                      ? "rgba(255,255,255,0.4)"
                      : "rgba(255,255,255,0.1)"
                  }`,
                  background: isDragging
                    ? "rgba(255,255,255,0.04)"
                    : "transparent",
                }}
                animate={{ scale: isDragging ? 1.02 : 1 }}
                transition={{ duration: 0.15 }}
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.06)" }}
                >
                  <ImageIcon
                    size={22}
                    style={{ color: "rgba(255,255,255,0.5)" }}
                  />
                </div>
                <div className="text-center">
                  <p
                    className="text-sm font-light tracking-wide"
                    style={{ color: "rgba(255,255,255,0.6)" }}
                  >
                    Upload an image
                  </p>
                  <p
                    className="text-xs mt-1 font-light"
                    style={{ color: "rgba(255,255,255,0.22)" }}
                  >
                    drag & drop or click
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Uploading progress state */}
        <AnimatePresence>
          {isUploading && (
            <motion.div
              key="uploading"
              className="absolute inset-0 flex flex-col items-center justify-center z-10 gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              data-ocid="upload.loading_state"
            >
              <Loader2
                className="animate-spin"
                size={24}
                style={{ color: "rgba(255,255,255,0.4)" }}
              />
              {uploadProgress !== null && (
                <p
                  className="text-xs font-light tracking-widest"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                >
                  {uploadProgress}%
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Full-screen image */}
        <AnimatePresence>
          {showImage && (
            <motion.div
              key="image"
              className="absolute inset-0 group"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              data-ocid="app.canvas_target"
            >
              <img
                src={imageUrl!}
                alt=""
                className="w-full h-full object-cover"
              />

              {/* Change image button — visible on hover */}
              <motion.button
                className="absolute bottom-6 right-6 flex items-center gap-2 px-3 py-2 rounded-full text-xs font-light tracking-wide opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
                style={{
                  background: "rgba(0,0,0,0.55)",
                  color: "rgba(255,255,255,0.8)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255,255,255,0.12)",
                }}
                onClick={() => fileInputRef.current?.click()}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                data-ocid="upload.button"
              >
                <RefreshCw size={12} />
                Change
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileInput}
          data-ocid="upload.upload_button"
        />

        {/* Footer */}
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 text-[10px] font-light"
          style={{ color: "rgba(255,255,255,0.1)" }}
        >
          Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "rgba(255,255,255,0.18)" }}
          >
            caffeine.ai
          </a>
        </div>
      </main>
    </>
  );
}
