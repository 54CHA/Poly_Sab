import { useState } from "react";
import { Button } from "./ui/button";
import { ChevronDown, Database, FileUp, Link as LinkIcon, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

const MaterialsSection = ({ materials }) => {
  const [isMaterialsVisible, setIsMaterialsVisible] = useState(false);

  if (!materials?.length) return null;

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <Button
        variant="ghost"
        className="w-full flex justify-between items-center p-4 sm:p-6 hover:bg-transparent"
        onClick={() => setIsMaterialsVisible(!isMaterialsVisible)}
      >
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold">Материалы по предмету</span>
        </div>
        <ChevronDown 
          className={cn("h-4 w-4 text-muted-foreground transition-transform", {
            "transform rotate-180": isMaterialsVisible
          })} 
        />
      </Button>
      {isMaterialsVisible && (
        <div className="p-2 pt-0 space-y-2">
          {materials.map((material, index) => (
            <a
              key={index}
              href={material.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between p-2 hover:bg-muted/50 rounded-md transition-colors"
            >
              <div className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4 text-primary" />
                <span className="text-sm text-primary underline-offset-4 group-hover:underline">
                  {material.label || material.link}
                </span>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

export default MaterialsSection; 