import {
  FileText,
  CheckCircle2,
  Clock3,
  AlertCircle,
} from "lucide-react";

import type { DocumentCounts } from "@/lib/utils/document";
import { cn } from "cn";

type Props = {
  counts: DocumentCounts;
};

export default function DocumentStats({ counts }: Props) {
  const stats = [
    {
      label: "Total documents",
      value: counts.all,
      icon: FileText,
      color: "text-orange-300",
    },
    {
      label: "Ready",
      value: counts.ready,
      icon: CheckCircle2,
      color: "text-emerald-400",
    },
    {
      label: "Processing",
      value: counts.processing,
      icon: Clock3,
      color: "text-amber-400",
    },
    {
      label: "Failed",
      value: counts.failed,
      icon: AlertCircle,
      color: "text-red-400",
    },
  ];

  return (
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map((item) => {
        const Icon = item.icon;

        return (
          <div
            key={item.label}
            className={cn("rounded-2xl border border-white/[0.08] p-4 sm:p-5 glass backdrop-blur-3xl backdrop-saturate-180")}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-white/45 sm:text-sm">
                {item.label}
              </p>
              <Icon size={18} className={item.color} />
            </div>

            <p className="mt-3 text-2xl font-extrabold text-white sm:text-3xl">
              {item.value}
            </p>
          </div>
        );
      })}
    </section>
  );
}