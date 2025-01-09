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

const AdminPage = () => {
  const [subjects, setSubjects] = useState([]);
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
  }, []);

  const fetchSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from("subjects")
        .select("id, name, file_name, questions_count, uploaded_at, materials")
        .order("name", { ascending: true });

      if (error) throw error;
      setSubjects(data);
    } catch (error) {
      toast.error("Ошибка", {
        description: "Не удалось загрузить список предметов",
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

      // Stage the data instead of uploading
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

    // Filter out empty materials
    const validMaterials = materials.filter(
      (m) => m.link.trim() && m.label.trim()
    );

    setIsLoading(true);
    try {
      const { error } = await supabase.from("subjects").insert([
        {
          name: newSubjectName.trim(),
          answers: stagedData.answers,
          questions_count: stagedData.answers.length,
          file_name: stagedData.fileName,
          uploaded_at: new Date().toISOString(),
          materials: validMaterials,
        },
      ]);

      if (error) throw error;

      toast.success("Успешно", {
        description: `Предмет "${newSubjectName}" добавлен`,
      });

      // Reset all form state
      setNewSubjectName("");
      setStagedData(null);
      setMaterials([{ link: "", label: "" }]);
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

      // Create a sanitized filename from subject name
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

  return (
    <main className="max-w-[1400px] mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Управление предметами</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Загрузка и управление базой вопросов
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/admin/unverified" className="gap-2">
            <AlertCircle className="h-4 w-4" />
            Непроверенные ответы
          </Link>
        </Button>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Добавить новый предмет</h2>
          <div className="flex flex-col gap-4">
            <Input
              placeholder="Название предмета"
              value={newSubjectName}
              onChange={(e) => setNewSubjectName(e.target.value)}
              className="w-full"
            />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Материалы</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addMaterial}
                >
                  Добавить материал
                </Button>
              </div>

              {materials.map((material, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <Input
                    placeholder="Ссылка"
                    value={material.link}
                    onChange={(e) =>
                      handleMaterialChange(index, "link", e.target.value)
                    }
                    className="w-full"
                  />
                  <div className="flex gap-2">
                    <Input
                      placeholder="Название"
                      value={material.label}
                      onChange={(e) =>
                        handleMaterialChange(index, "label", e.target.value)
                      }
                      className="w-full"
                      disabled={!material.link}
                    />
                    {materials.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeMaterial(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-4 md:flex-row flex-col">
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
                className="w-full md:w-auto"
              >
                <FileUp className="mr-2 h-4 w-4" />
                Выбрать JSON
              </Button>
              {stagedData && (
                <Button
                  onClick={handleUploadToDatabase}
                  disabled={isLoading || !newSubjectName.trim()}
                  className="w-full md:w-auto"
                >
                  Загрузить в базу данных
                  {stagedData && ` (${stagedData.answers.length} вопросов)`}
                </Button>
              )}
            </div>
            {stagedData && (
              <div className="text-sm text-muted-foreground">
                Файл готов к загрузке: {stagedData.fileName}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Поиск предметов..."
              value={subjectSearch}
              onChange={(e) => setSubjectSearch(e.target.value)}
              className="max-w-sm"
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
                </div>
                <div className="flex gap-2">
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

        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-medium">Название предмета</TableHead>
                <TableHead className="font-medium">Файл</TableHead>
                <TableHead className="font-medium">Материалы</TableHead>
                <TableHead className="font-medium text-center">
                  Вопросов
                </TableHead>
                <TableHead className="font-medium">Дата</TableHead>
                <TableHead className="w-[100px] text-center">
                  Действия
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubjects.map((subject) => (
                <TableRow key={subject.id}>
                  <TableCell className="font-medium py-4">
                    {subject.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground py-4">
                    {subject.file_name}
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="space-y-2">
                      {(subject.materials || []).map((material, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input
                            placeholder="Ссылка"
                            value={material.link}
                            onChange={(e) => {
                              const newMaterials = [...subject.materials];
                              newMaterials[index].link = e.target.value;
                              const newSubjects = subjects.map((s) =>
                                s.id === subject.id
                                  ? { ...s, materials: newMaterials }
                                  : s
                              );
                              setSubjects(newSubjects);
                            }}
                            onBlur={() =>
                              handleUpdateMaterials(
                                subject.id,
                                subject.materials
                              )
                            }
                            className="w-full"
                          />
                          <Input
                            placeholder="Название"
                            value={material.label}
                            onChange={(e) => {
                              const newMaterials = [...subject.materials];
                              newMaterials[index].label = e.target.value;
                              const newSubjects = subjects.map((s) =>
                                s.id === subject.id
                                  ? { ...s, materials: newMaterials }
                                  : s
                              );
                              setSubjects(newSubjects);
                            }}
                            onBlur={() =>
                              handleUpdateMaterials(
                                subject.id,
                                subject.materials
                              )
                            }
                            className="w-full"
                            disabled={!material.link}
                          />
                          <Button
                            type="button"
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
                      ))}
                      {editingSubject === subject.id && (
                        <div className="flex items-center gap-2">
                          <Input
                            placeholder="Новая ссылка"
                            className="w-full"
                            autoFocus
                            onBlur={(e) => {
                              if (e.target.value.trim()) {
                                const newMaterials = [
                                  ...(subject.materials || []),
                                  { link: e.target.value.trim(), label: "" },
                                ];
                                handleUpdateMaterials(subject.id, newMaterials);
                              } else {
                                setEditingSubject(null);
                              }
                            }}
                          />
                        </div>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingSubjectId(subject.id);
                          setIsAddingMaterial(true);
                        }}
                      >
                        Добавить материал
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-center py-4">
                    {subject.questions_count}
                  </TableCell>
                  <TableCell className="py-4">
                    {new Date(subject.uploaded_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-center">
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
