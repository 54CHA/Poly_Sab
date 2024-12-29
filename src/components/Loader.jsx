import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const Loader = ({ className }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <Loader2 className={cn("h-12 w-12 animate-spin text-primary", className)} />
    </div>
  );
};

export default Loader; 