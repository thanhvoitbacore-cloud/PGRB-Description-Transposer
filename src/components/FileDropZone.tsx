import { useCallback, useState } from "react";
import { Upload, FileSpreadsheet } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileDropZoneProps {
  onFile: (file: File) => void;
  disabled?: boolean;
}

export function FileDropZone({ onFile, disabled }: FileDropZoneProps) {
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      if (disabled) return;
      const file = e.dataTransfer.files[0];
      if (file) onFile(file);
    },
    [onFile, disabled]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) onFile(file);
      e.target.value = "";
    },
    [onFile]
  );

  return (
    <label
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={cn(
        "group flex flex-col items-center justify-center gap-6 rounded-xl border-2 border-dashed p-16 md:p-24 transition-all cursor-pointer bg-card/50 backdrop-blur-sm",
        dragging
          ? "border-primary bg-secondary/80 scale-[1.02] shadow-xl"
          : "border-border hover:border-primary/50 hover:bg-white/50 hover:shadow-md",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary shadow-md transition-transform group-hover:scale-110">
        {dragging ? (
          <FileSpreadsheet className="h-10 w-10 text-primary-foreground" />
        ) : (
          <Upload className="h-10 w-10 text-primary-foreground" />
        )}
      </div>
      <div className="text-center">
        <p className="mt-4 text-lg font-bold text-slate-800">
          {dragging ? "Thả file vào đây..." : "Kéo thả file .xlsx vào đây"}
        </p>
        <p className="mt-2 text-sm text-slate-600 font-medium tracking-wide">
          hoặc click để chọn file • Tên file phải chứa "Product Description Export"
        </p>
      </div>
      <input
        type="file"
        accept=".xlsx"
        className="hidden"
        onChange={handleChange}
        disabled={disabled}
      />
    </label>
  );
}
