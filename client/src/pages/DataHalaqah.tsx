import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Calendar, AlertCircle } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { 
  Halaqah, 
  Musammi, 
  Santri, 
  LookupsResponse,
  HalaqahMembers,
  HalaqahWithDetails,
  SantriWithKelas,
  BatchAbsensi,
} from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Fallback data jika API lookups error
const FALLBACK_LOOKUPS: LookupsResponse = {
  marhalah: [
    { MarhalahID: "MUT", NamaMarhalah: "Mutawassitoh" },
    { MarhalahID: "ALI", NamaMarhalah: "Aliyah" },
    { MarhalahID: "JAM", NamaMarhalah: "Jami'iyyah" }
  ],
  waktu: [
    { WaktuID: "SUBUH", NamaWaktu: "Subuh" },
    { WaktuID: "ASHAR", NamaWaktu: "Ashar" },
    { WaktuID: "ISYA", NamaWaktu: "Isya" }
  ],
  kehadiran: [
    { StatusID: "HADIR", NamaStatus: "Hadir" },
    { StatusID: "SAKIT", NamaStatus: "Sakit" },
    { StatusID: "IZIN", NamaStatus: "Izin" },
    { StatusID: "ALPA", NamaStatus: "Alpa" },
    { StatusID: "TERLAMBAT", NamaStatus: "Terlambat" }
  ],
  kelas: [
    { MarhalahID: "MUT", Kelas: "1A" },
    { MarhalahID: "MUT", Kelas: "1B" },
    { MarhalahID: "MUT", Kelas: "2A" },
    { MarhalahID: "MUT", Kelas: "2B" },
    { MarhalahID: "MUT", Kelas: "3A" },
    { MarhalahID: "MUT", Kelas: "3B" },
    { MarhalahID: "ALI", Kelas: "X-A" },
    { MarhalahID: "ALI", Kelas: "X-B" },
    { MarhalahID: "ALI", Kelas: "XI-A" },
    { MarhalahID: "ALI", Kelas: "XI-B" },
    { MarhalahID: "ALI", Kelas: "XII-A" },
    { MarhalahID: "ALI", Kelas: "XII-B" },
    { MarhalahID: "JAM", Kelas: "TQS" },
    { MarhalahID: "JAM", Kelas: "TAHFIDZ" }
  ]
};

