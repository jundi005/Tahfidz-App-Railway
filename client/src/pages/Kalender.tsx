import { useState } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar, Plus, CheckCircle2, Circle, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Tasks, InsertTasks, Musammi } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

export default function Kalender() {
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

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
    queryKey: ['/api/tasks', filterStatus],
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
    setTaskForm({
      Judul: '',
      Deskripsi: '',
      Tanggal: new Date().toISOString().split('T')[0],
      WaktuPengingat: '',
      AssigneeType: 'Admin',
      AssigneeID: '',
      Status: 'Open',
      Priority: 'Medium'
    });
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

  const filteredTasks = tasks ? (filterStatus && filterStatus !== 'ALL' ? tasks.filter(t => t.Status === filterStatus) : tasks) : [];
  const openTasks = tasks?.filter(t => t.Status === 'Open') || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-96" />
          <Skeleton className="h-5 w-full max-w-2xl mt-2" />
        </div>
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Section */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Kalender
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                type="date"
                defaultValue={new Date().toISOString().split('T')[0]}
                data-testid="input-calendar-date"
              />
              <div className="space-y-2">
                <p className="text-sm font-medium">Tugas Terbuka</p>
                <p className="text-3xl font-bold font-mono">{openTasks.length}</p>
                <p className="text-xs text-muted-foreground">tugas menunggu penyelesaian</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tasks Section */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Daftar Tugas</CardTitle>
              <div className="flex items-center gap-2">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-32" data-testid="select-filter-status">
                    <SelectValue placeholder="Semua" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Semua</SelectItem>
                    <SelectItem value="Open">Terbuka</SelectItem>
                    <SelectItem value="Done">Selesai</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={() => setShowDialog(true)} data-testid="button-add-task">
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Tugas
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Status</TableHead>
                    <TableHead>Judul</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Prioritas</TableHead>
                    <TableHead>Assignee</TableHead>
                    <TableHead className="w-12">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTasks.length > 0 ? (
                    filteredTasks.map((task) => {
                      const assignee = task.AssigneeType === 'Musammi' && task.AssigneeID
                        ? allMusammi?.find(m => m.MusammiID === task.AssigneeID)
                        : null;
                      
                      return (
                        <TableRow key={task.TaskID} data-testid={`row-task-${task.TaskID}`}>
                          <TableCell>
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
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className={`font-medium ${task.Status === 'Done' ? 'line-through text-muted-foreground' : ''}`}>
                                {task.Judul}
                              </p>
                              {task.Deskripsi && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {task.Deskripsi}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">{task.Tanggal}</TableCell>
                          <TableCell>
                            <Badge variant={getPriorityColor(task.Priority)}>
                              {task.Priority}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {task.AssigneeType === 'Admin' ? (
                              <span className="text-muted-foreground">Admin</span>
                            ) : (
                              assignee?.NamaMusammi || 'N/A'
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(task.TaskID)}
                              data-testid={`button-delete-${task.TaskID}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        Tidak ada tugas
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Task Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent data-testid="dialog-task">
          <DialogHeader>
            <DialogTitle>Tambah Tugas Baru</DialogTitle>
            <DialogDescription>Buat tugas baru untuk admin atau musammi</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
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
                <Label htmlFor="tanggal-task">Tanggal</Label>
                <Input
                  id="tanggal-task"
                  type="date"
                  value={taskForm.Tanggal}
                  onChange={(e) => setTaskForm({ ...taskForm, Tanggal: e.target.value })}
                  data-testid="input-tanggal-task"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="waktu-task">Waktu Pengingat (Opsional)</Label>
                <Input
                  id="waktu-task"
                  type="time"
                  value={taskForm.WaktuPengingat}
                  onChange={(e) => setTaskForm({ ...taskForm, WaktuPengingat: e.target.value })}
                  data-testid="input-waktu-task"
                />
              </div>
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
            <Button variant="outline" onClick={() => setShowDialog(false)}>Batal</Button>
            <Button 
              onClick={() => createTaskMutation.mutate(taskForm)}
              disabled={createTaskMutation.isPending || !taskForm.Judul}
              data-testid="button-save-task"
            >
              {createTaskMutation.isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
