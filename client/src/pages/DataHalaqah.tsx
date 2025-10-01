import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import HalaqahTable from "@/components/HalaqahTable";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { 
  Halaqah, 
  Musammi, 
  Santri, 
  HalaqahMembers,
  HafalanBulanan,
  LookupsResponse,
  InsertMusammi,
  InsertSantri,
  InsertHalaqah,
  InsertHalaqahMembers
} from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface CombinedHalaqahData {
  santriId: string;
  namaSantri: string;
  kelasSantri: string;
  marhalahSantri: string;
  halaqahId: string;
  nomorHalaqah: number;
  namaMusammi: string;
  marhalahMusammi: string;
  kelasMusammi: string;
  jumlahHafalan: number;
}

export default function DataHalaqah() {
  const { toast } = useToast();
  const [activeDialog, setActiveDialog] = useState<'none' | 'musammi' | 'santri' | 'halaqah' | 'member'>('none');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [musammiForm, setMusammiForm] = useState<InsertMusammi>({
    NamaMusammi: '',
    MarhalahID: 'JAM',
    KelasMusammi: '',
    Catatan: ''
  });

  const [santriForm, setSantriForm] = useState<InsertSantri>({
    NamaSantri: '',
    MarhalahID: 'MUT',
    Kelas: '',
    Aktif: true
  });

  const [halaqahForm, setHalaqahForm] = useState<InsertHalaqah>({
    NomorUrutHalaqah: 1,
    MarhalahID: 'MUT',
    MusammiID: '',
    KelasMusammi: '',
    NamaHalaqah: ''
  });

  const [memberForm, setMemberForm] = useState<InsertHalaqahMembers>({
    HalaqahID: '',
    SantriID: '',
    TanggalMulai: new Date().toISOString().split('T')[0],
    TanggalSelesai: ''
  });

  // Fetch lookups
  const { data: lookups } = useQuery<LookupsResponse>({
    queryKey: ['/api/lookups'],
  });

  // Fetch all data
  const { data: allHalaqah, isLoading: loadingHalaqah } = useQuery<Halaqah[]>({
    queryKey: ['/api/halaqah'],
  });

  const { data: allMusammi } = useQuery<Musammi[]>({
    queryKey: ['/api/musammi'],
  });

  const { data: allSantri } = useQuery<Santri[]>({
    queryKey: ['/api/santri'],
  });

  const { data: allMembers } = useQuery<HalaqahMembers[]>({
    queryKey: ['/api/halaqah-members'],
    enabled: false, // We'll fetch per halaqah when needed
  });

  const currentMonth = new Date().toISOString().slice(0, 7);
  const { data: hafalanData } = useQuery<HafalanBulanan[]>({
    queryKey: ['/api/hafalan', { bulan: currentMonth }],
    enabled: false, // We'll fetch when needed
  });

  // Mutations
  const createMusammiMutation = useMutation({
    mutationFn: async (data: InsertMusammi) => {
      const res = await apiRequest('POST', '/api/musammi', data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/musammi'] });
      toast({ title: "Berhasil", description: "Musammi berhasil ditambahkan" });
      setActiveDialog('none');
      resetMusammiForm();
    },
    onError: (error: Error) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    }
  });

  const createSantriMutation = useMutation({
    mutationFn: async (data: InsertSantri) => {
      const res = await apiRequest('POST', '/api/santri', data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/santri'] });
      toast({ title: "Berhasil", description: "Santri berhasil ditambahkan" });
      setActiveDialog('none');
      resetSantriForm();
    },
    onError: (error: Error) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    }
  });

  const createHalaqahMutation = useMutation({
    mutationFn: async (data: InsertHalaqah) => {
      const res = await apiRequest('POST', '/api/halaqah', data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/halaqah'] });
      toast({ title: "Berhasil", description: "Halaqah berhasil ditambahkan" });
      setActiveDialog('none');
      resetHalaqahForm();
    },
    onError: (error: Error) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    }
  });

  const createMemberMutation = useMutation({
    mutationFn: async (data: InsertHalaqahMembers) => {
      const res = await apiRequest('POST', '/api/halaqah-members', data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/halaqah-members'] });
      toast({ title: "Berhasil", description: "Santri berhasil ditambahkan ke halaqah" });
      setActiveDialog('none');
      resetMemberForm();
    },
    onError: (error: Error) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    }
  });

  // Reset forms
  const resetMusammiForm = () => {
    setMusammiForm({
      NamaMusammi: '',
      MarhalahID: 'JAM',
      KelasMusammi: '',
      Catatan: ''
    });
    setEditingId(null);
  };

  const resetSantriForm = () => {
    setSantriForm({
      NamaSantri: '',
      MarhalahID: 'MUT',
      Kelas: '',
      Aktif: true
    });
    setEditingId(null);
  };

  const resetHalaqahForm = () => {
    setHalaqahForm({
      NomorUrutHalaqah: 1,
      MarhalahID: 'MUT',
      MusammiID: '',
      KelasMusammi: '',
      NamaHalaqah: ''
    });
    setEditingId(null);
  };

  const resetMemberForm = () => {
    setMemberForm({
      HalaqahID: '',
      SantriID: '',
      TanggalMulai: new Date().toISOString().split('T')[0],
      TanggalSelesai: ''
    });
  };

  // Get available kelas options based on selected marhalah
  const getKelasOptions = (marhalahId: string) => {
    return lookups?.kelas.filter(k => k.MarhalahID === marhalahId) || [];
  };

  // Combine data for table - This is a simplified version
  // In production, you would need to fetch all relationships properly
  const combinedData: CombinedHalaqahData[] = [];

  // Note: This is mock transformation - actual implementation would need proper API endpoint
  // or client-side joining of multiple queries

  if (loadingHalaqah) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-96" />
          <Skeleton className="h-5 w-full max-w-2xl mt-2" />
        </div>
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Data Halaqah</h1>
          <p className="text-muted-foreground mt-2">
            Kelola data santri, musammi, dan keanggotaan halaqah
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="musammi" data-testid="tab-musammi">Musammi</TabsTrigger>
          <TabsTrigger value="santri" data-testid="tab-santri">Santri</TabsTrigger>
          <TabsTrigger value="halaqah" data-testid="tab-halaqah">Halaqah</TabsTrigger>
          <TabsTrigger value="members" data-testid="tab-members">Keanggotaan</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setActiveDialog('member')} data-testid="button-add-member">
              <Plus className="h-4 w-4 mr-2" />
              Tambah ke Halaqah
            </Button>
          </div>
          <Card>
            <CardHeader>
              <p className="text-sm text-muted-foreground">
                Tabel gabungan akan menampilkan data lengkap dari santri, halaqah, dan musammi.
                Gunakan tab di atas untuk mengelola data per kategori.
              </p>
            </CardHeader>
          </Card>
        </TabsContent>

        <TabsContent value="musammi" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setActiveDialog('musammi')} data-testid="button-add-musammi">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Musammi
            </Button>
          </div>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                {allMusammi?.map((m) => (
                  <div key={m.MusammiID} className="flex items-center justify-between p-3 border rounded-lg hover-elevate" data-testid={`item-musammi-${m.MusammiID}`}>
                    <div>
                      <p className="font-medium">{m.NamaMusammi}</p>
                      <p className="text-sm text-muted-foreground">
                        {lookups?.marhalah.find(mar => mar.MarhalahID === m.MarhalahID)?.NamaMarhalah} - {m.KelasMusammi}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="santri" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setActiveDialog('santri')} data-testid="button-add-santri">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Santri
            </Button>
          </div>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                {allSantri?.map((s) => (
                  <div key={s.SantriID} className="flex items-center justify-between p-3 border rounded-lg hover-elevate" data-testid={`item-santri-${s.SantriID}`}>
                    <div>
                      <p className="font-medium">{s.NamaSantri}</p>
                      <p className="text-sm text-muted-foreground">
                        {lookups?.marhalah.find(mar => mar.MarhalahID === s.MarhalahID)?.NamaMarhalah} - {s.Kelas}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="halaqah" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setActiveDialog('halaqah')} data-testid="button-add-halaqah">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Halaqah
            </Button>
          </div>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                {allHalaqah?.map((h) => {
                  const musammi = allMusammi?.find(m => m.MusammiID === h.MusammiID);
                  return (
                    <div key={h.HalaqahID} className="flex items-center justify-between p-3 border rounded-lg hover-elevate" data-testid={`item-halaqah-${h.HalaqahID}`}>
                      <div>
                        <p className="font-medium">Halaqah {h.NomorUrutHalaqah} - {h.NamaHalaqah || 'Tanpa Nama'}</p>
                        <p className="text-sm text-muted-foreground">
                          {lookups?.marhalah.find(mar => mar.MarhalahID === h.MarhalahID)?.NamaMarhalah} - Musammi: {musammi?.NamaMusammi || 'N/A'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                Kelola keanggotaan santri di halaqah. Gunakan tombol "Tambah ke Halaqah" di tab Overview.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Musammi Dialog */}
      <Dialog open={activeDialog === 'musammi'} onOpenChange={(open) => !open && setActiveDialog('none')}>
        <DialogContent data-testid="dialog-musammi">
          <DialogHeader>
            <DialogTitle>Tambah Musammi</DialogTitle>
            <DialogDescription>Tambahkan data musammi baru</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nama-musammi">Nama Musammi</Label>
              <Input
                id="nama-musammi"
                value={musammiForm.NamaMusammi}
                onChange={(e) => setMusammiForm({ ...musammiForm, NamaMusammi: e.target.value })}
                data-testid="input-nama-musammi"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="marhalah-musammi">Marhalah</Label>
              <Select
                value={musammiForm.MarhalahID}
                onValueChange={(value: any) => setMusammiForm({ ...musammiForm, MarhalahID: value, KelasMusammi: '' })}
              >
                <SelectTrigger id="marhalah-musammi" data-testid="select-marhalah-musammi">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {lookups?.marhalah.map((m) => (
                    <SelectItem key={m.MarhalahID} value={m.MarhalahID}>
                      {m.NamaMarhalah}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="kelas-musammi">Kelas</Label>
              <Select
                value={musammiForm.KelasMusammi}
                onValueChange={(value) => setMusammiForm({ ...musammiForm, KelasMusammi: value })}
              >
                <SelectTrigger id="kelas-musammi" data-testid="select-kelas-musammi">
                  <SelectValue placeholder="Pilih Kelas" />
                </SelectTrigger>
                <SelectContent>
                  {getKelasOptions(musammiForm.MarhalahID).map((k) => (
                    <SelectItem key={k.Kelas} value={k.Kelas}>
                      {k.Kelas}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="catatan-musammi">Catatan (Opsional)</Label>
              <Input
                id="catatan-musammi"
                value={musammiForm.Catatan}
                onChange={(e) => setMusammiForm({ ...musammiForm, Catatan: e.target.value })}
                data-testid="input-catatan-musammi"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActiveDialog('none')}>Batal</Button>
            <Button 
              onClick={() => createMusammiMutation.mutate(musammiForm)} 
              disabled={createMusammiMutation.isPending}
              data-testid="button-save-musammi"
            >
              {createMusammiMutation.isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Santri Dialog */}
      <Dialog open={activeDialog === 'santri'} onOpenChange={(open) => !open && setActiveDialog('none')}>
        <DialogContent data-testid="dialog-santri">
          <DialogHeader>
            <DialogTitle>Tambah Santri</DialogTitle>
            <DialogDescription>Tambahkan data santri baru</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nama-santri">Nama Santri</Label>
              <Input
                id="nama-santri"
                value={santriForm.NamaSantri}
                onChange={(e) => setSantriForm({ ...santriForm, NamaSantri: e.target.value })}
                data-testid="input-nama-santri"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="marhalah-santri">Marhalah</Label>
              <Select
                value={santriForm.MarhalahID}
                onValueChange={(value: any) => setSantriForm({ ...santriForm, MarhalahID: value, Kelas: '' })}
              >
                <SelectTrigger id="marhalah-santri" data-testid="select-marhalah-santri">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {lookups?.marhalah.filter(m => m.MarhalahID !== 'JAM').map((m) => (
                    <SelectItem key={m.MarhalahID} value={m.MarhalahID}>
                      {m.NamaMarhalah}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="kelas-santri">Kelas</Label>
              <Select
                value={santriForm.Kelas}
                onValueChange={(value) => setSantriForm({ ...santriForm, Kelas: value })}
              >
                <SelectTrigger id="kelas-santri" data-testid="select-kelas-santri">
                  <SelectValue placeholder="Pilih Kelas" />
                </SelectTrigger>
                <SelectContent>
                  {getKelasOptions(santriForm.MarhalahID).map((k) => (
                    <SelectItem key={k.Kelas} value={k.Kelas}>
                      {k.Kelas}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActiveDialog('none')}>Batal</Button>
            <Button 
              onClick={() => createSantriMutation.mutate(santriForm)}
              disabled={createSantriMutation.isPending}
              data-testid="button-save-santri"
            >
              {createSantriMutation.isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Halaqah Dialog */}
      <Dialog open={activeDialog === 'halaqah'} onOpenChange={(open) => !open && setActiveDialog('none')}>
        <DialogContent data-testid="dialog-halaqah">
          <DialogHeader>
            <DialogTitle>Tambah Halaqah</DialogTitle>
            <DialogDescription>Tambahkan halaqah baru</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nomor-halaqah">Nomor Urut Halaqah</Label>
              <Input
                id="nomor-halaqah"
                type="number"
                value={halaqahForm.NomorUrutHalaqah}
                onChange={(e) => setHalaqahForm({ ...halaqahForm, NomorUrutHalaqah: parseInt(e.target.value) })}
                data-testid="input-nomor-halaqah"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="marhalah-halaqah">Marhalah</Label>
              <Select
                value={halaqahForm.MarhalahID}
                onValueChange={(value: any) => setHalaqahForm({ ...halaqahForm, MarhalahID: value })}
              >
                <SelectTrigger id="marhalah-halaqah" data-testid="select-marhalah-halaqah">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {lookups?.marhalah.filter(m => m.MarhalahID !== 'JAM').map((m) => (
                    <SelectItem key={m.MarhalahID} value={m.MarhalahID}>
                      {m.NamaMarhalah}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="musammi-halaqah">Musammi</Label>
              <Select
                value={halaqahForm.MusammiID}
                onValueChange={(value) => {
                  const musammi = allMusammi?.find(m => m.MusammiID === value);
                  setHalaqahForm({ 
                    ...halaqahForm, 
                    MusammiID: value,
                    KelasMusammi: musammi?.KelasMusammi || ''
                  });
                }}
              >
                <SelectTrigger id="musammi-halaqah" data-testid="select-musammi-halaqah">
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
            <div className="space-y-2">
              <Label htmlFor="nama-halaqah">Nama Halaqah (Opsional)</Label>
              <Input
                id="nama-halaqah"
                value={halaqahForm.NamaHalaqah}
                onChange={(e) => setHalaqahForm({ ...halaqahForm, NamaHalaqah: e.target.value })}
                data-testid="input-nama-halaqah"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActiveDialog('none')}>Batal</Button>
            <Button 
              onClick={() => createHalaqahMutation.mutate(halaqahForm)}
              disabled={createHalaqahMutation.isPending}
              data-testid="button-save-halaqah"
            >
              {createHalaqahMutation.isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Member Dialog */}
      <Dialog open={activeDialog === 'member'} onOpenChange={(open) => !open && setActiveDialog('none')}>
        <DialogContent data-testid="dialog-member">
          <DialogHeader>
            <DialogTitle>Tambah Santri ke Halaqah</DialogTitle>
            <DialogDescription>Masukkan santri ke halaqah tertentu</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="halaqah-member">Halaqah</Label>
              <Select
                value={memberForm.HalaqahID}
                onValueChange={(value) => setMemberForm({ ...memberForm, HalaqahID: value })}
              >
                <SelectTrigger id="halaqah-member" data-testid="select-halaqah-member">
                  <SelectValue placeholder="Pilih Halaqah" />
                </SelectTrigger>
                <SelectContent>
                  {allHalaqah?.map((h) => {
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
              <Label htmlFor="santri-member">Santri</Label>
              <Select
                value={memberForm.SantriID}
                onValueChange={(value) => setMemberForm({ ...memberForm, SantriID: value })}
              >
                <SelectTrigger id="santri-member" data-testid="select-santri-member">
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
              <Label htmlFor="tanggal-mulai">Tanggal Mulai</Label>
              <Input
                id="tanggal-mulai"
                type="date"
                value={memberForm.TanggalMulai}
                onChange={(e) => setMemberForm({ ...memberForm, TanggalMulai: e.target.value })}
                data-testid="input-tanggal-mulai"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActiveDialog('none')}>Batal</Button>
            <Button 
              onClick={() => createMemberMutation.mutate(memberForm)}
              disabled={createMemberMutation.isPending}
              data-testid="button-save-member"
            >
              {createMemberMutation.isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