export default function DataHalaqah() {
  const { toast } = useToast();
  const [selectedMarhalah, setSelectedMarhalah] = useState<string>("");
  const [selectedWaktu, setSelectedWaktu] = useState<string>("");
  const [tanggal, setTanggal] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showAbsensiDialog, setShowAbsensiDialog] = useState(false);
  
  // State untuk menyimpan status absensi setiap santri
  const [absensiState, setAbsensiState] = useState<Record<string, string>>({});

  // Fetch lookups
  const { data: lookupsData, isLoading: loadingLookups, isError: errorLookups } = useQuery<LookupsResponse>({
    queryKey: ['/api/lookups'],
    retry: 2,
  });
  
  // Gunakan fallback data jika API error
  const lookups = errorLookups ? FALLBACK_LOOKUPS : lookupsData;

  // Fetch all halaqah
  const { data: allHalaqah, isLoading: loadingHalaqah } = useQuery<Halaqah[]>({
    queryKey: ['/api/halaqah'],
  });

  // Fetch all musammi
  const { data: allMusammi, isLoading: loadingMusammi } = useQuery<Musammi[]>({
    queryKey: ['/api/musammi'],
  });

  // Fetch all santri
  const { data: allSantri, isLoading: loadingSantri } = useQuery<Santri[]>({
    queryKey: ['/api/santri'],
  });

  // Fetch all halaqah members for all halaqah
  const halaqahIds = allHalaqah?.map(h => h.HalaqahID) || [];
  
  // Query untuk setiap halaqah members
  const membersQueries = halaqahIds.map(halaqahId => ({
    queryKey: ['/api/halaqah-members', halaqahId],
    queryFn: async () => {
      const response = await fetch(`/api/halaqah-members?halaqahId=${halaqahId}`);
      if (!response.ok) throw new Error('Failed to fetch members');
      return response.json() as Promise<HalaqahMembers[]>;
    },
    enabled: !!halaqahId,
  }));

  // Gunakan useQuery untuk setiap halaqah members
  const membersResults = membersQueries.map(query => useQuery(query));

  // Gabungkan semua data menjadi HalaqahWithDetails
  const halaqahWithDetails = useMemo<HalaqahWithDetails[]>(() => {
    if (!allHalaqah || !allMusammi || !allSantri) return [];
    
    return allHalaqah.map((halaqah, index) => {
      const musammi = allMusammi.find(m => m.MusammiID === halaqah.MusammiID);
      const members = membersResults[index]?.data || [];
      
      const santriList: SantriWithKelas[] = members
        .map(member => {
          const santri = allSantri.find(s => s.SantriID === member.SantriID);
          if (!santri) return null;
          return {
            santriId: santri.SantriID,
            namaSantri: santri.NamaSantri,
            kelas: santri.Kelas,
          };
        })
        .filter((s): s is SantriWithKelas => s !== null);

      return {
        halaqahId: halaqah.HalaqahID,
        nomorUrutHalaqah: halaqah.NomorUrutHalaqah,
        marhalahId: halaqah.MarhalahID,
        namaMusammi: musammi?.NamaMusammi || 'N/A',
        santriList,
      };
    });
  }, [allHalaqah, allMusammi, allSantri, membersResults]);

  // Filter berdasarkan marhalah yang dipilih
  const filteredHalaqah = useMemo(() => {
    if (!selectedMarhalah) return halaqahWithDetails;
    return halaqahWithDetails.filter(h => h.marhalahId === selectedMarhalah);
  }, [halaqahWithDetails, selectedMarhalah]);

  // Mutation untuk batch submit absensi
  const submitAbsensiMutation = useMutation({
    mutationFn: async (data: BatchAbsensi) => {
      return await apiRequest('POST', '/api/absensi/batch', data);
    },
    onSuccess: () => {
      toast({ 
        title: "Berhasil", 
        description: "Absensi berhasil disimpan" 
      });
      setShowAbsensiDialog(false);
      setAbsensiState({});
    },
    onError: (error: Error) => {
      toast({ 
        title: "Gagal", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });

  const handleUpdateAbsensi = (santriId: string, statusId: string) => {
    setAbsensiState(prev => ({
      ...prev,
      [santriId]: statusId,
    }));
  };

  const handleSubmitAbsensi = () => {
    if (!selectedMarhalah || !selectedWaktu) {
      toast({
        title: "Error",
        description: "Pilih marhalah dan waktu terlebih dahulu",
        variant: "destructive"
      });
      return;
    }

    // Build santri absensi list
    const santriAbsensi = Object.entries(absensiState).map(([santriId, statusId]) => {
      const santri = allSantri?.find(s => s.SantriID === santriId);
      const halaqahDetail = halaqahWithDetails.find(h => 
        h.santriList.some(s => s.santriId === santriId)
      );
      
      return {
        halaqahId: halaqahDetail?.halaqahId || '',
        santriId,
        statusId: statusId as any,
      };
    }).filter(item => item.halaqahId);

    const batchData: BatchAbsensi = {
      tanggal,
      marhalahId: selectedMarhalah as any,
      waktuId: selectedWaktu as any,
      musammi: [],
      santri: santriAbsensi,
    };

    submitAbsensiMutation.mutate(batchData);
  };

  const isLoading = loadingHalaqah || loadingMusammi || loadingSantri || loadingLookups;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-96" />
          <Skeleton className="h-5 w-full max-w-2xl mt-2" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold" data-testid="title-data-halaqah">Data Halaqah</h1>
          <p className="text-muted-foreground mt-2">
            Kelola data halaqah dan absensi santri
          </p>
        </div>
        <Button 
          onClick={() => setShowAbsensiDialog(true)}
          data-testid="button-open-absensi"
        >
          <Calendar className="h-4 w-4 mr-2" />
          Isi Absensi
        </Button>
      </div>

      {/* Alert jika lookups error */}
      {errorLookups && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Gagal memuat data lookup dari server. Menggunakan data default. Pastikan Google Sheets memiliki sheet: Lookups_Marhalah, Lookups_Waktu, Lookups_Kehadiran, dan Lookups_Kelas.
          </AlertDescription>
        </Alert>
      )}

      {/* Filter Marhalah */}
      <div className="flex gap-4 items-center">
        <div className="w-48">
          <Label>Filter Marhalah</Label>
          <Select value={selectedMarhalah} onValueChange={setSelectedMarhalah}>
            <SelectTrigger data-testid="select-filter-marhalah">
              <SelectValue placeholder="Semua Marhalah" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Marhalah</SelectItem>
              {lookups?.marhalah.filter(m => m.MarhalahID !== 'JAM').map((m) => (
                <SelectItem key={m.MarhalahID} value={m.MarhalahID}>
                  {m.NamaMarhalah}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* List of Halaqah Cards */}
      <div className="space-y-4">
        {filteredHalaqah.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground">
                Tidak ada data halaqah
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredHalaqah.map((halaqah) => {
            const marhalahName = lookups?.marhalah.find(m => m.MarhalahID === halaqah.marhalahId)?.NamaMarhalah || halaqah.marhalahId;
            
            return (
              <Card key={halaqah.halaqahId} data-testid={`card-halaqah-${halaqah.halaqahId}`}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between gap-2">
                    <span>Halaqah {halaqah.nomorUrutHalaqah} - {marhalahName}</span>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Musammi: {halaqah.namaMusammi}
                  </p>
                </CardHeader>
                <CardContent>
                  {halaqah.santriList.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Belum ada santri di halaqah ini</p>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Daftar Santri:</p>
                      <div className="grid gap-2">
                        {halaqah.santriList.map((santri) => (
                          <div 
                            key={santri.santriId} 
                            className="flex items-center justify-between p-2 rounded-lg border bg-card hover-elevate"
                            data-testid={`item-santri-${santri.santriId}`}
                          >
                            <div className="flex-1">
                              <p className="font-medium">{santri.namaSantri}</p>
                              <p className="text-sm text-muted-foreground">Kelas: {santri.kelas}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Dialog Absensi */}
      <Dialog open={showAbsensiDialog} onOpenChange={setShowAbsensiDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="dialog-absensi">
          <DialogHeader>
            <DialogTitle>Form Absensi Santri</DialogTitle>
            <DialogDescription>
              Isi absensi untuk semua santri di halaqah yang dipilih
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="tanggal">Tanggal</Label>
                <Input
                  id="tanggal"
                  type="date"
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  data-testid="input-tanggal-absensi"
                />
              </div>
              
              <div>
                <Label htmlFor="marhalah">Marhalah</Label>
                <Select value={selectedMarhalah} onValueChange={setSelectedMarhalah}>
                  <SelectTrigger data-testid="select-marhalah-absensi">
                    <SelectValue placeholder="Pilih Marhalah" />
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
              
              <div>
                <Label htmlFor="waktu">Waktu</Label>
                <Select value={selectedWaktu} onValueChange={setSelectedWaktu}>
                  <SelectTrigger data-testid="select-waktu-absensi">
                    <SelectValue placeholder="Pilih Waktu" />
                  </SelectTrigger>
                  <SelectContent>
                    {lookups?.waktu.map((w) => (
                      <SelectItem key={w.WaktuID} value={w.WaktuID}>
                        {w.NamaWaktu}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Daftar Santri untuk Absensi */}
            {selectedMarhalah && (
              <div className="space-y-3">
                <p className="text-sm font-medium">Daftar Santri:</p>
                {filteredHalaqah.map((halaqah) => (
                  <Card key={halaqah.halaqahId}>
                    <CardHeader>
                      <CardTitle className="text-base">
                        Halaqah {halaqah.nomorUrutHalaqah} - {halaqah.namaMusammi}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {halaqah.santriList.map((santri) => (
                        <div 
                          key={santri.santriId} 
                          className="flex items-center justify-between gap-4 p-2 border rounded-lg"
                          data-testid={`absensi-row-${santri.santriId}`}
                        >
                          <div className="flex-1">
                            <p className="font-medium text-sm">{santri.namaSantri}</p>
                            <p className="text-xs text-muted-foreground">Kelas: {santri.kelas}</p>
                          </div>
                          <div className="w-40">
                            <Select 
                              value={absensiState[santri.santriId] || ""} 
                              onValueChange={(value) => handleUpdateAbsensi(santri.santriId, value)}
                            >
                              <SelectTrigger data-testid={`select-status-${santri.santriId}`}>
                                <SelectValue placeholder="Status" />
                              </SelectTrigger>
                              <SelectContent>
                                {lookups?.kehadiran.map((k) => (
                                  <SelectItem key={k.StatusID} value={k.StatusID}>
                                    {k.NamaStatus}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowAbsensiDialog(false)}
              data-testid="button-cancel-absensi"
            >
              Batal
            </Button>
            <Button 
              onClick={handleSubmitAbsensi}
              disabled={submitAbsensiMutation.isPending || Object.keys(absensiState).length === 0}
              data-testid="button-submit-absensi"
            >
              {submitAbsensiMutation.isPending ? 'Menyimpan...' : 'Simpan Absensi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
