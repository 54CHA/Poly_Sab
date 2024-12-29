import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Database, ChevronDown, Search } from "lucide-react";
import { Input } from "./ui/input";
import { useState, useMemo } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";

export default function SubjectsSidebar({
  subjects,
  selectedSubject,
  onSubjectSelect,
  onReset,
  groupedSubjects,
}) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter and group subjects based on search query (only used in desktop)
  const filteredGroupedSubjects = useMemo(() => {
    if (!searchQuery.trim()) return groupedSubjects;

    const query = searchQuery.toLowerCase();
    const filtered = {};

    Object.entries(groupedSubjects).forEach(([letter, letterSubjects]) => {
      const filteredSubjects = letterSubjects.filter(subject =>
        subject.name.toLowerCase().includes(query)
      );
      if (filteredSubjects.length > 0) {
        filtered[letter] = filteredSubjects;
      }
    });

    return filtered;
  }, [groupedSubjects, searchQuery]);

  return (
    <>
      {/* Mobile Dropdown - No Search */}
      <div className="md:hidden w-full">
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full gap-2 justify-between">
              <div className="flex items-center gap-2 truncate">
                <Database className="h-4 w-4 shrink-0" />
                <span className="truncate">
                  {subjects.find((s) => s.id === selectedSubject)?.name ||
                    "Выберите предмет"}
                </span>
              </div>
              <ChevronDown className="h-4 w-4 shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-[var(--radix-dropdown-trigger-width)] max-h-[60vh] overflow-y-auto"
          >
            {selectedSubject && (
              <>
                <DropdownMenuItem onClick={onReset}>
                  Сбросить выбор
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}

            {/* Use unfiltered groupedSubjects for mobile */}
            {Object.entries(groupedSubjects).map(([letter, letterSubjects]) => (
              <div key={letter}>
                <DropdownMenuItem
                  className="text-sm text-muted-foreground"
                  disabled
                >
                  {letter}
                </DropdownMenuItem>
                {letterSubjects.map((subject) => (
                  <DropdownMenuItem
                    key={subject.id}
                    onClick={() => onSubjectSelect(subject.id)}
                    className="pl-6"
                  >
                    <div className="flex flex-col w-full py-1">
                      <div className="truncate">{subject.name}</div>
                    </div>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Desktop Sidebar - With Search */}
      <div className="hidden md:block w-64 shrink-0 space-y-4 sticky top-4 h-[calc(100vh-8rem)]">
        <div className="rounded-lg border bg-card p-4 h-full">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Предметы</h3>
              {selectedSubject && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onReset}
                  className="h-8 px-2 text-muted-foreground hover:text-foreground"
                >
                  Сбросить
                </Button>
              )}
            </div>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Поиск предмета..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <div
            className="space-y-4 overflow-y-auto pr-2 mt-3"
            style={{ height: "calc(100% - 5rem)" }}
          >
            {Object.entries(filteredGroupedSubjects).map(([letter, letterSubjects]) => (
              <div key={letter} className="space-y-1">
                <div className="text-sm font-medium text-muted-foreground px-3 sticky top-0 bg-card z-10">
                  {letter}
                </div>
                {letterSubjects.map((subject) => (
                  <button
                    key={subject.id}
                    onClick={() => onSubjectSelect(subject.id)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                      "hover:bg-muted/50",
                      selectedSubject === subject.id && "bg-muted font-medium"
                    )}
                  >
                    <div className="truncate">{subject.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {subject.questions_count} вопросов
                    </div>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
} 