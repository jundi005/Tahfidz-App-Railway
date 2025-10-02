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
  const [selectedMarhalah, setSelectedMarhalah] = useState<string>('ALL');

  // Table-based input state
  const [addingHafalan, setAddingHafalan] = useState(false);
  const [addingMurojaah, setAddingMurojaah] = useState(false);
  const [addingPenambahan, setAddingPenambahan] = useState(false);

  // Forms for new rows
  const [hafalanForm, setHafalanForm] = useState<InsertHafalanBulanan>({
    Bulan: selectedMonth,
    SantriID: '',
    HalaqahID: '',
    MarhalahID: 'MUT',
    Kelas: '',
    MusammiID: '',
    JumlahHafalan: 0
  });

  const [murojaahForm, setMurojaahForm] = useState<InsertMurojaahBulanan>({
    Bulan: selectedMonth,
    SantriID: '',
    HalaqahID: '',
    MarhalahID: 'MUT',
    Kelas: '',
    MusammiID: '',
    JumlahMurojaah: 0
  });

  const [penambahanForm, setPenambahanForm] = useState<InsertPenambahanHafalan>({
    Bulan: selectedMonth,
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

  const { data: penambahanData, isLoading: loadingPenambahan } = useQuery<PenambahanHafalan[]>({
    queryKey: ['/api/penambahan', { bulan: selectedMonth, marhalah: selectedMarhalah === 'ALL' ? '' : selectedMarhalah }],
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
      setAddingHafalan(false);
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
      setAddingMurojaah(false);
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
      queryClient.invalidateQueries({ queryKey: ['/api/penambahan'] });
      toast({ 
        title: "Berhasil", 
        description: "Penambahan hafalan berhasil disimpan dan hafalan bulanan telah diperbarui",
        duration: 5000
      });
      setAddingPenambahan(false);
      resetPenambahanForm();
    },
    onError: (error: Error) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    }
  });

  const resetHafalanForm = () => {
    setHafalanForm({
      Bulan: selectedMonth,
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
      Bulan: selectedMonth,
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
      Bulan: selectedMonth,
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
            <Button 
              onClick={() => {
                resetHafalanForm();
                setAddingHafalan(true);
              }} 
              disabled={addingHafalan}
              data-testid="button-add-hafalan"
            >
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
                        <TableHead>Halaqah</TableHead>
                        <TableHead>Musammi</TableHead>
                        <TableHead>Hafalan (Juz)</TableHead>
                        {addingHafalan && <TableHead>Actions</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {addingHafalan && (
                        <TableRow className="bg-muted/50" data-testid="row-hafalan-new">
                          <TableCell>
                            <Input
                              type="month"
                              value={hafalanForm.Bulan}
                              onChange={(e) => setHafalanForm({ ...hafalanForm, Bulan: e.target.value })}
                              className="w-32"
                              data-testid="input-bulan-hafalan"
                            />
                          </TableCell>
                          <TableCell>
                            <Select value={hafalanForm.SantriID} onValueChange={(v) => handleSantriChange(v, 'hafalan')}>
                              <SelectTrigger className="w-40" data-testid="select-santri-hafalan">
                                <SelectValue placeholder="Pilih Santri" />
                              </SelectTrigger>
                              <SelectContent>
                                {allSantri?.filter(s => s.Aktif).map((s) => (
                                  <SelectItem key={s.SantriID} value={s.SantriID}>
                                    {s.NamaSantri}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {hafalanForm.Kelas || '-'}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {lookups?.marhalah.find(m => m.MarhalahID === hafalanForm.MarhalahID)?.NamaMarhalah || '-'}
                          </TableCell>
                          <TableCell>
                            <Select value={hafalanForm.HalaqahID} onValueChange={(v) => handleHalaqahChange(v, 'hafalan')}>
                              <SelectTrigger className="w-32" data-testid="select-halaqah-hafalan">
                                <SelectValue placeholder="Pilih Halaqah" />
                              </SelectTrigger>
                              <SelectContent>
                                {allHalaqah?.filter(h => h.MarhalahID === hafalanForm.MarhalahID).map((h) => {
                                  const musammi = allMusammi?.find(m => m.MusammiID === h.MusammiID);
                                  return (
                                    <SelectItem key={h.HalaqahID} value={h.HalaqahID}>
                                      {h.NomorUrutHalaqah} - {musammi?.NamaMusammi}
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {allMusammi?.find(m => m.MusammiID === hafalanForm.MusammiID)?.NamaMusammi || '-'}
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.1"
                              value={hafalanForm.JumlahHafalan}
                              onChange={(e) => setHafalanForm({ ...hafalanForm, JumlahHafalan: parseFloat(e.target.value) || 0 })}
                              className="w-20"
                              data-testid="input-jumlah-hafalan"
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => createHafalanMutation.mutate(hafalanForm)}
                                disabled={createHafalanMutation.isPending || !hafalanForm.SantriID || !hafalanForm.HalaqahID}
                                data-testid="button-save-hafalan"
                              >
                                {createHafalanMutation.isPending ? 'Saving...' : 'Save'}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setAddingHafalan(false);
                                  resetHafalanForm();
                                }}
                                data-testid="button-cancel-hafalan"
                              >
                                Cancel
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                      {hafalanData && hafalanData.length > 0 ? (
                        hafalanData.map((h) => {
                          const santri = allSantri?.find(s => s.SantriID === h.SantriID);
                          const halaqah = allHalaqah?.find(ha => ha.HalaqahID === h.HalaqahID);
                          const musammi = allMusammi?.find(m => m.MusammiID === h.MusammiID);
                          return (
                            <TableRow key={h.RekapID} data-testid={`row-hafalan-${h.RekapID}`}>
                              <TableCell>{h.Bulan}</TableCell>
                              <TableCell className="font-medium">{santri?.NamaSantri || 'N/A'}</TableCell>
                              <TableCell>{h.Kelas}</TableCell>
                              <TableCell>{lookups?.marhalah.find(m => m.MarhalahID === h.MarhalahID)?.NamaMarhalah}</TableCell>
                              <TableCell>{halaqah?.NomorUrutHalaqah || 'N/A'}</TableCell>
                              <TableCell>{musammi?.NamaMusammi || 'N/A'}</TableCell>
                              <TableCell className="font-mono">{h.JumlahHafalan.toFixed(1)}</TableCell>
                            </TableRow>
                          );
                        })
                      ) : !addingHafalan ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground">
                            Tidak ada data hafalan untuk bulan {selectedMonth}
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="murojaah" className="space-y-4">
          <div className="flex justify-end">
            <Button 
              onClick={() => {
                resetMurojaahForm();
                setAddingMurojaah(true);
              }}
              disabled={addingMurojaah}
              data-testid="button-add-murojaah"
            >
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
                        <TableHead>Halaqah</TableHead>
                        <TableHead>Musammi</TableHead>
                        <TableHead>Murojaah (Juz)</TableHead>
                        {addingMurojaah && <TableHead>Actions</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {addingMurojaah && (
                        <TableRow className="bg-muted/50" data-testid="row-murojaah-new">
                          <TableCell>
                            <Input
                              type="month"
                              value={murojaahForm.Bulan}
                              onChange={(e) => setMurojaahForm({ ...murojaahForm, Bulan: e.target.value })}
                              className="w-32"
                              data-testid="input-bulan-murojaah"
                            />
                          </TableCell>
                          <TableCell>
                            <Select value={murojaahForm.SantriID} onValueChange={(v) => handleSantriChange(v, 'murojaah')}>
                              <SelectTrigger className="w-40" data-testid="select-santri-murojaah">
                                <SelectValue placeholder="Pilih Santri" />
                              </SelectTrigger>
                              <SelectContent>
                                {allSantri?.filter(s => s.Aktif).map((s) => (
                                  <SelectItem key={s.SantriID} value={s.SantriID}>
                                    {s.NamaSantri}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {murojaahForm.Kelas || '-'}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {lookups?.marhalah.find(m => m.MarhalahID === murojaahForm.MarhalahID)?.NamaMarhalah || '-'}
                          </TableCell>
                          <TableCell>
                            <Select value={murojaahForm.HalaqahID} onValueChange={(v) => handleHalaqahChange(v, 'murojaah')}>
                              <SelectTrigger className="w-32" data-testid="select-halaqah-murojaah">
                                <SelectValue placeholder="Pilih Halaqah" />
                              </SelectTrigger>
                              <SelectContent>
                                {allHalaqah?.filter(h => h.MarhalahID === murojaahForm.MarhalahID).map((h) => {
                                  const musammi = allMusammi?.find(m => m.MusammiID === h.MusammiID);
                                  return (
                                    <SelectItem key={h.HalaqahID} value={h.HalaqahID}>
                                      {h.NomorUrutHalaqah} - {musammi?.NamaMusammi}
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {allMusammi?.find(m => m.MusammiID === murojaahForm.MusammiID)?.NamaMusammi || '-'}
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.1"
                              value={murojaahForm.JumlahMurojaah}
                              onChange={(e) => setMurojaahForm({ ...murojaahForm, JumlahMurojaah: parseFloat(e.target.value) || 0 })}
                              className="w-20"
                              data-testid="input-jumlah-murojaah"
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => createMurojaahMutation.mutate(murojaahForm)}
                                disabled={createMurojaahMutation.isPending || !murojaahForm.SantriID || !murojaahForm.HalaqahID}
                                data-testid="button-save-murojaah"
                              >
                                {createMurojaahMutation.isPending ? 'Saving...' : 'Save'}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setAddingMurojaah(false);
                                  resetMurojaahForm();
                                }}
                                data-testid="button-cancel-murojaah"
                              >
                                Cancel
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                      {murojaahData && murojaahData.length > 0 ? (
                        murojaahData.map((m) => {
                          const santri = allSantri?.find(s => s.SantriID === m.SantriID);
                          const halaqah = allHalaqah?.find(ha => ha.HalaqahID === m.HalaqahID);
                          const musammi = allMusammi?.find(mu => mu.MusammiID === m.MusammiID);
                          return (
                            <TableRow key={m.MurojaahID} data-testid={`row-murojaah-${m.MurojaahID}`}>
                              <TableCell>{m.Bulan}</TableCell>
                              <TableCell className="font-medium">{santri?.NamaSantri || 'N/A'}</TableCell>
                              <TableCell>{m.Kelas}</TableCell>
                              <TableCell>{lookups?.marhalah.find(mar => mar.MarhalahID === m.MarhalahID)?.NamaMarhalah}</TableCell>
                              <TableCell>{halaqah?.NomorUrutHalaqah || 'N/A'}</TableCell>
                              <TableCell>{musammi?.NamaMusammi || 'N/A'}</TableCell>
                              <TableCell className="font-mono">{m.JumlahMurojaah.toFixed(1)}</TableCell>
                            </TableRow>
                          );
                        })
                      ) : !addingMurojaah ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground">
                            Tidak ada data murojaah untuk bulan {selectedMonth}
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="penambahan" className="space-y-4">
          <div className="flex justify-end">
            <Button 
              onClick={() => {
                resetPenambahanForm();
                setAddingPenambahan(true);
              }}
              disabled={addingPenambahan}
              data-testid="button-add-penambahan"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Tambah Penambahan Hafalan
            </Button>
          </div>
          
          {loadingPenambahan ? (
            <Card>
              <CardContent className="pt-6">
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Data Penambahan Hafalan</CardTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  Input penambahan hafalan dalam format halaman. Sistem akan otomatis mengonversi ke juz
                  (20 halaman = 1 juz) dan menambahkannya ke data hafalan bulanan.
                </p>
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
                        <TableHead>Halaqah</TableHead>
                        <TableHead>Musammi</TableHead>
                        <TableHead>Penambahan (Halaman)</TableHead>
                        <TableHead>Penambahan (Juz)</TableHead>
                        <TableHead>Catatan</TableHead>
                        {addingPenambahan && <TableHead>Actions</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {addingPenambahan && (
                        <TableRow className="bg-muted/50" data-testid="row-penambahan-new">
                          <TableCell>
                            <Input
                              type="month"
                              value={penambahanForm.Bulan}
                              onChange={(e) => setPenambahanForm({ ...penambahanForm, Bulan: e.target.value })}
                              className="w-32"
                              data-testid="input-bulan-penambahan"
                            />
                          </TableCell>
                          <TableCell>
                            <Select value={penambahanForm.SantriID} onValueChange={(v) => handleSantriChange(v, 'penambahan')}>
                              <SelectTrigger className="w-40" data-testid="select-santri-penambahan">
                                <SelectValue placeholder="Pilih Santri" />
                              </SelectTrigger>
                              <SelectContent>
                                {allSantri?.filter(s => s.Aktif).map((s) => (
                                  <SelectItem key={s.SantriID} value={s.SantriID}>
                                    {s.NamaSantri}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {penambahanForm.Kelas || '-'}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {lookups?.marhalah.find(m => m.MarhalahID === penambahanForm.MarhalahID)?.NamaMarhalah || '-'}
                          </TableCell>
                          <TableCell>
                            <Select value={penambahanForm.HalaqahID} onValueChange={(v) => handleHalaqahChange(v, 'penambahan')}>
                              <SelectTrigger className="w-32" data-testid="select-halaqah-penambahan">
                                <SelectValue placeholder="Pilih Halaqah" />
                              </SelectTrigger>
                              <SelectContent>
                                {allHalaqah?.filter(h => h.MarhalahID === penambahanForm.MarhalahID).map((h) => {
                                  const musammi = allMusammi?.find(m => m.MusammiID === h.MusammiID);
                                  return (
                                    <SelectItem key={h.HalaqahID} value={h.HalaqahID}>
                                      {h.NomorUrutHalaqah} - {musammi?.NamaMusammi}
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {allMusammi?.find(m => m.MusammiID === penambahanForm.MusammiID)?.NamaMusammi || '-'}
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="1"
                              value={penambahanForm.JumlahPenambahan}
                              onChange={(e) => setPenambahanForm({ ...penambahanForm, JumlahPenambahan: parseInt(e.target.value) || 0 })}
                              className="w-20"
                              data-testid="input-jumlah-penambahan"
                            />
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {(penambahanForm.JumlahPenambahan / 20).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Input
                              type="text"
                              value={penambahanForm.Catatan || ''}
                              onChange={(e) => setPenambahanForm({ ...penambahanForm, Catatan: e.target.value })}
                              className="w-32"
                              placeholder="Optional"
                              data-testid="input-catatan-penambahan"
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => createPenambahanMutation.mutate(penambahanForm)}
                                disabled={createPenambahanMutation.isPending || !penambahanForm.SantriID || !penambahanForm.HalaqahID}
                                data-testid="button-save-penambahan"
                              >
                                {createPenambahanMutation.isPending ? 'Saving...' : 'Save'}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setAddingPenambahan(false);
                                  resetPenambahanForm();
                                }}
                                data-testid="button-cancel-penambahan"
                              >
                                Cancel
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                      {penambahanData && penambahanData.length > 0 ? (
                        penambahanData.map((p) => {
                          const santri = allSantri?.find(s => s.SantriID === p.SantriID);
                          const halaqah = allHalaqah?.find(ha => ha.HalaqahID === p.HalaqahID);
                          const musammi = allMusammi?.find(m => m.MusammiID === p.MusammiID);
                          const juz = (p.JumlahPenambahan / 20).toFixed(2);
                          return (
                            <TableRow key={p.PenambahanID} data-testid={`row-penambahan-${p.PenambahanID}`}>
                              <TableCell>{p.Bulan}</TableCell>
                              <TableCell className="font-medium">{santri?.NamaSantri || 'N/A'}</TableCell>
                              <TableCell>{p.Kelas}</TableCell>
                              <TableCell>{lookups?.marhalah.find(m => m.MarhalahID === p.MarhalahID)?.NamaMarhalah}</TableCell>
                              <TableCell>{halaqah?.NomorUrutHalaqah || 'N/A'}</TableCell>
                              <TableCell>{musammi?.NamaMusammi || 'N/A'}</TableCell>
                              <TableCell className="font-mono">{p.JumlahPenambahan}</TableCell>
                              <TableCell className="font-mono">{juz}</TableCell>
                              <TableCell>{p.Catatan || '-'}</TableCell>
                            </TableRow>
                          );
                        })
                      ) : !addingPenambahan ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center text-muted-foreground">
                            Tidak ada data penambahan hafalan untuk bulan {selectedMonth}
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
