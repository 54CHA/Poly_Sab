import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Database, ChevronDown, Search, Filter } from "lucide-react";
import { Input } from "./ui/input";
import { useState, useMemo } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "./ui/dropdown-menu";
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
  groupedSubjects,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [filterByCategories, setFilterByCategories] = useState(false);

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
      const matchesCategories = !filterByCategories || selectedCategories.length === 0 || 
        subject.categories?.some(cat => selectedCategories.includes(cat.name));
      return matchesSearch && matchesCategories;
    });

    if (filterByCategories) {
      const categoryGroups = {};
      
      if (selectedCategories.length > 0) {
        const categoryName = selectedCategories[0];
        const subjectsInCategory = filteredSubjects.filter(subject =>
          subject.categories?.some(cat => cat.name === categoryName)
        );
        if (subjectsInCategory.length > 0) {
          categoryGroups[categoryName] = subjectsInCategory;
        }
      } else {
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
      }

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
  }, [subjects, searchQuery, selectedCategories, filterByCategories]);

  const handleCategoryToggle = (category) => {
    setSelectedCategories(prev =>
      prev.includes(category) ? [] : [category]
    );
  };

  return (
    <>
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

            {Object.entries(filteredGroupedSubjects).map(([letter, letterSubjects]) => (
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
                  className="h-6 px-2text-muted-foreground hover:text-foreground"
                >
                  Сбросить
                </Button>
              )}
            </div>
            <div className="space-y-2">
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
              <div className="flex items-center gap-2">
                <Button
                  variant={filterByCategories ? "default" : "outline"}
                  size="sm"
                  className="w-full justify-between"
                  onClick={() => setFilterByCategories(!filterByCategories)}
                >
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <span>
                      {filterByCategories ? "По категориям" : "По алфавиту"}
                    </span>
                  </div>
                </Button>
              </div>
              {filterByCategories && categories.length > 0 && (
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span>
                          {selectedCategories.length
                            ? selectedCategories[0]
                            : "Выберите категорию"}
                        </span>
                      </div>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="w-[var(--radix-dropdown-trigger-width)]"
                  >
                    {categories.map((category) => (
                      <DropdownMenuCheckboxItem
                        key={category}
                        checked={selectedCategories.includes(category)}
                        onCheckedChange={() => handleCategoryToggle(category)}
                      >
                        {category}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
          <div
            className="space-y-4 overflow-y-auto pr-2 mt-3"
            style={{ 
              height: filterByCategories 
                ? "calc(100% - 10rem)" 
                : "calc(100% - 120px)" 
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
