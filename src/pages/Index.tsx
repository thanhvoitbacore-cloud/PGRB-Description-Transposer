import { useState, useCallback } from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { FileDropZone } from "@/components/FileDropZone";
import { DataGrid } from "@/components/DataGrid";
import { Button } from "@/components/ui/button";
import { Download, RotateCcw, FileSpreadsheet, Loader2 } from "lucide-react";
import {
  validateFileName,
  processWorkbook,
  exportToXlsx,
  TransposedRow,
} from "@/lib/wayfairTransposer";

type AppState = "Ready" | "Processing" | "Reviewing";

const Index = () => {
  const [state, setState] = useState<AppState>("Ready");
  const [data, setData] = useState<TransposedRow[]>([]);
  const [fileName, setFileName] = useState("");

  const handleFile = useCallback(async (file: File) => {
    console.log("File received:", file.name, file.size);
    
    if (!validateFileName(file.name)) {
      toast.error(
        "Vui lòng tải lên đúng file template của Wayfair (Tên file phải chứa 'Product Description Export')."
      );
      return;
    }

    setState("Processing");
    setFileName(file.name);

    try {
      const buffer = await file.arrayBuffer();
      console.log("Buffer size:", buffer.byteLength);
      const workbook = XLSX.read(buffer, { type: "array" });
      console.log("Sheets:", workbook.SheetNames);
      const result = processWorkbook(workbook);
      console.log("Transposed rows:", result.length);

      setData(result);
      setState("Reviewing");

      const dupes = result.filter((r) => r.validation_status === "Duplicate_Key").length;
      const errors = result.filter((r) => r.validation_status === "Corrupted_Value").length;

      if (dupes > 0 || errors > 0) {
        toast.warning(
          `Phát hiện ${dupes} dòng trùng lặp và ${errors} giá trị lỗi Excel. Vui lòng kiểm tra.`
        );
      } else {
        toast.success(`Transpose thành công! ${result.length} dòng dữ liệu.`);
      }
    } catch (err) {
      console.error("Processing error:", err);
      toast.error(err instanceof Error ? err.message : "Lỗi xử lý file.");
      setState("Ready");
    }
  }, []);

  const handleExport = useCallback(() => {
    exportToXlsx(data, fileName);
    toast.success("Đã tải file thành công!");
  }, [data, fileName]);

  const handleReset = useCallback(() => {
    setData([]);
    setFileName("");
    setState("Ready");
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <FileSpreadsheet className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">
                Wayfair Data Transposer
              </h1>
              <p className="text-xs text-muted-foreground">
                Xoay trục & ghép nối dữ liệu • 100% Client-side
              </p>
            </div>
          </div>

          {state === "Reviewing" && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Làm lại
              </Button>
              <Button size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-1" />
                Xuất Excel
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Main */}
      <main className="container mx-auto px-4 py-8">
        {state === "Ready" && (
          <div className="max-w-2xl mx-auto">
            <FileDropZone onFile={handleFile} />
            <div className="mt-6 rounded-lg bg-card border p-4">
              <h3 className="font-semibold text-foreground mb-2">Hướng dẫn</h3>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-4">
                <li>File phải có đuôi <code className="bg-muted px-1 rounded">.xlsx</code> và tên chứa "Product Description Export"</li>
                <li>Sheet đầu tiên là Main Sheet, các sheet còn lại là Additional</li>
                <li>3 dòng đầu sẽ bị bỏ qua, dòng 4 làm Header</li>
                <li>Dữ liệu được xử lý hoàn toàn trên trình duyệt, không upload lên server</li>
              </ul>
            </div>
          </div>
        )}

        {state === "Processing" && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground font-medium">
              Đang xử lý file <span className="text-foreground">{fileName}</span>...
            </p>
          </div>
        )}

        {state === "Reviewing" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileSpreadsheet className="h-4 w-4" />
              <span>{fileName}</span>
            </div>
            <DataGrid data={data} />
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
