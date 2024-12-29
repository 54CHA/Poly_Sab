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
import { FileUp, Trash2, Download, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "../lib/supabase";
import { Link } from "react-router-dom";

const AdminPage = () => {
  const [subjects, setSubjects] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from("subjects")
        .select("id, name, file_name, questions_count, uploaded_at")
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

    setIsLoading(true);
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

      // Initialize all answers with unverified: false
      const processedAnswers = parsedAnswers.map(answer => ({
        ...answer,
        unverified: false
      }));

      const { error } = await supabase.from("subjects").insert([
        {
          name: newSubjectName.trim(),
          answers: processedAnswers,
          questions_count: processedAnswers.length,
          file_name: file.name,
          uploaded_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;

      toast.success("Успешно", {
        description: `Предмет "${newSubjectName}" добавлен (${processedAnswers.length} вопросов)`,
      });

      setNewSubjectName("");
      fetchSubjects();
    } catch (error) {
      toast.error("Ошибка", {
        description: error.message || "Не удалось загрузить файл",
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
      const sanitizedName = subject.name.replace(/[^a-zа-яё0-9]/gi, '_').toLowerCase();
      const filename = `${sanitizedName}_export.json`;

      const blob = new Blob([JSON.stringify(data.answers, null, 2)], { type: "application/json" });
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

  return (
    <main className="max-w-[1000px] mx-auto p-6 space-y-8">
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
          <div className="flex flex-col md:flex-row gap-4">
            <Input
              placeholder="Название предмета"
              value={newSubjectName}
              onChange={(e) => setNewSubjectName(e.target.value)}
              className="w-full"
            />
            <input
              type="file"
              className="hidden"
              accept=".json"
              onChange={handleFileUpload}
              id="file-input"
            />
            <Button
              onClick={() => document.getElementById("file-input").click()}
              disabled={isLoading || !newSubjectName.trim()}
            >
              <FileUp className="mr-2 h-4 w-4" />
              Загрузить JSON
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <div className="grid grid-cols-1 divide-y md:hidden">
          {subjects.map((subject) => (
            <div key={subject.id} className="p-4 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium">{subject.name}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {subject.file_name}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleExport(subject)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDelete(subject.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
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
                <TableHead className="font-medium text-center">
                  Вопросов
                </TableHead>
                <TableHead className="font-medium text-center">Дата</TableHead>
                <TableHead className="w-[100px] text-center">
                  Действия
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subjects.map((subject) => (
                <TableRow key={subject.id}>
                  <TableCell className="font-medium py-4">
                    {subject.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground py-4">
                    {subject.file_name}
                  </TableCell>
                  <TableCell className="text-center py-4">
                    {subject.questions_count}
                  </TableCell>
                  <TableCell className="py-4">
                    {new Date(subject.uploaded_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleExport(subject)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDelete(subject.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </main>
  );
};

export default AdminPage;
