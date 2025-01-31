import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Pencil, Trash2, X, ChevronDown, ChevronRight, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "../lib/supabase";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";

const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [subjectSearch, setSubjectSearch] = useState("");

  useEffect(() => {
    fetchCategories();
    fetchAllSubjects();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("categories")
        .select("*")
        .order("name", { ascending: true });

      if (categoriesError) throw categoriesError;

      const categoriesWithSubjects = await Promise.all(
        categoriesData.map(async (category) => {
          const { data: subjectData, error: subjectError } = await supabase
            .from("subject_categories")
            .select("subject:subjects(id, name, file_name)")
            .eq("category_id", category.id);

          if (subjectError) throw subjectError;

          return {
            ...category,
            subjects: subjectData.map((item) => item.subject).filter(Boolean),
            subjects_count: subjectData.length,
          };
        })
      );

      setCategories(categoriesWithSubjects);
    } catch (error) {
      toast.error("Ошибка", {
        description: "Не удалось загрузить список категорий",
      });
    }
  };

  const fetchAllSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from("subjects")
        .select("id, name, file_name")
        .order("name", { ascending: true });

      if (error) throw error;
      setSubjects(data);
    } catch (error) {
      toast.error("Ошибка", {
        description: "Не удалось загрузить список предметов",
      });
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("categories")
        .insert([{ name: newCategoryName.trim() }]);

      if (error) throw error;

      toast.success("Успешно", {
        description: "Категория создана",
      });

      setNewCategoryName("");
      fetchCategories();
    } catch (error) {
      toast.error("Ошибка", {
        description: "Не удалось создать категорию",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateCategory = async (id, newName) => {
    if (!newName.trim()) return;

    try {
      const { error } = await supabase
        .from("categories")
        .update({ name: newName.trim() })
        .eq("id", id);

      if (error) throw error;

      toast.success("Успешно", {
        description: "Категория обновлена",
      });

      setEditingCategory(null);
      fetchCategories();
    } catch (error) {
      toast.error("Ошибка", {
        description: "Не удалось обновить категорию",
      });
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!confirm("Вы уверены, что хотите удалить эту категорию?")) return;

    try {
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Успешно", {
        description: "Категория удалена",
      });

      fetchCategories();
    } catch (error) {
      toast.error("Ошибка", {
        description: "Не удалось удалить категорию",
      });
    }
  };

  const toggleCategory = (categoryId) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const handleAddSubjects = async () => {
    if (!selectedCategory || selectedSubjects.length === 0) return;

    try {
      const relations = selectedSubjects.map((subjectId) => ({
        subject_id: subjectId,
        category_id: selectedCategory,
      }));

      const { error } = await supabase
        .from("subject_categories")
        .insert(relations);

      if (error) throw error;

      toast.success("Успешно", {
        description: "Предметы добавлены в категорию",
      });

      setIsAddingSubject(false);
      setSelectedSubjects([]);
      fetchCategories();
    } catch (error) {
      toast.error("Ошибка", {
        description: "Не удалось добавить предметы",
      });
    }
  };

  const handleRemoveSubject = async (categoryId, subjectId) => {
    try {
      const { error } = await supabase
        .from("subject_categories")
        .delete()
        .eq("category_id", categoryId)
        .eq("subject_id", subjectId);

      if (error) throw error;

      toast.success("Успешно", {
        description: "Предмет удален из категории",
      });

      fetchCategories();
    } catch (error) {
      toast.error("Ошибка", {
        description: "Не удалось удалить предмет из категории",
      });
    }
  };

  const openAddSubjectDialog = async (categoryId) => {
    try {
      await fetchAllSubjects();

      const { data: existingSubjects, error: existingError } = await supabase
        .from("subject_categories")
        .select("subject_id")
        .eq("category_id", categoryId);

      if (existingError) throw existingError;

      const existingIds = new Set(existingSubjects.map(s => s.subject_id));
      
      const available = subjects.filter(s => !existingIds.has(s.id));

      console.log('Available subjects:', available);
      
      setAvailableSubjects(available);
      setSelectedCategory(categoryId);
      setIsAddingSubject(true);
    } catch (error) {
      console.error('Error in openAddSubjectDialog:', error);
      toast.error("Ошибка", {
        description: "Не удалось загрузить список предметов",
      });
    }
  };

  const filteredAvailableSubjects = availableSubjects.filter(subject =>
    subject.name.toLowerCase().includes(subjectSearch.toLowerCase())
  );

  return (
    <main className="max-w-[1400px] mx-auto p-6 space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">Управление категориями</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Создание и управление категориями предметов
          </p>
        </div>
        <Button variant="outline" asChild className="w-full sm:w-auto">
          <Link to="/admin">Назад к предметам</Link>
        </Button>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Добавить новую категорию</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Название категории"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={handleCreateCategory}
              disabled={isLoading || !newCategoryName.trim()}
              className="w-full sm:w-auto"
            >
              Создать
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {categories.map((category) => (
          <div key={category.id} className="rounded-lg border bg-card">
            <div className="p-4 border-b flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleCategory(category.id)}
                >
                  {expandedCategories.has(category.id) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
                {editingCategory === category.id ? (
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Input
                      defaultValue={category.name}
                      autoFocus
                      className="flex-1"
                      onBlur={(e) => {
                        if (e.target.value !== category.name) {
                          handleUpdateCategory(category.id, e.target.value);
                        } else {
                          setEditingCategory(null);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleUpdateCategory(category.id, e.target.value);
                        } else if (e.key === "Escape") {
                          setEditingCategory(null);
                        }
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingCategory(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <h3 className="text-lg font-semibold truncate">{category.name}</h3>
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      {category.subjects_count} предметов
                    </span>
                  </div>
                )}
              </div>
              <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-center"
                  onClick={() => openAddSubjectDialog(category.id)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Добавить предметы
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditingCategory(category.id)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteCategory(category.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            {expandedCategories.has(category.id) && (
              <div className="p-4">
                {category.subjects.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Название предмета</TableHead>
                          <TableHead className="hidden sm:table-cell">Файл</TableHead>
                          <TableHead className="w-[100px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {category.subjects.map((subject) => (
                          <TableRow key={subject.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{subject.name}</div>
                                <div className="text-sm text-muted-foreground sm:hidden">
                                  {subject.file_name}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-muted-foreground">
                              {subject.file_name}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  handleRemoveSubject(category.id, subject.id)
                                }
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    В этой категории нет предметов
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
        {categories.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            Нет категорий
          </div>
        )}
      </div>

      <Dialog open={isAddingSubject} onOpenChange={setIsAddingSubject}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Добавить предметы в категорию</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <Input
                placeholder="Поиск предметов..."
                value={subjectSearch}
                onChange={(e) => setSubjectSearch(e.target.value)}
                className="w-full"
              />
              <div className="max-h-[300px] overflow-y-auto space-y-2">
                {filteredAvailableSubjects.map((subject) => (
                  <label
                    key={subject.id}
                    className="flex items-center gap-2 hover:bg-muted p-2 rounded-lg cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedSubjects.includes(subject.id)}
                      onChange={(e) => {
                        setSelectedSubjects((prev) =>
                          e.target.checked
                            ? [...prev, subject.id]
                            : prev.filter((id) => id !== subject.id)
                        );
                      }}
                      className="h-4 w-4"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{subject.name}</div>
                      <div className="text-sm text-muted-foreground truncate">
                        {subject.file_name}
                      </div>
                    </div>
                  </label>
                ))}
                {filteredAvailableSubjects.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">
                    {subjectSearch
                      ? "Нет предметов, соответствующих поиску"
                      : "Нет доступных предметов для добавления"}
                  </p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddingSubject(false);
                setSelectedSubjects([]);
                setSubjectSearch("");
              }}
              className="w-full sm:w-auto"
            >
              Отмена
            </Button>
            <Button
              onClick={() => {
                handleAddSubjects();
                setSubjectSearch("");
              }}
              disabled={selectedSubjects.length === 0}
              className="w-full sm:w-auto"
            >
              Добавить выбранные ({selectedSubjects.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default CategoriesPage; 
