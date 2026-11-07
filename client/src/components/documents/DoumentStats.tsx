import { FileText, CheckCircle2, Clock3, AlertCircle } from "lucide-react";
import type { DocumentCounts } from "@/lib/utils/document";

type Props = {
  counts: DocumentCounts;
};

export default function DocumentStats({ counts }: Props) {
  const stats = [
    { label: "Total documents", value: counts.all, icon: FileText, color: "text-primary" },
    { label: "Ready", value: counts.ready, icon: CheckCircle2, color: "text-success" },
    { label: "Processing", value: counts.processing, icon: Clock3, color: "text-warning" },
    { label: "Failed", value: counts.failed, icon: AlertCircle, color: "text-destructive" },
  ];

  return (
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map((item) => {
        const Icon = item.icon;

        return (
          <div key={item.label} className="glass p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-muted-foreground sm:text-sm">
                {item.label}
              </p>
              <Icon size={18} className={item.color} />
            </div>

            <p className="mt-3 text-2xl font-extrabold text-foreground sm:text-3xl">
              {item.value}
            </p>
          </div>
        );
      })}
    </section>
  );
}