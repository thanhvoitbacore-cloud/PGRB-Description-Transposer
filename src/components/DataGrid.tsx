import { useMemo, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Copy, Check, ChevronsUpDown } from "lucide-react";
import { TransposedRow } from "@/lib/wayfairTransposer";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

function FilterCombobox({ 
  value, 
  onChange, 
  options, 
  title, 
  placeholder 
}: { 
  value: string, 
  onChange: (v: string) => void, 
  options: {label: string, value: string}[], 
  title: string, 
  placeholder: string 
}) {
  const [open, setOpen] = useState(false);
  const selectedLabel = value === "all" ? `Tất cả ${title}` : options.find(o => o.value === value)?.label || `Tất cả ${title}`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between bg-background text-sm font-normal truncate px-3">
          <div className="flex items-center gap-2 truncate">
            <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="truncate">{selectedLabel}</span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder={placeholder} />
          <CommandList>
            <CommandEmpty>Không tìm thấy.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="all"
                onSelect={() => {
                  onChange("all");
                  setOpen(false);
                }}
              >
                <Check className={cn("mr-2 h-4 w-4", value === "all" ? "opacity-100" : "opacity-0")} />
                Tất cả {title}
              </CommandItem>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === option.value ? "opacity-100" : "opacity-0")} />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

interface DataGridProps {
  data: TransposedRow[];
}

