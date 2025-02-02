import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Database, ChevronDown, Search} from "lucide-react";
import { Input } from "./ui/input";
import { useState, useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";

export default function SubjectsSidebar({
  subjects,
  selectedSubject,
  onSubjectSelect,
  onReset,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterByCategories, setFilterByCategories] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const categories = useMemo(() => {
    const uniqueCategories = new Set();
    subjects.forEach((subject) => {
      subject.categories?.forEach((category) => {
        uniqueCategories.add(category.name);
      });
    });
    return Array.from(uniqueCategories).sort();
  }, [subjects]);

  const filteredGroupedSubjects = useMemo(() => {
    const query = searchQuery.toLowerCase();

    const filteredSubjects = subjects.filter((subject) => {
      const matchesSearch = !query || subject.name.toLowerCase().includes(query);
      return matchesSearch;
    });

    if (filterByCategories) {
      const categoryGroups = {};
      
      filteredSubjects.forEach(subject => {
        if (subject.categories && subject.categories.length > 0) {
          subject.categories.forEach(category => {
            if (!categoryGroups[category.name]) {
              categoryGroups[category.name] = [];
            }
            categoryGroups[category.name].push(subject);
          });
        } else {
          if (!categoryGroups["Без категории"]) {
            categoryGroups["Без категории"] = [];
          }
          categoryGroups["Без категории"].push(subject);
        }
      });

      const sortedGroups = {};
      Object.keys(categoryGroups)
        .sort((a, b) => a === "Без категории" ? 1 : b === "Без категории" ? -1 : a.localeCompare(b))
        .forEach(key => {
          sortedGroups[key] = categoryGroups[key];
        });

      return sortedGroups;
    }
    
    const groups = {};
    const nonRussianGroups = {};
    const russianPattern = /^[А-Яа-я]/;

    filteredSubjects.forEach((subject) => {
      const firstLetter = subject.name.charAt(0).toUpperCase();

      if (russianPattern.test(firstLetter)) {
        if (!groups[firstLetter]) {
          groups[firstLetter] = [];
        }
        groups[firstLetter].push(subject);
      } else {
        if (!nonRussianGroups[firstLetter]) {
          nonRussianGroups[firstLetter] = [];
        }
        nonRussianGroups[firstLetter].push(subject);
      }
    });

    return {
      ...groups,
      ...nonRussianGroups,
    };
  }, [subjects, searchQuery, filterByCategories]);

  return (
    <>
      <div className="md:hidden w-full">
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full gap-2 justify-between">
              <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                <Database className="h-4 w-4 shrink-0" />
                <span className="truncate">
                  {subjects.find((s) => s.id === selectedSubject)?.name ||
                    "Выберите предмет"}
                </span>
              </div>
              <ChevronDown className="h-4 w-4 shrink-0" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-full sm:max-w-lg p-0">
            <div className="flex flex-col h-full">
              <div className="p-4 border-b">
                <SheetHeader className="mb-4">
                  <SheetTitle>Выберите предмет</SheetTitle>
                </SheetHeader>
                
                <div className="space-y-3">
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
                  
                  <div className="grid grid-cols-2 gap-1 p-1 bg-muted rounded-lg">
                    <button
                      onClick={() => setFilterByCategories(false)}
                      className={cn(
                        "px-3 py-1.5 text-sm rounded-md transition-colors",
                        !filterByCategories
                          ? "bg-white text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Алфавит
                    </button>
                    <button
                      onClick={() => setFilterByCategories(true)}
                      className={cn(
                        "px-3 py-1.5 text-sm rounded-md transition-colors",
                        filterByCategories
                          ? "bg-white text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Категории
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                <div className="divide-y">
                  {Object.entries(filteredGroupedSubjects).map(([group, groupSubjects]) => (
                    <div key={group} className="space-y-1 py-2">
                      <div className="text-sm font-medium text-muted-foreground px-4 sticky top-0 bg-background/95 backdrop-blur py-2 z-10">
                        {group}
                      </div>
                      {groupSubjects.map((subject) => (
                        <button
                          key={subject.id}
                          onClick={() => {
                            onSubjectSelect(subject.id);
                            setIsSheetOpen(false);
                          }}
                          className={cn(
                            "w-full text-left px-4 py-3 transition-colors",
                            "hover:bg-muted/50",
                            selectedSubject === subject.id && "bg-muted"
                          )}
                        >
                          <div className="font-medium">{subject.name}</div>
                          <div className="text-sm text-muted-foreground mt-0.5">
                            {subject.questions_count} вопросов
                          </div>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {selectedSubject && (
                <div className="p-4 border-t">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      onReset();
                      setIsSheetOpen(false);
                    }}
                  >
                    Сбросить выбор
                  </Button>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar - With Search */}
      <div className="hidden md:block w-64 shrink-0 space-y-4 sticky top-4 h-[calc(100vh-8rem)] z-30">
        <div className="rounded-lg border bg-card p-4 h-full">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Предметы</h3>
              {selectedSubject && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onReset}
                  className="h-6 px-2 text-muted-foreground hover:text-foreground"
                >
                  Сбросить
                </Button>
              )}
            </div>
            <div className="space-y-3">
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
              
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-1 p-1 bg-muted rounded-lg">
                  <button
                    onClick={() => setFilterByCategories(false)}
                    className={cn(
                      "px-3 py-1.5 text-sm rounded-md transition-colors",
                      !filterByCategories
                        ? "bg-white text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Алфавит
                  </button>
                  <button
                    onClick={() => setFilterByCategories(true)}
                    className={cn(
                      "px-3 py-1.5 text-sm rounded-md transition-colors",
                      filterByCategories
                        ? "bg-white text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Категории
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div
            className="space-y-4 overflow-y-auto pr-2 mt-3"
            style={{ 
              height: filterByCategories 
                ? "calc(100% - 130px)" 
                : "calc(100% - 130px)" 
            }}
          >
            {Object.entries(filteredGroupedSubjects).map(
              ([group, groupSubjects]) => (
                <div key={group} className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground px-3 sticky top-0 bg-card z-10">
                    {group}
                  </div>
                  {groupSubjects.map((subject) => (
                    <TooltipProvider key={subject.id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => onSubjectSelect(subject.id)}
                            className={cn(
                              "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                              "hover:bg-muted/50",
                              selectedSubject === subject.id &&
                                "bg-muted font-medium"
                            )}
                          >
                            <div className="truncate">{subject.name}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {subject.questions_count} вопросов
                            </div>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="right" align="start">
                          {subject.name}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </>
  );
}
