import { Toaster } from "sonner";
import { cn } from "@/lib/utils";

const CustomToaster = ({ isHidden, ...props }) => {
  return (
    <div className={cn(
      "transition-opacity duration-100",
      isHidden ? "opacity-0 pointer-events-none" : "opacity-100"
    )}>
      <Toaster {...props} />
    </div>
  );
};

export default CustomToaster; 