export function DataGrid({ data }: DataGridProps) {
  const [skuFilter, setSkuFilter] = useState("all");
  const [baseHeadingFilter, setBaseHeadingFilter] = useState("all");
  const [headingFilter, setHeadingFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchValue, setSearchValue] = useState("");
  const [copied, setCopied] = useState(false);
  const [selectedRowContent, setSelectedRowContent] = useState<{sku: string, heading: string, value: string} | null>(null);

  const stats = useMemo(() => {
    const duplicates = data.filter((r) => r.validation_status === "Duplicate_Key").length;
    const corrupted = data.filter((r) => r.validation_status === "Corrupted_Value").length;
    const uniqueSkus = new Set(data.map((r) => r.sku)).size;
    return { total: data.length, duplicates, corrupted, uniqueSkus };
  }, [data]);

  const uniqueOptions = useMemo(() => {
    const skus = Array.from(new Set(data.map(r => r.sku))).sort();
    const baseHeadings = Array.from(new Set(data.map(r => r.base_heading))).filter(Boolean).sort();
    const headings = Array.from(new Set(data.map(r => r.attribute_heading))).filter(Boolean).sort();
    const statuses = Array.from(new Set(data.map(r => r.validation_status))).sort();
    return { skus, baseHeadings, headings, statuses };
  }, [data]);

  const filtered = useMemo(() => {
    return data.filter((row) => {
      if (skuFilter !== "all" && row.sku !== skuFilter) return false;
      if (baseHeadingFilter !== "all" && row.base_heading !== baseHeadingFilter) return false;
      if (headingFilter !== "all" && row.attribute_heading !== headingFilter) return false;
      if (statusFilter !== "all" && row.validation_status !== statusFilter) return false;
      
      if (searchValue) {
        const terms = searchValue.toLowerCase().split(",").map(t => t.trim()).filter(Boolean);
        if (terms.length > 0) {
          const isMatch = terms.some(term => row.value.toLowerCase().includes(term));
          if (!isMatch) return false;
        }
      }

      return true;
    });
  }, [data, skuFilter, baseHeadingFilter, headingFilter, statusFilter, searchValue]);

  const handleCopyVisible = useCallback(() => {
    const rows = filtered.map((r) => [r.sku, r.base_heading, r.attribute_heading, r.value].join("\t"));
    const tsv = rows.join("\n");

    const onSuccess = () => {
      setCopied(true);
      toast.success(`Đã copy ${filtered.length} dòng đang hiển thị!`);
      alert(`Đã copy thành công ${filtered.length} dòng!`);
      setTimeout(() => setCopied(false), 2000);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(tsv).then(onSuccess).catch(() => {
        toast.error("Không thể copy vào clipboard.");
        alert("Lỗi: Không thể copy vào clipboard.");
      });
    } else {
      try {
        const textArea = document.createElement("textarea");
        textArea.value = tsv;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        onSuccess();
      } catch (err) {
        toast.error("Trình duyệt không hỗ trợ copy.");
        alert("Lỗi: Trình duyệt không hỗ trợ copy.");
      }
    }
  }, [filtered]);

  return (
    <div className="flex flex-col max-h-full min-h-0 space-y-5">
      {/* Stats */}
      <div className="flex flex-wrap gap-4 shrink-0">
        <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-sm border border-fuchsia-200 text-fuchsia-900 font-bold text-base flex items-center gap-2">
          <span className="bg-fuchsia-200 text-fuchsia-800 px-3 py-0.5 rounded-lg text-lg border border-fuchsia-300 shadow-inner">{stats.uniqueSkus}</span> SKUs
        </div>
        <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-sm border border-blue-200 text-blue-900 font-bold text-base flex items-center gap-2">
          <span className="bg-blue-200 text-blue-800 px-3 py-0.5 rounded-lg text-lg border border-blue-300 shadow-inner">{stats.total}</span> dòng
        </div>
        
        {stats.duplicates > 0 && (
          <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-sm border border-orange-200 text-orange-900 font-bold text-base flex items-center gap-2">
            <span className="bg-orange-200 text-orange-800 px-3 py-0.5 rounded-lg text-lg border border-orange-300 shadow-inner">{stats.duplicates}</span> Trùng lặp
          </div>
        )}
        {stats.corrupted > 0 && (
          <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-sm border border-red-200 text-red-900 font-bold text-base flex items-center gap-2">
            <span className="bg-red-200 text-red-800 px-3 py-0.5 rounded-lg text-lg border border-red-300 shadow-inner">{stats.corrupted}</span> Lỗi Giá Trị
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card shadow-sm flex flex-col min-h-0 overflow-hidden">
        <div className="overflow-auto w-full min-h-0">
          <table className="w-full text-sm relative">
            <thead className="bg-black dark:bg-white sticky top-0 z-10 shadow-md">
              <tr className="uppercase text-sm tracking-wider text-white dark:text-black divide-x divide-white/40 dark:divide-black/40">
                <th className="text-left px-4 py-3 font-extrabold w-12 border-b border-white/20 dark:border-black/20">#</th>
                <th className="text-left px-4 py-3 font-extrabold border-b border-white/20 dark:border-black/20">SKU</th>
                <th className="text-left px-4 py-3 font-extrabold border-b border-white/20 dark:border-black/20">Base Heading</th>
                <th className="text-left px-4 py-3 font-extrabold border-b border-white/20 dark:border-black/20">Attribute Heading</th>
                <th className="text-left px-4 py-3 font-extrabold border-b border-white/20 dark:border-black/20">Value</th>
                <th className="text-left px-4 py-3 font-extrabold w-40 border-b border-white/20 dark:border-black/20">Status</th>
              </tr>
              <tr className="bg-slate-100 dark:bg-slate-800 divide-x shadow-sm">
                <th className="px-2 py-2"></th>
                <th className="px-2 py-2 font-normal">
                  <FilterCombobox 
                    title="SKU"
                    placeholder="Gõ để tìm SKU..."
                    value={skuFilter}
                    onChange={setSkuFilter}
                    options={uniqueOptions.skus.map(s => ({label: s, value: s}))}
                  />
                </th>
                <th className="px-2 py-2 font-normal">
                  <FilterCombobox 
                    title="Base"
                    placeholder="Gõ để tìm Base Heading..."
                    value={baseHeadingFilter}
                    onChange={setBaseHeadingFilter}
                    options={uniqueOptions.baseHeadings.map(s => ({label: s, value: s}))}
                  />
                </th>
                <th className="px-2 py-2 font-normal">
                  <FilterCombobox 
                    title="Heading"
                    placeholder="Gõ để tìm Heading..."
                    value={headingFilter}
                    onChange={setHeadingFilter}
                    options={uniqueOptions.headings.map(s => ({label: s, value: s}))}
                  />
                </th>
                <th className="px-2 py-2 font-normal">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Tìm bằng dấu phẩy (vd: gỗ, nhựa)..."
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        className="pl-9 text-sm bg-background"
                      />
                    </div>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={handleCopyVisible}
                      title="Copy các dòng đang hiển thị"
                      className="shrink-0 bg-background"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </th>
                <th className="px-2 py-2 font-normal">
                  <FilterCombobox 
                    title="trạng thái"
                    placeholder="Gõ để tìm trạng thái..."
                    value={statusFilter}
                    onChange={setStatusFilter}
                    options={uniqueOptions.statuses.map(s => ({
                      label: s === "Valid" ? "Hợp lệ (OK)" : s === "Duplicate_Key" ? "Trùng lặp" : "Lỗi (Corrupt)",
                      value: s
                    }))}
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 1000).map((row, i) => {
                const isMarketingCopy = row.base_heading.toLowerCase().includes("marketing copy");
                
                return (
                  <tr
                    key={i}
                    className={cn(
                      "border-t border-slate-300 dark:border-slate-700 transition-colors divide-x divide-slate-300 dark:divide-slate-700",
                      row.validation_status === "Duplicate_Key" && "bg-error-row",
                      row.validation_status === "Corrupted_Value" && "bg-error-row",
                      row.validation_status === "Valid" && isMarketingCopy && "bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700",
                      row.validation_status === "Valid" && !isMarketingCopy && "hover:bg-muted/50"
                    )}
                  >
                  <td className="px-4 py-2 text-muted-foreground">{i + 1}</td>
                  <td className="px-4 py-2 font-mono text-xs">{row.sku}</td>
                  <td className="px-4 py-2 font-medium">{row.base_heading}</td>
                  <td className="px-4 py-2">{row.attribute_heading}</td>
                  <td 
                    className="px-4 py-2 max-w-xs truncate cursor-pointer hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                    title="Click để xem toàn bộ nội dung"
                    onClick={() => setSelectedRowContent({ sku: row.sku, heading: row.attribute_heading, value: row.value })}
                  >
                    {row.value}
                  </td>
                  <td className="px-4 py-2">
                    {row.validation_status === "Valid" ? (
                      <Badge variant="outline" className="text-xs bg-emerald-100/50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800 font-bold">OK</Badge>
                    ) : (
                      <Badge variant="destructive" className="text-xs">
                        {row.validation_status === "Duplicate_Key" ? "Trùng" : "Lỗi"}
                      </Badge>
                    )}
                  </td>
                </tr>
              );
            })}
            </tbody>
          </table>
          {filtered.length > 1000 && (
            <p className="text-center text-sm text-muted-foreground py-3">
              Hiển thị 1,000 / {filtered.length} dòng
            </p>
          )}
        </div>
      </div>

      <Dialog open={!!selectedRowContent} onOpenChange={(open) => !open && setSelectedRowContent(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle>Chi tiết dữ liệu</DialogTitle>
            <DialogDescription className="font-mono mt-1 font-semibold text-sm text-slate-700 dark:text-slate-300">
              [{selectedRowContent?.sku}] — {selectedRowContent?.heading}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto bg-muted/50 p-4 rounded-md border text-sm whitespace-pre-wrap leading-relaxed shadow-inner">
            {selectedRowContent?.value}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
