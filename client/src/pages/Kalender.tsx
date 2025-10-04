import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Plus, Trash2, CheckCircle2, Circle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Tasks, InsertTasks, Musammi } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export default function Kalender() {
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  const [taskForm, setTaskForm] = useState<InsertTasks>({
    Judul: '',
    Deskripsi: '',
    Tanggal: new Date().toISOString().split('T')[0],
    WaktuPengingat: '',
    AssigneeType: 'Admin',
    AssigneeID: '',
    Status: 'Open',
    Priority: 'Medium'
  });

  // Fetch tasks
  const { data: tasks, isLoading } = useQuery<Tasks[]>({
    queryKey: ['/api/tasks', 'ALL'],
  });

  // Fetch musammi for assignee options
  const { data: allMusammi } = useQuery<Musammi[]>({
    queryKey: ['/api/musammi'],
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (data: InsertTasks) => {
      const res = await apiRequest('POST', '/api/tasks', data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({ title: "Berhasil", description: "Tugas berhasil ditambahkan" });
      setShowDialog(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    }
  });

  // Update task status mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiRequest('PUT', `/api/tasks/${id}`, { Status: status });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({ title: "Berhasil", description: "Status tugas diperbarui" });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    }
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest('DELETE', `/api/tasks/${id}`, undefined);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({ title: "Berhasil", description: "Tugas berhasil dihapus" });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    }
  });

  const resetForm = () => {
    const today = new Date().toISOString().split('T')[0];
    setTaskForm({
      Judul: '',
      Deskripsi: '',
      Tanggal: today,
      WaktuPengingat: '',
      AssigneeType: 'Admin',
      AssigneeID: '',
      Status: 'Open',
      Priority: 'Medium'
    });
  };

  // Calendar logic
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startingDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const days = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  }, [startingDayOfWeek, daysInMonth]);

  // Get tasks for a specific date
  const getTasksForDate = (day: number) => {
    if (!tasks || !day) return [];
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return tasks.filter(task => task.Tanggal === dateStr);
  };

  // Navigation
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Handle date click
  const handleDateClick = (day: number | null) => {
    if (!day) return;
    const date = new Date(year, month, day);
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    // Set all states before opening dialog
    setSelectedDate(date);
    setTaskForm(prev => ({ ...prev, Tanggal: dateStr }));
    
    // Use setTimeout to ensure state updates before opening dialog
    setTimeout(() => {
      setShowDialog(true);
    }, 0);
  };

  const handleToggleStatus = (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Open' ? 'Done' : 'Open';
    updateTaskMutation.mutate({ id: taskId, status: newStatus });
  };

  const handleDelete = (taskId: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus tugas ini?')) {
      deleteTaskMutation.mutate(taskId);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'destructive';
      case 'Medium': return 'default';
      case 'Low': return 'secondary';
      default: return 'default';
    }
  };

  const isToday = (day: number | null) => {
    if (!day) return false;
    const today = new Date();
    return day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  };

  const selectedDateTasks = selectedDate ? getTasksForDate(selectedDate.getDate()) : [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-96" />
          <Skeleton className="h-5 w-full max-w-2xl mt-2" />
        </div>
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-96 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Kalender & Tugas</h1>
        <p className="text-muted-foreground mt-2">
          Kelola jadwal dan tugas untuk admin dan musammi
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold">
              {MONTHS[month]} {year}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={goToPreviousMonth}
                data-testid="button-prev-month"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={goToToday}
                data-testid="button-today"
              >
                Hari Ini
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={goToNextMonth}
                data-testid="button-next-month"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Day headers */}
            {DAYS.map((day) => (
              <div
                key={day}
                className="text-center font-semibold text-sm text-muted-foreground py-2"
              >
                {day}
              </div>
            ))}
            
            {/* Calendar days */}
            {calendarDays.map((day, index) => {
              const dayTasks = day ? getTasksForDate(day) : [];
              const openTasks = dayTasks.filter(t => t.Status === 'Open');
              const hasOpenTasks = openTasks.length > 0;
              
              return (
                <div
                  key={index}
                  onClick={() => handleDateClick(day)}
                  className={`
                    min-h-24 p-2 border rounded-md cursor-pointer transition-colors
                    ${!day ? 'bg-muted/50 cursor-default' : 'hover-elevate active-elevate-2'}
                    ${isToday(day) ? 'border-primary border-2' : ''}
                  `}
                  data-testid={day ? `calendar-day-${day}` : `calendar-empty-${index}`}
                >
                  {day && (
                    <>
                      <div className={`text-sm font-medium mb-1 ${isToday(day) ? 'text-primary font-bold' : ''}`}>
                        {day}
                      </div>
                      {dayTasks.length > 0 && (
                        <div className="space-y-1">
                          {dayTasks.slice(0, 2).map((task) => (
                            <div
                              key={task.TaskID}
                              className={`text-xs p-1 rounded truncate ${
                                task.Status === 'Done' 
                                  ? 'bg-muted text-muted-foreground line-through' 
                                  : 'bg-primary/10 text-primary'
                              }`}
                              title={task.Judul}
                            >
                              {task.Judul}
                            </div>
                          ))}
                          {dayTasks.length > 2 && (
                            <div className="text-xs text-muted-foreground">
                              +{dayTasks.length - 2} lainnya
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Task Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-task">
          <DialogHeader>
            <DialogTitle>
              {selectedDate && `Tugas - ${selectedDate.getDate()} ${MONTHS[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`}
            </DialogTitle>
            <DialogDescription>
              Kelola tugas untuk tanggal ini
            </DialogDescription>
          </DialogHeader>

          {/* Existing tasks for selected date */}
          {selectedDateTasks.length > 0 && (
            <div className="space-y-2 mb-4">
              <h3 className="font-semibold">Tugas yang ada:</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedDateTasks.map((task) => {
                  const assignee = task.AssigneeType === 'Musammi' && task.AssigneeID
                    ? allMusammi?.find(m => m.MusammiID === task.AssigneeID)
                    : null;
                  
                  return (
                    <div
                      key={task.TaskID}
                      className="flex items-start gap-2 p-3 border rounded-md"
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleStatus(task.TaskID, task.Status)}
                        data-testid={`button-toggle-${task.TaskID}`}
                      >
                        {task.Status === 'Done' ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground" />
                        )}
                      </Button>
                      <div className="flex-1">
                        <p className={`font-medium ${task.Status === 'Done' ? 'line-through text-muted-foreground' : ''}`}>
                          {task.Judul}
                        </p>
                        {task.Deskripsi && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {task.Deskripsi}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant={getPriorityColor(task.Priority)} className="text-xs">
                            {task.Priority}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {task.AssigneeType === 'Admin' ? 'Admin' : assignee?.NamaMusammi || 'N/A'}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(task.TaskID)}
                        data-testid={`button-delete-${task.TaskID}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add new task form */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold">Tambah Tugas Baru:</h3>
            <div className="space-y-2">
              <Label htmlFor="judul-task">Judul</Label>
              <Input
                id="judul-task"
                value={taskForm.Judul}
                onChange={(e) => setTaskForm({ ...taskForm, Judul: e.target.value })}
                placeholder="Contoh: Persiapan ujian hafalan"
                data-testid="input-judul-task"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deskripsi-task">Deskripsi</Label>
              <Textarea
                id="deskripsi-task"
                value={taskForm.Deskripsi}
                onChange={(e) => setTaskForm({ ...taskForm, Deskripsi: e.target.value })}
                placeholder="Detail tugas..."
                rows={3}
                data-testid="input-deskripsi-task"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="waktu-task">Waktu Pengingat</Label>
                <Input
                  id="waktu-task"
                  type="time"
                  value={taskForm.WaktuPengingat}
                  onChange={(e) => setTaskForm({ ...taskForm, WaktuPengingat: e.target.value })}
                  data-testid="input-waktu-task"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prioritas-task">Prioritas</Label>
                <Select
                  value={taskForm.Priority}
                  onValueChange={(value: any) => setTaskForm({ ...taskForm, Priority: value })}
                >
                  <SelectTrigger id="prioritas-task" data-testid="select-prioritas-task">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Rendah</SelectItem>
                    <SelectItem value="Medium">Sedang</SelectItem>
                    <SelectItem value="High">Tinggi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="assignee-type">Ditugaskan Kepada</Label>
              <Select
                value={taskForm.AssigneeType}
                onValueChange={(value: any) => {
                  setTaskForm({ ...taskForm, AssigneeType: value, AssigneeID: '' });
                }}
              >
                <SelectTrigger id="assignee-type" data-testid="select-assignee-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Musammi">Musammi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {taskForm.AssigneeType === 'Musammi' && (
              <div className="space-y-2">
                <Label htmlFor="assignee-musammi">Pilih Musammi</Label>
                <Select
                  value={taskForm.AssigneeID}
                  onValueChange={(value) => setTaskForm({ ...taskForm, AssigneeID: value })}
                >
                  <SelectTrigger id="assignee-musammi" data-testid="select-assignee-musammi">
                    <SelectValue placeholder="Pilih Musammi" />
                  </SelectTrigger>
                  <SelectContent>
                    {allMusammi?.map((m) => (
                      <SelectItem key={m.MusammiID} value={m.MusammiID}>
                        {m.NamaMusammi} ({m.KelasMusammi})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Tutup</Button>
            <Button 
              onClick={() => createTaskMutation.mutate(taskForm)}
              disabled={createTaskMutation.isPending || !taskForm.Judul}
              data-testid="button-save-task"
            >
              <Plus className="h-4 w-4 mr-2" />
              {createTaskMutation.isPending ? 'Menyimpan...' : 'Tambah Tugas'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
