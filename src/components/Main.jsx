import { useState, useMemo, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  Search,
  FileUp,
  Brain,
  Database,
  ChevronDown,
  PlusCircle,
  AlertCircle,
  X,
  ArrowUp,
  Calculator as CalculatorIcon,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "../lib/supabase";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import { cn } from "@/lib/utils";
import AiChatPopup from "./AiChatPopup";
import SubjectsSidebar from "./SubjectsSidebar";
import MaterialsSection from "./MaterialsSection";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "./ui/tooltip";
import Calculator from "./Calculator";

const Main = () => {
  const [answers, setAnswers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [localAnswers, setLocalAnswers] = useState([]);
  const [displayLimit, setDisplayLimit] = useState(30);
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [isAddingAnswer, setIsAddingAnswer] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [localSubjectAnswers, setLocalSubjectAnswers] = useState({});
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [subjectData, setSubjectData] = useState(null);
  const [isMaterialsVisible, setIsMaterialsVisible] = useState(false);

  useEffect(() => {
    const loadInitialData = async () => {
      await fetchSubjects();
      const savedSubjectId = localStorage.getItem("selectedSubjectId");
      const savedAnswers = localStorage.getItem("answers");

      if (savedSubjectId && savedAnswers) {
        const parsedId = parseInt(savedSubjectId);
        if (!isNaN(parsedId)) {
          setSelectedSubject(parsedId);
          setAnswers(JSON.parse(savedAnswers));
          setDisplayLimit(30);
        } else {
          localStorage.removeItem("selectedSubjectId");
          localStorage.removeItem("answers");
        }
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    const savedAnswers = localStorage.getItem("localSubjectAnswers");
    if (savedAnswers) {
      setLocalSubjectAnswers(JSON.parse(savedAnswers));
    }
  }, []);

  useEffect(() => {
    if (Object.keys(localSubjectAnswers).length > 0) {
      localStorage.setItem(
        "localSubjectAnswers",
        JSON.stringify(localSubjectAnswers)
      );
    }
  }, [localSubjectAnswers]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const fetchSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from("subjects")
        .select(`
          id, 
          name, 
          questions_count, 
          file_name,
          subject_categories (
            category:categories(id, name)
          )
        `);

      if (error) throw error;

      const processedData = data.map(subject => ({
        ...subject,
        categories: subject.subject_categories
          ?.map(sc => sc.category)
          .filter(Boolean)
          .sort((a, b) => a.name.localeCompare(b.name)) || []
      }));

      const sortedSubjects = processedData.sort((a, b) => a.name.localeCompare(b.name));
      setSubjects(sortedSubjects);
    } catch (err) {
      console.error("Error fetching subjects:", err);
    }
  };

  const handleSubjectSelect = async (subjectId) => {
    const loadingToast = toast.loading("Загрузка ответов...");

    try {
      const { data, error } = await supabase
        .from("subjects")
        .select("answers, materials, name")
        .eq("id", subjectId)
        .single();

      if (error) throw error;

      setSelectedSubject(subjectId);
      setAnswers(data.answers);
      setSubjectData(data);
      setDisplayLimit(30);

      localStorage.setItem("selectedSubjectId", subjectId.toString());
      localStorage.setItem("answers", JSON.stringify(data.answers));

      toast.dismiss(loadingToast);
    } catch (error) {
      console.error("Error loading answers:", error);
      toast.dismiss(loadingToast);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsedAnswers = JSON.parse(text);

      if (
        Array.isArray(parsedAnswers) &&
        parsedAnswers.every((item) => item.question && item.answer)
      ) {
        const processedAnswers = parsedAnswers.map((answer) => ({
          question: answer.question,
          answer: answer.answer,
          unverified: false,
          addedAt: new Date().toISOString(),
        }));

        setLocalAnswers(processedAnswers);
        setSelectedSubject(null);
        setAnswers([]);
        setDisplayLimit(30);

        localStorage.removeItem("selectedSubjectId");
        localStorage.removeItem("answers");

        toast.success("Файл загружен", {
          description: `Загружено ${processedAnswers.length} вопросов`,
        });
      } else {
        throw new Error("Неверный формат JSON");
      }
    } catch (error) {
      console.error("Error loading file:", error);
      toast.error("Ошибка", {
        description: "Не удалось загрузить файл. Проверьте формат JSON",
      });
    } finally {
      event.target.value = "";
    }
  };

  const filteredAnswers = useMemo(() => {
    const currentAnswers = selectedSubject ? answers : localAnswers;

    if (!searchQuery.trim()) {
      return currentAnswers.slice(0, displayLimit);
    }

    const query = searchQuery.toLowerCase();
    return currentAnswers
      .filter(
        (item) =>
          item.question.toLowerCase().includes(query) ||
          item.answer.toLowerCase().includes(query)
      )
      .slice(0, displayLimit);
  }, [answers, localAnswers, selectedSubject, searchQuery, displayLimit]);

  const handleSearch = (engine) => {
    if (!searchQuery.trim()) {
      toast.error("Ошибка", {
        description: "Введите текст для поиска",
        duration: 3000,
      });
      return;
    }

    const encodedQuery = searchQuery.replace(/\s+/g, "+");
    const searchUrls = {
      duckduckgo: `https://duckduckgo.com/?q=${encodedQuery}&t=ffab&ia=web`,
      google: `https://www.google.com/search?q=${encodedQuery}`,
      yandex: `https://yandex.ru/search/?text=${encodedQuery}`,
    };

    window.open(searchUrls[engine], "_blank");
  };

  const handleAiQuery = () => {
    setIsAiChatOpen(true);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Скопировано", {
      description: "Текст скопирован в буфер обмена",
    });
  };

  const groupedSubjects = useMemo(() => {
    const groups = {};
    const nonRussianGroups = {};

    const russianPattern = /^[А-Яа-я]/;

    subjects.forEach((subject) => {
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
  }, [subjects]);

  const handleResetSubject = () => {
    setSelectedSubject(null);
    setAnswers([]);
    setDisplayLimit(30);
    localStorage.removeItem("selectedSubjectId");
    localStorage.removeItem("answers");
    toast.success("Предмет успешно сброшен", {
      duration: 1000,
       style: { background: 'white', color: 'black', border: 'none' }
    });
  };

  const handleLoadMore = () => {
    setDisplayLimit((prev) => prev + 30);
  };

  const handleAddAnswer = async () => {
    if (!selectedSubject) {
      toast.error("Ошибка", {
        description: "Сначала выберите предмет",
      });
      return;
    }

    if (!newQuestion.trim() || !newAnswer.trim()) {
      toast.error("Ошибка", {
        description: "Заполните все поля",
      });
      return;
    }

    const loadingToast = toast.loading("Добавление ответа...");

    try {
      const id = String(selectedSubject);

      const { data: currentData, error: fetchError } = await supabase
        .from("subjects")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchError) {
        console.error("Fetch error:", fetchError);
        throw fetchError;
      }

      const newItem = {
        question: newQuestion.trim(),
        answer: newAnswer.trim(),
        unverified: true,
        addedAt: new Date().toISOString(),
      };

      console.log("Current data:", currentData);
      console.log("New item:", newItem);

      const updatedAnswers = [...currentData.answers, newItem];

      const { data: updateData, error: updateError } = await supabase
        .from("subjects")
        .update({
          answers: updatedAnswers,
          questions_count: updatedAnswers.length,
        })
        .eq("id", id)
        .select();

      if (updateError) {
        console.error("Update error:", updateError);
        throw updateError;
      }

      console.log("Update successful:", updateData);

      setAnswers(updatedAnswers);
      localStorage.setItem("answers", JSON.stringify(updatedAnswers));

      setNewQuestion("");
      setNewAnswer("");
      setIsAddingAnswer(false);

      toast.dismiss(loadingToast);
      toast.success("Ответ добавлен", {
        description: "Ваш ответ успешно добавлен в базу данных",
      });
    } catch (error) {
      console.error("Full error details:", error);
      toast.dismiss(loadingToast);
      toast.error("Ошибка", {
        description: `Не удалось добавить ответ: ${
          error.message || "Неизвестная ошибка"
        }`,
      });
    }
  };

  const handleCancelAdd = () => {
    setNewQuestion("");
    setNewAnswer("");
    setIsAddingAnswer(false);
  };

  return (
    <main className="max-w-[1200px] mx-auto p-4 sm:p-6">
      <div className="flex flex-col md:flex-row gap-6">
        <SubjectsSidebar
          subjects={subjects}
          selectedSubject={selectedSubject}
          onSubjectSelect={handleSubjectSelect}
          onReset={handleResetSubject}
          groupedSubjects={groupedSubjects}
        />

        <div className="flex-1 space-y-6">
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 sm:p-6">
            {isAddingAnswer ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold tracking-tight">
                    Добавить ответ
                  </h2>
                  <Button variant="ghost" size="sm" onClick={handleCancelAdd}>
                    <X className="h-4 w-4 mr-2" />
                    Отмена
                  </Button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Вопрос
                    </label>
                    <Input
                      value={newQuestion}
                      onChange={(e) => setNewQuestion(e.target.value)}
                      placeholder="Введите вопрос"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Ответ
                    </label>
                    <Input
                      value={newAnswer}
                      onChange={(e) => setNewAnswer(e.target.value)}
                      placeholder="Введите ответ"
                    />
                  </div>

                  <div className="flex items-center text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                    <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                    <p>Ваш ответ будет помечен как непроверенный.</p>
                  </div>

                  <Button className="w-full" onClick={handleAddAnswer}>
                    Добавить ответ
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4 sm:gap-6">
                <div className="flex justify-between items-center">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-semibold tracking-tight">
                      Поиск ответов
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Выберите предмет из базы данных или загрузите новый JSON
                      файл
                    </p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={() => setIsAddingAnswer(true)}
                  className="w-full"
                  disabled={!selectedSubject}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Добавить свой ответ
                </Button>

                <div className="flex flex-col lg:flex-row gap-2">
                  <div className="flex flex-col lg:flex-row gap-2 w-full lg:w-[60%]">
                    <Input
                      type="text"
                      placeholder="Поиск..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="grid grid-cols-2 md:flex gap-2">
                    <input
                      type="file"
                      id="file-input"
                      className="hidden"
                      accept=".json"
                      onChange={handleFileUpload}
                    />
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="default"
                          className="gap-2 w-full lg:w-auto"
                        >
                          <Search className="h-4 w-4" />
                          Поиск
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="start"
                        sideOffset={5}
                        className="w-[var(--radix-dropdown-trigger-width)]"
                      >
                        <DropdownMenuItem
                          onClick={() => handleSearch("duckduckgo")}
                        >
                          DuckDuckGo
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleSearch("google")}
                        >
                          Google
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleSearch("yandex")}
                        >
                          Яндекс
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                      variant="default"
                      onClick={handleAiQuery}
                      className="gap-2 w-full lg:w-auto"
                    >
                      <Brain className="h-4 w-4" />
                      ИИ
                    </Button>
                    <Button
                      variant="default"
                      onClick={() => setIsCalculatorOpen(true)}
                      className="gap-2 w-full lg:w-auto"
                    >
                      <CalculatorIcon className="h-4 w-4" />
                      <p className="block lg:hidden">Кальк.</p>
                    </Button>
                    <TooltipProvider>
                      <Tooltip delayDuration={50}>
                        <TooltipTrigger asChild>
                          <Button
                            variant="default"
                            onClick={() =>
                              document.getElementById("file-input").click()
                            }
                            className="gap-2 w-full lg:w-auto"
                          >
                            <FileUp className="h-4 w-4" />
                            JSON
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <pre className="text-xs">
                            Формат JSON: [{'"question": "...", "answer": "..."'}
                            , ... ]
                          </pre>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </div>
            )}
          </div>

          {selectedSubject && <MaterialsSection materials={subjectData?.materials} />}

          {(localAnswers.length > 0 ? localAnswers : answers).length > 0 ? (
            <div className="space-y-4">
              <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                <div className="grid grid-cols-1 divide-y md:hidden">
                  {filteredAnswers.map((item, index) => (
                    <div key={index} className="p-4 space-y-2">
                      <div
                        onClick={() => copyToClipboard(item.question)}
                        className="cursor-pointer hover:bg-muted/50 transition-colors rounded p-2"
                      >
                        <div className="text-sm text-muted-foreground mb-1">
                          Вопрос:
                        </div>
                        <div className="text-sm">{item.question}</div>
                      </div>
                      <div
                        onClick={() => copyToClipboard(item.answer)}
                        className={cn(
                          "cursor-pointer transition-colors rounded p-2",
                          item.unverified
                            ? "bg-yellow-500/10 border border-yellow-500/20"
                            : "hover:bg-muted/50"
                        )}
                      >
                        <div className="text-sm text-muted-foreground mb-1">
                          Ответ:
                        </div>
                        <div
                          className={cn(
                            "text-sm",
                            item.unverified && "text-muted-foreground"
                          )}
                        >
                          {item.answer}
                          {item.unverified && (
                            <div className="flex items-center gap-2 mt-2 border-t border-yellow-500/20 pt-2">
                              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-yellow-500/15 text-xs">
                                <AlertCircle className="h-3.5 w-3.5 text-yellow-500" />
                                <span className="font-medium text-yellow-500">
                                  Непроверенный ответ
                                </span>
                              </div>
                              
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[40%]">Вопрос</TableHead>
                        <TableHead>Ответ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAnswers.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell
                            onClick={() => copyToClipboard(item.question)}
                            className="cursor-pointer hover:bg-muted/50 transition-colors"
                          >
                            {item.question}
                          </TableCell>
                          <TableCell
                            onClick={() => copyToClipboard(item.answer)}
                            className={cn(
                              "cursor-pointer transition-colors relative",
                              item.unverified
                                ? "bg-yellow-500/10 border-y border-yellow-500/20"
                                : "hover:bg-muted/50"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              {item.unverified && (
                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-yellow-500/15">
                                  <AlertCircle className="h-3.5 w-3.5 text-yellow-500" />
                                  <span className="text-xs font-medium text-yellow-500">
                                    Непроверенный
                                  </span>
                                </div>
                              )}
                              <span
                                className={cn(
                                  item.unverified && "text-muted-foreground"
                                )}
                              >
                                {item.answer}
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {(localAnswers.length > displayLimit ||
                (!localAnswers.length && answers.length > displayLimit)) && (
                <Button
                  variant="secondary"
                  onClick={handleLoadMore}
                  className="w-full"
                >
                  Загрузить еще
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-12">
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="rounded-full bg-primary/10 p-4">
                  <Database className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">Выберите предмет</h3>
                <p className="text-sm text-muted-foreground">
                  Выберите предмет из списка или загрузите новый JSON файл с
                  вопросами
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {showScrollTop && (
        <Button
          variant="default"
          size="icon"
          className="fixed bottom-6 right-6 rounded-full shadow-md hover:shadow-lg z-50 bg-black hover:bg-black/90 text-white"
          onClick={scrollToTop}
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
      )}

      <AiChatPopup
        isOpen={isAiChatOpen}
        onClose={() => setIsAiChatOpen(false)}
        initialQuery={searchQuery}
      />

      <Calculator
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
        isHidden={isHidden}
      />
    </main>
  );
};

export default Main;
