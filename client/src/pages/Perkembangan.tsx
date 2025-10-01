import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Plus, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type {
  HafalanBulanan,
  MurojaahBulanan,
  PenambahanHafalan,
  InsertHafalanBulanan,
  InsertMurojaahBulanan,
  InsertPenambahanHafalan,
  Santri,
  Halaqah,
  Musammi,
  LookupsResponse,
  HalaqahMembers
} from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

export default function Perkembangan() {
  const { toast } = useToast();
  const currentMonth = new Date().toISOString().slice(0, 7);
  
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [activeDialog, setActiveDialog] = useState<'none' | 'hafalan' | 'murojaah' | 'penambahan'>('none');
  const [selectedMarhalah, setSelectedMarhalah] = useState<string>('ALL');

  // Forms
  const [hafalanForm, setHafalanForm] = useState<InsertHafalanBulanan>({
    Bulan: currentMonth,
    SantriID: '',
    HalaqahID: '',
    MarhalahID: 'MUT',
    Kelas: '',
    MusammiID: '',
    JumlahHafalan: 0
  });

  const [murojaahForm, setMurojaahForm] = useState<InsertMurojaahBulanan>({
    Bulan: currentMonth,
    SantriID: '',
    HalaqahID: '',
    MarhalahID: 'MUT',
    Kelas: '',
    MusammiID: '',
    JumlahMurojaah: 0
  });

  const [penambahanForm, setPenambahanForm] = useState<InsertPenambahanHafalan>({
    Bulan: currentMonth,
    SantriID: '',
    HalaqahID: '',
    MarhalahID: 'MUT',
    Kelas: '',
    MusammiID: '',
    JumlahPenambahan: 0,
    Catatan: ''
  });

  // Fetch lookups
  const { data: lookups } = useQuery<LookupsResponse>({
    queryKey: ['/api/lookups'],
  });

  // Fetch data
  const { data: hafalanData, isLoading: loadingHafalan } = useQuery<HafalanBulanan[]>({
    queryKey: ['/api/hafalan', { bulan: selectedMonth, marhalah: selectedMarhalah === 'ALL' ? '' : selectedMarhalah }],
  });

  const { data: murojaahData, isLoading: loadingMurojaah } = useQuery<MurojaahBulanan[]>({
    queryKey: ['/api/murojaah', { bulan: selectedMonth, marhalah: selectedMarhalah === 'ALL' ? '' : selectedMarhalah }],
  });

  const { data: allSantri } = useQuery<Santri[]>({
    queryKey: ['/api/santri'],
  });

  const { data: allHalaqah } = useQuery<Halaqah[]>({
    queryKey: ['/api/halaqah'],
  });

  const { data: allMusammi } = useQuery<Musammi[]>({
    queryKey: ['/api/musammi'],
  });

  // Mutations
  const createHafalanMutation = useMutation({
    mutationFn: async (data: InsertHafalanBulanan) => {
      const res = await apiRequest('POST', '/api/hafalan', data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/hafalan'] });
      toast({ title: "Berhasil", description: "Data hafalan berhasil ditambahkan" });
      setActiveDialog('none');
      resetHafalanForm();
    },
    onError: (error: Error) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    }
  });

  const createMurojaahMutation = useMutation({
    mutationFn: async (data: InsertMurojaahBulanan) => {
      const res = await apiRequest('POST', '/api/murojaah', data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/murojaah'] });
      toast({ title: "Berhasil", description: "Data murojaah berhasil ditambahkan" });
      setActiveDialog('none');
      resetMurojaahForm();
    },
    onError: (error: Error) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    }
  });

  const createPenambahanMutation = useMutation({
    mutationFn: async (data: InsertPenambahanHafalan) => {
      const res = await apiRequest('POST', '/api/penambahan', data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/hafalan'] });
      toast({ 
        title: "Berhasil", 
        description: "Penambahan hafalan berhasil disimpan dan hafalan bulanan telah diperbarui",
        duration: 5000
      });
      setActiveDialog('none');
      resetPenambahanForm();
    },
    onError: (error: Error) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    }
  });

  const resetHafalanForm = () => {
    setHafalanForm({
      Bulan: currentMonth,
      SantriID: '',
      HalaqahID: '',
      MarhalahID: 'MUT',
      Kelas: '',
      MusammiID: '',
      JumlahHafalan: 0
    });
  };

  const resetMurojaahForm = () => {
    setMurojaahForm({
      Bulan: currentMonth,
      SantriID: '',
      HalaqahID: '',
      MarhalahID: 'MUT',
      Kelas: '',
      MusammiID: '',
      JumlahMurojaah: 0
    });
  };

  const resetPenambahanForm = () => {
    setPenambahanForm({
      Bulan: currentMonth,
      SantriID: '',
      HalaqahID: '',
      MarhalahID: 'MUT',
      Kelas: '',
      MusammiID: '',
      JumlahPenambahan: 0,
      Catatan: ''
    });
  };

  const handleSantriChange = (santriId: string, formType: 'hafalan' | 'murojaah' | 'penambahan') => {
    const santri = allSantri?.find(s => s.SantriID === santriId);
    if (!santri) return;

    const updates = {
      SantriID: santriId,
      MarhalahID: santri.MarhalahID,
      Kelas: santri.Kelas,
      HalaqahID: '',
      MusammiID: ''
    };

    if (formType === 'hafalan') {
      setHafalanForm({ ...hafalanForm, ...updates });
    } else if (formType === 'murojaah') {
      setMurojaahForm({ ...murojaahForm, ...updates });
    } else {
      setPenambahanForm({ ...penambahanForm, ...updates });
    }
  };

  const handleHalaqahChange = (halaqahId: string, formType: 'hafalan' | 'murojaah' | 'penambahan') => {
    const halaqah = allHalaqah?.find(h => h.HalaqahID === halaqahId);
    if (!halaqah) return;

    const updates = {
      HalaqahID: halaqahId,
      MusammiID: halaqah.MusammiID
    };

    if (formType === 'hafalan') {
      setHafalanForm({ ...hafalanForm, ...updates });
    } else if (formType === 'murojaah') {
      setMurojaahForm({ ...murojaahForm, ...updates });
    } else {
      setPenambahanForm({ ...penambahanForm, ...updates });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Perkembangan Santri</h1>
        <p className="text-muted-foreground mt-2">
          Pantau hafalan dan murojaah santri per bulan
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="month-filter">Bulan</Label>
          <Input
            id="month-filter"
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            data-testid="input-month-filter"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="marhalah-filter">Filter Marhalah</Label>
          <Select value={selectedMarhalah} onValueChange={setSelectedMarhalah}>
            <SelectTrigger id="marhalah-filter" data-testid="select-marhalah-filter">
              <SelectValue placeholder="Semua Marhalah" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua</SelectItem>
              {lookups?.marhalah.filter(m => m.MarhalahID !== 'JAM').map((m) => (
                <SelectItem key={m.MarhalahID} value={m.MarhalahID}>
                  {m.NamaMarhalah}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="hafalan" className="space-y-4">
        <TabsList>
          <TabsTrigger value="hafalan" data-testid="tab-hafalan">
            Hafalan Bulanan
          </TabsTrigger>
          <TabsTrigger value="murojaah" data-testid="tab-murojaah">
            Murojaah Bulanan
          </TabsTrigger>
          <TabsTrigger value="penambahan" data-testid="tab-penambahan">
            Penambahan Hafalan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hafalan" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setActiveDialog('hafalan')} data-testid="button-add-hafalan">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Data Hafalan
            </Button>
          </div>
          
          {loadingHafalan ? (
            <Card>
              <CardContent className="pt-6">
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Data Hafalan Bulanan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Bulan</TableHead>
                        <TableHead>Nama Santri</TableHead>
                        <TableHead>Kelas</TableHead>
                        <TableHead>Marhalah</TableHead>
                        <TableHead>Hafalan (Juz)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {hafalanData && hafalanData.length > 0 ? (
                        hafalanData.map((h) => {
                          const santri = allSantri?.find(s => s.SantriID === h.SantriID);
                          return (
                            <TableRow key={h.RekapID} data-testid={`row-hafalan-${h.RekapID}`}>
                              <TableCell>{h.Bulan}</TableCell>
                              <TableCell className="font-medium">{santri?.NamaSantri || 'N/A'}</TableCell>
                              <TableCell>{h.Kelas}</TableCell>
                              <TableCell>{lookups?.marhalah.find(m => m.MarhalahID === h.MarhalahID)?.NamaMarhalah}</TableCell>
                              <TableCell className="font-mono">{h.JumlahHafalan.toFixed(1)}</TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground">
                            Tidak ada data hafalan untuk bulan {selectedMonth}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="murojaah" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setActiveDialog('murojaah')} data-testid="button-add-murojaah">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Data Murojaah
            </Button>
          </div>
          
          {loadingMurojaah ? (
            <Card>
              <CardContent className="pt-6">
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Data Murojaah Bulanan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Bulan</TableHead>
                        <TableHead>Nama Santri</TableHead>
                        <TableHead>Kelas</TableHead>
                        <TableHead>Marhalah</TableHead>
                        <TableHead>Murojaah (Juz)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {murojaahData && murojaahData.length > 0 ? (
                        murojaahData.map((m) => {
                          const santri = allSantri?.find(s => s.SantriID === m.SantriID);
                          return (
                            <TableRow key={m.MurojaahID} data-testid={`row-murojaah-${m.MurojaahID}`}>
                              <TableCell>{m.Bulan}</TableCell>
                              <TableCell className="font-medium">{santri?.NamaSantri || 'N/A'}</TableCell>
                              <TableCell>{m.Kelas}</TableCell>
                              <TableCell>{lookups?.marhalah.find(mar => mar.MarhalahID === m.MarhalahID)?.NamaMarhalah}</TableCell>
                              <TableCell className="font-mono">{m.JumlahMurojaah.toFixed(1)}</TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground">
                            Tidak ada data murojaah untuk bulan {selectedMonth}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="penambahan" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setActiveDialog('penambahan')} data-testid="button-add-penambahan">
              <TrendingUp className="h-4 w-4 mr-2" />
              Tambah Penambahan Hafalan
            </Button>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Penambahan Hafalan</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Input penambahan hafalan dalam format halaman. Sistem akan otomatis mengonversi ke juz
                (20 halaman = 1 juz) dan menambahkannya ke data hafalan bulanan.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Hafalan Dialog */}
      <Dialog open={activeDialog === 'hafalan'} onOpenChange={(open) => !open && setActiveDialog('none')}>
        <DialogContent data-testid="dialog-hafalan">
          <DialogHeader>
            <DialogTitle>Tambah Data Hafalan Bulanan</DialogTitle>
            <DialogDescription>Input data hafalan santri untuk bulan tertentu (dalam Juz)</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bulan-hafalan">Bulan</Label>
              <Input
                id="bulan-hafalan"
                type="month"
                value={hafalanForm.Bulan}
                onChange={(e) => setHafalanForm({ ...hafalanForm, Bulan: e.target.value })}
                data-testid="input-bulan-hafalan"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="santri-hafalan">Santri</Label>
              <Select value={hafalanForm.SantriID} onValueChange={(v) => handleSantriChange(v, 'hafalan')}>
                <SelectTrigger id="santri-hafalan" data-testid="select-santri-hafalan">
                  <SelectValue placeholder="Pilih Santri" />
                </SelectTrigger>
                <SelectContent>
                  {allSantri?.filter(s => s.Aktif).map((s) => (
                    <SelectItem key={s.SantriID} value={s.SantriID}>
                      {s.NamaSantri} ({s.Kelas})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="halaqah-hafalan">Halaqah</Label>
              <Select value={hafalanForm.HalaqahID} onValueChange={(v) => handleHalaqahChange(v, 'hafalan')}>
                <SelectTrigger id="halaqah-hafalan" data-testid="select-halaqah-hafalan">
                  <SelectValue placeholder="Pilih Halaqah" />
                </SelectTrigger>
                <SelectContent>
                  {allHalaqah?.filter(h => h.MarhalahID === hafalanForm.MarhalahID).map((h) => {
                    const musammi = allMusammi?.find(m => m.MusammiID === h.MusammiID);
                    return (
                      <SelectItem key={h.HalaqahID} value={h.HalaqahID}>
                        Halaqah {h.NomorUrutHalaqah} - {musammi?.NamaMusammi || 'N/A'}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="jumlah-hafalan">Jumlah Hafalan (Juz)</Label>
              <Input
                id="jumlah-hafalan"
                type="number"
                step="0.1"
                value={hafalanForm.JumlahHafalan}
                onChange={(e) => setHafalanForm({ ...hafalanForm, JumlahHafalan: parseFloat(e.target.value) || 0 })}
                data-testid="input-jumlah-hafalan"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActiveDialog('none')}>Batal</Button>
            <Button 
              onClick={() => createHafalanMutation.mutate(hafalanForm)}
              disabled={createHafalanMutation.isPending}
              data-testid="button-save-hafalan"
            >
              {createHafalanMutation.isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Murojaah Dialog */}
      <Dialog open={activeDialog === 'murojaah'} onOpenChange={(open) => !open && setActiveDialog('none')}>
        <DialogContent data-testid="dialog-murojaah">
          <DialogHeader>
            <DialogTitle>Tambah Data Murojaah Bulanan</DialogTitle>
            <DialogDescription>Input data murojaah santri untuk bulan tertentu (dalam Juz)</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bulan-murojaah">Bulan</Label>
              <Input
                id="bulan-murojaah"
                type="month"
                value={murojaahForm.Bulan}
                onChange={(e) => setMurojaahForm({ ...murojaahForm, Bulan: e.target.value })}
                data-testid="input-bulan-murojaah"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="santri-murojaah">Santri</Label>
              <Select value={murojaahForm.SantriID} onValueChange={(v) => handleSantriChange(v, 'murojaah')}>
                <SelectTrigger id="santri-murojaah" data-testid="select-santri-murojaah">
                  <SelectValue placeholder="Pilih Santri" />
                </SelectTrigger>
                <SelectContent>
                  {allSantri?.filter(s => s.Aktif).map((s) => (
                    <SelectItem key={s.SantriID} value={s.SantriID}>
                      {s.NamaSantri} ({s.Kelas})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="halaqah-murojaah">Halaqah</Label>
              <Select value={murojaahForm.HalaqahID} onValueChange={(v) => handleHalaqahChange(v, 'murojaah')}>
                <SelectTrigger id="halaqah-murojaah" data-testid="select-halaqah-murojaah">
                  <SelectValue placeholder="Pilih Halaqah" />
                </SelectTrigger>
                <SelectContent>
                  {allHalaqah?.filter(h => h.MarhalahID === murojaahForm.MarhalahID).map((h) => {
                    const musammi = allMusammi?.find(m => m.MusammiID === h.MusammiID);
                    return (
                      <SelectItem key={h.HalaqahID} value={h.HalaqahID}>
                        Halaqah {h.NomorUrutHalaqah} - {musammi?.NamaMusammi || 'N/A'}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="jumlah-murojaah">Jumlah Murojaah (Juz)</Label>
              <Input
                id="jumlah-murojaah"
                type="number"
                step="0.1"
                value={murojaahForm.JumlahMurojaah}
                onChange={(e) => setMurojaahForm({ ...murojaahForm, JumlahMurojaah: parseFloat(e.target.value) || 0 })}
                data-testid="input-jumlah-murojaah"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActiveDialog('none')}>Batal</Button>
            <Button 
              onClick={() => createMurojaahMutation.mutate(murojaahForm)}
              disabled={createMurojaahMutation.isPending}
              data-testid="button-save-murojaah"
            >
              {createMurojaahMutation.isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Penambahan Dialog */}
      <Dialog open={activeDialog === 'penambahan'} onOpenChange={(open) => !open && setActiveDialog('none')}>
        <DialogContent data-testid="dialog-penambahan">
          <DialogHeader>
            <DialogTitle>Tambah Penambahan Hafalan</DialogTitle>
            <DialogDescription>
              Input penambahan hafalan dalam halaman. Otomatis akan ditambahkan ke hafalan bulanan (20 hlm = 1 juz)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bulan-penambahan">Bulan</Label>
              <Input
                id="bulan-penambahan"
                type="month"
                value={penambahanForm.Bulan}
                onChange={(e) => setPenambahanForm({ ...penambahanForm, Bulan: e.target.value })}
                data-testid="input-bulan-penambahan"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="santri-penambahan">Santri</Label>
              <Select value={penambahanForm.SantriID} onValueChange={(v) => handleSantriChange(v, 'penambahan')}>
                <SelectTrigger id="santri-penambahan" data-testid="select-santri-penambahan">
                  <SelectValue placeholder="Pilih Santri" />
                </SelectTrigger>
                <SelectContent>
                  {allSantri?.filter(s => s.Aktif).map((s) => (
                    <SelectItem key={s.SantriID} value={s.SantriID}>
                      {s.NamaSantri} ({s.Kelas})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="halaqah-penambahan">Halaqah</Label>
              <Select value={penambahanForm.HalaqahID} onValueChange={(v) => handleHalaqahChange(v, 'penambahan')}>
                <SelectTrigger id="halaqah-penambahan" data-testid="select-halaqah-penambahan">
                  <SelectValue placeholder="Pilih Halaqah" />
                </SelectTrigger>
                <SelectContent>
                  {allHalaqah?.filter(h => h.MarhalahID === penambahanForm.MarhalahID).map((h) => {
                    const musammi = allMusammi?.find(m => m.MusammiID === h.MusammiID);
                    return (
                      <SelectItem key={h.HalaqahID} value={h.HalaqahID}>
                        Halaqah {h.NomorUrutHalaqah} - {musammi?.NamaMusammi || 'N/A'}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="jumlah-penambahan">Jumlah Penambahan (Halaman)</Label>
              <Input
                id="jumlah-penambahan"
                type="number"
                value={penambahanForm.JumlahPenambahan}
                onChange={(e) => setPenambahanForm({ ...penambahanForm, JumlahPenambahan: parseInt(e.target.value) || 0 })}
                data-testid="input-jumlah-penambahan"
              />
              <p className="text-xs text-muted-foreground">
                Akan ditambahkan {(penambahanForm.JumlahPenambahan / 20).toFixed(2)} juz ke hafalan bulanan
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="catatan-penambahan">Catatan (Opsional)</Label>
              <Input
                id="catatan-penambahan"
                value={penambahanForm.Catatan}
                onChange={(e) => setPenambahanForm({ ...penambahanForm, Catatan: e.target.value })}
                data-testid="input-catatan-penambahan"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActiveDialog('none')}>Batal</Button>
            <Button 
              onClick={() => createPenambahanMutation.mutate(penambahanForm)}
              disabled={createPenambahanMutation.isPending}
              data-testid="button-save-penambahan"
            >
              {createPenambahanMutation.isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
