import {
  CheckCircle2,
  Loader2,
  Clock3,
  AlertCircle,
} from "lucide-react";

import type { DocumentStatus } from "@/lib/api/documents";

type Props = {
  status: DocumentStatus;
};

const statusConfig = {
  ready: {
    label: "Ready",
    icon: CheckCircle2,
    className: "border-emerald-400/20 bg-emerald-400/10 text-emerald-400",
  },
  processing: {
    label: "Processing",
    icon: Loader2,
    className: "border-amber-400/20 bg-amber-400/10 text-amber-400",
  },
  uploaded: {
    label: "Uploaded",
    icon: Clock3,
    className: "border-blue-400/20 bg-blue-400/10 text-blue-400",
  },
  failed: {
    label: "Failed",
    icon: AlertCircle,
    className: "border-red-400/20 bg-red-400/10 text-red-400",
  },
  deleting: {
    label: "Deleting",
    icon: Loader2,
    className: "border-white/10 bg-white/5 text-white/50",
  },
};

export default function StatusBadge({ status }: Props) {
  const item = statusConfig[status];
  const Icon = item.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${item.className}`}
    >
      <Icon
        size={13}
        className={
          status === "processing" || status === "deleting"
            ? "animate-spin"
            : ""
        }
      />
      {item.label}
    </span>
  );
}