import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Check, X, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "../lib/supabase";
import { cn } from "../lib/utils";
import { Link } from "react-router-dom";

const UnverifiedAnswersPage = () => {
  const [subjects, setSubjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    fetchSubjects();
  }, [page]);

  const fetchSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from("subjects")
        .select("id, name, answers")
        .order("name", { ascending: true })
        .range(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE - 1);

      if (error) throw error;

      // Process only the new data
      const processedData = data.map(subject => ({
        ...subject,
        answers: subject.answers.filter(answer => answer.unverified),
        unverifiedCount: subject.answers.filter(answer => answer.unverified).length
      })).filter(subject => subject.unverifiedCount > 0);

      // Append new data or replace if it's the first page
      setSubjects(prev => page === 0 ? processedData : [...prev, ...processedData]);
      setHasMore(data.length === ITEMS_PER_PAGE);
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Ошибка", {
        description: "Не удалось загрузить список предметов",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (subjectId, answerIndex) => {
    setActionInProgress(`verify-${subjectId}-${answerIndex}`);
    try {
      const subject = subjects.find(s => s.id === subjectId);
      if (!subject) return;

      const unverifiedAnswer = subject.answers[answerIndex];

      const { data: subjectData, error: fetchError } = await supabase
        .from("subjects")
        .select("answers")
        .match({ id: subjectId })
        .single();

      if (fetchError) throw fetchError;

      const updatedAnswers = subjectData.answers.map(answer => {
        if (answer.question === unverifiedAnswer.question && 
            answer.answer === unverifiedAnswer.answer) {
          return { ...answer, unverified: false };
        }
        return answer;
      });

      const { error: updateError } = await supabase
        .from("subjects")
        .update({ answers: updatedAnswers })
        .match({ id: subjectId });

      if (updateError) throw updateError;

      setSubjects(prev => {
        const newSubjects = prev.map(s => {
          if (s.id === subjectId) {
            const newAnswers = s.answers.filter((_, idx) => idx !== answerIndex);
            return {
              ...s,
              answers: newAnswers,
              unverifiedCount: newAnswers.length
            };
          }
          return s;
        }).filter(s => s.unverifiedCount > 0);
        return newSubjects;
      });

      toast.success("Успешно", {
        description: "Ответ подтвержден",
      });
    } catch (error) {
      console.error("Verification error:", error);
      toast.error("Ошибка", {
        description: "Не удалось подтвердить ответ",
      });
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDelete = async (subjectId, answerIndex) => {
    if (!confirm("Вы уверены, что хотите удалить этот ответ?")) return;

    try {
      const { data: subjectData, error: fetchError } = await supabase
        .from("subjects")
        .select("*")
        .eq("id", subjectId)
        .single();

      if (fetchError) throw fetchError;

      const answerToDelete = subjects
        .find(s => s.id === subjectId)
        .answers[answerIndex];

      const updatedAnswers = subjectData.answers.filter(
        answer => !(answer.question === answerToDelete.question && 
                   answer.answer === answerToDelete.answer)
      );

      const { error: updateError } = await supabase
        .from("subjects")
        .update({ 
          answers: updatedAnswers,
          questions_count: updatedAnswers.length
        })
        .eq("id", subjectId);

      if (updateError) throw updateError;

      toast.success("Успешно", {
        description: "Ответ удален",
      });

      fetchSubjects();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Ошибка", {
        description: "Не удалось удалить ответ",
      });
    }
  };

  if (isLoading) {
    return (
      <main className="max-w-[1000px] mx-auto p-6">
        <div className="text-center">Загрузка...</div>
      </main>
    );
  }

  return (
    <main className="max-w-[1000px] mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Непроверенные ответы</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Проверка и управление пользовательскими ответами
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/admin" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Назад
          </Link>
        </Button>
      </div>

      {subjects.length === 0 ? (
        <div className="rounded-lg border bg-card p-6 text-center text-muted-foreground">
          Нет непроверенных ответов
        </div>
      ) : (
        <div className="space-y-6">
          {subjects.map((subject) => (
            <div key={subject.id} className="rounded-lg border bg-card">
              <div className="p-4 border-b bg-muted/50">
                <h2 className="font-semibold">{subject.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {subject.unverifiedCount} непроверенных ответов
                </p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">Вопрос</TableHead>
                    <TableHead>Ответ</TableHead>
                    <TableHead className="w-[100px] text-center">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subject.answers.map((answer, index) => (
                    <TableRow key={index}>
                      <TableCell className="align-top py-4">{answer.question}</TableCell>
                      <TableCell className="align-top py-4">{answer.answer}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleVerify(subject.id, index)}
                            className="hover:bg-green-500/10 hover:text-green-500"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDelete(subject.id, index)}
                            className="hover:bg-destructive/10 hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ))}
        </div>
      )}

      {hasMore && !isLoading && subjects.length >= 30 && (
        <Button
          variant="default"
          onClick={() => setPage(p => p + 1)}
          className="w-full bg-primary text-primary-foreground"
          disabled={!hasMore}
        >
          {isLoading ? "Загрузка..." : "Загрузить еще"}
        </Button>
      )}
    </main>
  );
};

export default UnverifiedAnswersPage; 