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
import { FileUp, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "../lib/supabase";

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
        .select("*")
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

      const { error } = await supabase.from("subjects").insert([
        {
          name: newSubjectName.trim(),
          answers: parsedAnswers,
          questions_count: parsedAnswers.length,
          file_name: file.name,
          uploaded_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;

      toast.success("Успешно", {
        description: `Предмет "${newSubjectName}" добавлен (${parsedAnswers.length} вопросов)`,
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

  return (
    <main className="max-w-[1000px] mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Управление предметами</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Загрузка и управление базой вопросов
          </p>
        </div>
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
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => handleDelete(subject.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
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
                <TableHead className="font-medium">Дата загрузки</TableHead>
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
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDelete(subject.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
