import { useState, useEffect, useMemo } from "react";
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
import {
  FileUp,
  Trash2,
  Download,
  AlertCircle,
  MoreVertical,
  X,
  FolderOpen,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "../lib/supabase";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import debounce from "lodash/debounce";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import JSZip from "jszip";
import { Checkbox } from "../components/ui/checkbox";

const AdminPage = () => {
  const [subjects, setSubjects] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectLink, setNewSubjectLink] = useState("");
  const [newSubjectLinkLabel, setNewSubjectLinkLabel] = useState("");
  const [stagedData, setStagedData] = useState(null);
  const [materials, setMaterials] = useState([{ link: "", label: "" }]);
  const [editingSubject, setEditingSubject] = useState(null);
  const [isAddingMaterial, setIsAddingMaterial] = useState(false);
  const [newMaterial, setNewMaterial] = useState({ link: "", label: "" });
  const [editingSubjectId, setEditingSubjectId] = useState(null);
  const [subjectSearch, setSubjectSearch] = useState("");
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [selectedSubjects, setSelectedSubjects] = useState([]);

  const filteredSubjects = useMemo(() => {
    if (!subjectSearch.trim()) return subjects;

    const searchTerm = subjectSearch.toLowerCase();
    return subjects.filter(
      (subject) =>
        subject.name.toLowerCase().includes(searchTerm) ||
        subject.file_name.toLowerCase().includes(searchTerm)
    );
  }, [subjects, subjectSearch]);

  useEffect(() => {
    fetchSubjects();
    fetchCategories();
  }, []);

  const fetchSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from("subjects")
        .select(`
          id, 
          name, 
          file_name, 
          questions_count, 
          uploaded_at, 
          materials,
          subject_categories (
            category:categories(id, name)
          )
        `)
        .order("name", { ascending: true });

      if (error) throw error;

      const processedData = data.map(subject => ({
        ...subject,
        categories: subject.subject_categories
          ?.map(sc => sc.category)
          .filter(Boolean)
          .sort((a, b) => a.name.localeCompare(b.name)) || []
      }));

      setSubjects(processedData);
    } catch (error) {
      toast.error("Ошибка", {
        description: "Не удалось загрузить список предметов",
      });
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      setCategories(data);
    } catch (error) {
      toast.error("Ошибка", {
        description: "Не удалось загрузить список категорий",
      });
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !newSubjectName.trim()) {
      toast.error("Ошибка", {
        description: "Введите название предмета и выберите файл",
      });
      return;
    }

    try {
      const text = await file.text();
      const parsedAnswers = JSON.parse(text);

      if (
        !Array.isArray(parsedAnswers) ||
        !parsedAnswers.every((item) => item.question && item.answer)
      ) {
        throw new Error(
          "Неверный формат JSON. Каждый элемент должен содержать поля 'question' и 'answer'"
        );
      }

      const processedAnswers = parsedAnswers.map((answer) => ({
        ...answer,
        unverified: false,
      }));

      setStagedData({
        answers: processedAnswers,
        fileName: file.name,
      });

      toast.success("Файл проверен", {
        description: `${processedAnswers.length} вопросов готовы к загрузке`,
      });
    } catch (error) {
      toast.error("Ошибка", {
        description: error.message || "Не удалось загрузить файл",
      });
    } finally {
      event.target.value = "";
    }
  };

  const handleMaterialChange = (index, field, value) => {
    const newMaterials = [...materials];
    newMaterials[index][field] = value;
    setMaterials(newMaterials);
  };

  const addMaterial = () => {
    setMaterials([...materials, { link: "", label: "" }]);
  };

  const removeMaterial = (index) => {
    setMaterials(materials.filter((_, i) => i !== index));
  };

  const handleUploadToDatabase = async () => {
    if (!stagedData) return;

    const validMaterials = materials.filter(
      (m) => m.link.trim() && m.label.trim()
    );

    setIsLoading(true);
    try {
      const { data: subjectData, error: subjectError } = await supabase
        .from("subjects")
        .insert([
          {
            name: newSubjectName.trim(),
            answers: stagedData.answers,
            questions_count: stagedData.answers.length,
            file_name: stagedData.fileName,
            uploaded_at: new Date().toISOString(),
            materials: validMaterials,
          },
        ])
        .select()
        .single();

      if (subjectError) throw subjectError;

      if (selectedCategories.length > 0) {
        const categoryRelations = selectedCategories.map((categoryId) => ({
          subject_id: subjectData.id,
          category_id: categoryId,
        }));

        const { error: categoryError } = await supabase
          .from("subject_categories")
          .insert(categoryRelations);

        if (categoryError) throw categoryError;
      }

      toast.success("Успешно", {
        description: `Предмет "${newSubjectName}" добавлен`,
      });

      setNewSubjectName("");
      setStagedData(null);
      setMaterials([{ link: "", label: "" }]);
      setSelectedCategories([]);
      fetchSubjects();
    } catch (error) {
      toast.error("Ошибка", {
        description: error.message || "Не удалось загрузить в базу данных",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Вы уверены, что хотите удалить этот предмет?")) return;

    try {
      const { error } = await supabase.from("subjects").delete().eq("id", id);

      if (error) throw error;

      toast.success("Успешно", {
        description: "Предмет удален",
      });

      fetchSubjects();
    } catch (error) {
      toast.error("Ошибка", {
        description: "Не удалось удалить предмет",
      });
    }
  };

  const handleExport = async (subject) => {
    try {
      const { data, error } = await supabase
        .from("subjects")
        .select("*")
        .eq("id", subject.id)
        .single();

      if (error) throw error;

      const sanitizedName = subject.name
        .replace(/[^a-zа-яё0-9]/gi, "_")
        .toLowerCase();
      const filename = `${sanitizedName}_export.json`;

      const blob = new Blob([JSON.stringify(data.answers, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Экспорт успешен", {
        description: `Файл ${filename} был скачан`,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Ошибка", {
        description: "Не удалось экспортировать данные",
      });
    }
  };

  const handleUpdateLink = async (subjectId, link, linkLabel) => {
    try {
      const { error } = await supabase
        .from("subjects")
        .update({
          link: link.trim() || null,
          link_label: linkLabel.trim() || null,
        })
        .eq("id", subjectId);

      if (error) throw error;

      toast.success("Успешно", {
        description: "Ссылка обновлена",
      });

      fetchSubjects();
    } catch (error) {
      toast.error("Ошибка", {
        description: "Не удалось обновить ссылку",
      });
    }
  };

  const handleUpdateMaterials = async (subjectId, materials) => {
    try {
      const validMaterials = materials.filter(
        (m) => m.link.trim() && m.label.trim()
      );
      const { error } = await supabase
        .from("subjects")
        .update({ materials: validMaterials })
        .eq("id", subjectId);

      if (error) throw error;

      toast.success("Успешно", {
        description: "Материалы обновлены",
      });

      fetchSubjects();
      setEditingSubject(null);
    } catch (error) {
      toast.error("Ошибка", {
        description: "Не удалось обновить материалы",
      });
    }
  };

  const handleAddMaterialToExisting = async () => {
    if (
      !editingSubjectId ||
      !newMaterial.link.trim() ||
      !newMaterial.label.trim()
    )
      return;

    const subject = subjects.find((s) => s.id === editingSubjectId);
    if (!subject) return;

    const newMaterials = [
      ...(subject.materials || []),
      { link: newMaterial.link.trim(), label: newMaterial.label.trim() },
    ];

    try {
      await handleUpdateMaterials(editingSubjectId, newMaterials);
      setIsAddingMaterial(false);
      setNewMaterial({ link: "", label: "" });
      setEditingSubjectId(null);
    } catch (error) {
      console.error(error);
    }
  };

  const handleEditMaterial = async (subjectId, materialIndex, updatedMaterial) => {
    const subject = subjects.find(s => s.id === subjectId);
    if (!subject) return;

    const newMaterials = [...(subject.materials || [])];
    newMaterials[materialIndex] = updatedMaterial;

    try {
      await handleUpdateMaterials(subjectId, newMaterials);
      setEditingMaterial(null);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteMaterial = async (subjectId, materialIndex) => {
    const subject = subjects.find(s => s.id === subjectId);
    if (!subject) return;

    const newMaterials = subject.materials.filter((_, index) => index !== materialIndex);
    await handleUpdateMaterials(subjectId, newMaterials);
  };

  const handleSubjectSelection = (subjectId) => {
    setSelectedSubjects((prev) =>
      prev.includes(subjectId)
        ? prev.filter((id) => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const handleBulkDelete = async () => {
    if (!selectedSubjects.length) return;
    
    if (!confirm(`Вы уверены, что хотите удалить ${selectedSubjects.length} выбранных предметов?`)) return;

    try {
      const { error } = await supabase
        .from("subjects")
        .delete()
        .in("id", selectedSubjects);

      if (error) throw error;

      toast.success("Успешно", {
        description: "Выбранные предметы удалены",
      });

      setSelectedSubjects([]);
      fetchSubjects();
    } catch (error) {
      toast.error("Ошибка", {
        description: "Не удалось удалить предметы",
      });
    }
  };

  const handleBulkExport = async () => {
    if (!selectedSubjects.length) return;

    try {
      // Show a loading toast
      toast.loading("Экспортируем предметы...", { id: "export-toast" });

      const BATCH_SIZE = 5; // Process 5 subjects at a time
      const zip = new JSZip();
      
      // Process subjects in batches
      for (let i = 0; i < selectedSubjects.length; i += BATCH_SIZE) {
        const batchIds = selectedSubjects.slice(i, i + BATCH_SIZE);
        
        const { data, error } = await supabase
          .from("subjects")
          .select("*")
          .in("id", batchIds);

        if (error) throw error;

        // Add each subject's data to the zip file
        data.forEach((subject) => {
          const sanitizedName = subject.name
            .replace(/[^a-zа-яё0-9]/gi, "_")
            .toLowerCase();
          const filename = `${sanitizedName}_export.json`;
          zip.file(filename, JSON.stringify(subject.answers, null, 2));
        });

        // Update progress toast
        const progress = Math.min(((i + BATCH_SIZE) / selectedSubjects.length) * 100, 100);
        toast.loading(`Экспортируем предметы... ${Math.round(progress)}%`, { id: "export-toast" });
      }

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);

      const link = document.createElement("a");
      link.href = url;
      link.download = "subjects_export.zip";
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Экспорт успешен", {
        id: "export-toast",
        description: `${selectedSubjects.length} предметов экспортировано`,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Ошибка", {
        id: "export-toast",
        description: "Не удалось экспортировать данные",
      });
    }
  };

  const handleSelectAll = () => {
    setSelectedSubjects(filteredSubjects.map(subject => subject.id));
  };

  return (
    <main className="max-w-[1400px] mx-auto p-6 space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">Управление предметами</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Загрузка и управление базой вопросов
          </p>
        </div>
        <div className="flex flex-col xs:flex-row gap-2 sm:gap-4">
          <Button variant="outline" asChild className="w-full xs:w-auto">
            <Link to="/admin/categories" className="gap-2">
              <FolderOpen className="h-4 w-4" />
              Категории
            </Link>
          </Button>
          <Button variant="outline" asChild className="w-full xs:w-auto">
            <Link to="/admin/unverified" className="gap-2">
              <AlertCircle className="h-4 w-4" />
              Непроверенные ответы
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 rounded-lg border bg-card p-6">
        <div>
          <h2 className="text-lg font-semibold">Добавить новый предмет</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Заполните информацию о предмете и загрузите файл с вопросами
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Название предмета</label>
              <Input
                placeholder="Введите название"
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Категории</label>
              <div className="flex flex-wrap gap-2 mt-2 min-h-[38px] rounded-md border bg-background p-1">
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategories.includes(category.id) ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setSelectedCategories((prev) =>
                        prev.includes(category.id)
                          ? prev.filter((id) => id !== category.id)
                          : [...prev, category.id]
                      );
                    }}
                  >
                    {category.name}
                  </Button>
                ))}
                {categories.length === 0 && (
                  <p className="text-sm text-muted-foreground p-1">
                    Нет доступных категорий.{" "}
                    <Link to="/admin/categories" className="text-primary hover:underline">
                      Создать категории
                    </Link>
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Материалы</label>
              <div className="space-y-2 mt-2">
                {materials.map((material, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Ссылка"
                      value={material.link}
                      onChange={(e) => handleMaterialChange(index, "link", e.target.value)}
                    />
                    <Input
                      placeholder="Название"
                      value={material.label}
                      onChange={(e) => handleMaterialChange(index, "label", e.target.value)}
                      disabled={!material.link}
                    />
                    {materials.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeMaterial(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addMaterial}
                  className="w-full"
                >
                  Добавить материал
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Файл с вопросами</label>
              <div className="mt-2">
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                  <FileUp className="h-8 w-8 text-muted-foreground mb-4" />
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      Выберите JSON файл с вопросами
                    </p>
                    <input
                      type="file"
                      className="hidden"
                      accept=".json"
                      onChange={handleFileUpload}
                      id="file-input"
                    />
                    <Button
                      onClick={() => document.getElementById("file-input").click()}
                      disabled={isLoading}
                      variant="outline"
                      className="w-full"
                    >
                      Выбрать файл
                    </Button>
                  </div>
                </div>
                {stagedData && (
                  <div className="mt-4 rounded-lg bg-muted p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{stagedData.fileName}</p>
                        <p className="text-sm text-muted-foreground">
                          {stagedData.answers.length} вопросов
                        </p>
                      </div>
                      <Button
                        onClick={handleUploadToDatabase}
                        disabled={isLoading || !newSubjectName.trim()}
                      >
                        Загрузить
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <div className="p-4 border-b space-y-4 sm:space-y-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Поиск предметов..."
                value={subjectSearch}
                onChange={(e) => setSubjectSearch(e.target.value)}
                className="w-full sm:w-auto sm:min-w-[300px]"
              />
              {subjectSearch && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSubjectSearch("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                className="gap-2"
              >
                Выбрать все
              </Button>
              {selectedSubjects.length > 0 && (
                <>
                  <span className="text-sm text-muted-foreground">
                    Выбрано: {selectedSubjects.length}
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBulkExport}
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      <span className="hidden sm:inline">Экспорт</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBulkDelete}
                      className="gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="hidden sm:inline">Удалить</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedSubjects([])}
                    >
                      Сбросить
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-medium w-[250px]">Название предмета</TableHead>
                <TableHead className="font-medium">Категории</TableHead>
                <TableHead className="font-medium">Материалы</TableHead>
                <TableHead className="font-medium text-center w-[100px]">Вопросов</TableHead>
                <TableHead className="font-medium w-[120px]">Дата</TableHead>
                <TableHead className="w-[100px] text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubjects.map((subject) => (
                <TableRow key={subject.id} className={selectedSubjects.includes(subject.id) ? "bg-muted/50" : ""}>
                  <TableCell>
                    <div className="flex items-center gap-4">
                      <Checkbox
                        checked={selectedSubjects.includes(subject.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedSubjects(prev => [...prev, subject.id]);
                          } else {
                            setSelectedSubjects(prev => prev.filter(id => id !== subject.id));
                          }
                        }}
                      />
                      <div>
                        <div className="font-medium">{subject.name}</div>
                        <div className="text-sm text-muted-foreground">{subject.file_name}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {subject.categories.map((category) => (
                        <div
                          key={category.id}
                          className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold"
                        >
                          {category.name}
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      {(subject.materials || []).map((material, index) => (
                        <div key={index} className="group flex items-center gap-2">
                          {editingMaterial?.subjectId === subject.id && 
                           editingMaterial?.materialIndex === index ? (
                            <div className="flex-1 flex items-center gap-2">
                              <Input
                                placeholder="Ссылка"
                                defaultValue={material.link}
                                size="sm"
                                ref={(input) => input?.focus()}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    handleEditMaterial(subject.id, index, {
                                      link: e.target.value,
                                      label: editingMaterial.label,
                                    });
                                  } else if (e.key === "Escape") {
                                    setEditingMaterial(null);
                                  }
                                }}
                                onChange={(e) => {
                                  setEditingMaterial(prev => ({
                                    ...prev,
                                    link: e.target.value,
                                  }));
                                }}
                              />
                              <Input
                                placeholder="Название"
                                defaultValue={material.label}
                                size="sm"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    handleEditMaterial(subject.id, index, {
                                      link: editingMaterial.link,
                                      label: e.target.value,
                                    });
                                  } else if (e.key === "Escape") {
                                    setEditingMaterial(null);
                                  }
                                }}
                                onChange={(e) => {
                                  setEditingMaterial(prev => ({
                                    ...prev,
                                    label: e.target.value,
                                  }));
                                }}
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setEditingMaterial(null)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <a
                                href={material.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 text-sm hover:underline"
                              >
                                {material.label}
                              </a>
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => setEditingMaterial({
                                    subjectId: subject.id,
                                    materialIndex: index,
                                    link: material.link,
                                    label: material.label,
                                  })}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleDeleteMaterial(subject.id, index)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 text-sm font-normal"
                        onClick={() => {
                          setEditingSubjectId(subject.id);
                          setIsAddingMaterial(true);
                        }}
                      >
                        Добавить
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {subject.questions_count}
                  </TableCell>
                  <TableCell>
                    {new Date(subject.uploaded_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleExport(subject)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(subject.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredSubjects.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24">
                    <div className="text-muted-foreground">
                      {subjectSearch
                        ? "Нет предметов, соответствующих поиску"
                        : "Нет предметов"}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="grid grid-cols-1 divide-y md:hidden">
          {filteredSubjects.map((subject) => (
            <div key={subject.id} className="p-4 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium">{subject.name}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {subject.file_name}
                  </div>
                  {subject.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {subject.categories.map((category) => (
                        <div
                          key={category.id}
                          className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold"
                        >
                          {category.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleExport(subject)}>
                      <Download className="h-4 w-4 mr-2" />
                      Экспортировать
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(subject.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Удалить
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Материалы
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingSubjectId(subject.id);
                      setIsAddingMaterial(true);
                    }}
                  >
                    Добавить
                  </Button>
                </div>

                {(subject.materials || []).map((material, index) => (
                  <div
                    key={index}
                    className="space-y-2 rounded-lg border bg-muted/50 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {material.label}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const newMaterials = subject.materials.filter(
                            (_, i) => i !== index
                          );
                          handleUpdateMaterials(subject.id, newMaterials);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <a
                      href={material.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-500 hover:underline break-all"
                    >
                      {material.link}
                    </a>
                  </div>
                ))}
                {!subject.materials?.length && (
                  <div className="text-sm text-muted-foreground text-center py-2">
                    Нет материалов
                  </div>
                )}
              </div>

              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{subject.questions_count} вопросов</span>
                <span>
                  {new Date(subject.uploaded_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={isAddingMaterial} onOpenChange={setIsAddingMaterial}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить материал</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Ссылка</label>
              <Input
                placeholder="https://..."
                value={newMaterial.link}
                onChange={(e) =>
                  setNewMaterial({ ...newMaterial, link: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Название</label>
              <Input
                placeholder="Название материала"
                value={newMaterial.label}
                onChange={(e) =>
                  setNewMaterial({ ...newMaterial, label: e.target.value })
                }
                disabled={!newMaterial.link}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddingMaterial(false);
                setNewMaterial({ link: "", label: "" });
                setEditingSubjectId(null);
              }}
            >
              Отмена
            </Button>
            <Button
              onClick={handleAddMaterialToExisting}
              disabled={!newMaterial.link.trim() || !newMaterial.label.trim()}
            >
              Добавить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default AdminPage;
