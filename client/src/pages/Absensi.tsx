import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AbsensiFilters from "@/components/AbsensiFilters";
import AbsensiGroup from "@/components/AbsensiGroup";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Halaqah, Musammi, Santri, HalaqahMembers, BatchAbsensi } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

interface HalaqahWithMembers {
  halaqah: Halaqah;
  musammi: Musammi;
  santriList: Santri[];
}

interface AbsensiState {
  halaqahId: string;
  musammiId: string;
  musammiStatus: string;
  santriStatuses: Map<string, string>;
}

export default function Absensi() {
  const { toast } = useToast();
  const [marhalah, setMarhalah] = useState("MUT");
  const [waktu, setWaktu] = useState("SUBUH");
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [absensiState, setAbsensiState] = useState<AbsensiState[]>([]);

  // Fetch halaqah for selected marhalah
  const { data: halaqahList, isLoading: loadingHalaqah } = useQuery<Halaqah[]>({
    queryKey: ['/api/halaqah', marhalah],
    enabled: !!marhalah,
  });

  // Fetch all musammi
  const { data: allMusammi } = useQuery<Musammi[]>({
    queryKey: ['/api/musammi'],
  });

  // Fetch all santri (we'll filter by active later)
  const { data: allSantri } = useQuery<Santri[]>({
    queryKey: ['/api/santri'],
  });

  // Fetch halaqah members for all halaqah (in production, this should be optimized)
  const [halaqahWithMembers, setHalaqahWithMembers] = useState<HalaqahWithMembers[]>([]);

  useEffect(() => {
    const fetchMembers = async () => {
      if (!halaqahList || !allMusammi || !allSantri) return;

      const combined: HalaqahWithMembers[] = [];
      
      for (const halaqah of halaqahList) {
        try {
          // Fetch members for this halaqah
          const response = await fetch(`/api/halaqah-members?halaqahId=${halaqah.HalaqahID}`);
          const members: HalaqahMembers[] = await response.json();
          
          // Get active members only
          const activeMembers = members.filter(m => !m.TanggalSelesai);
          
          // Get santri details
          const santriList = activeMembers
            .map(m => allSantri.find(s => s.SantriID === m.SantriID))
            .filter((s): s is Santri => s !== undefined);
          
          // Get musammi
          const musammi = allMusammi.find(m => m.MusammiID === halaqah.MusammiID);
          
          if (musammi) {
            combined.push({
              halaqah,
              musammi,
              santriList
            });
          }
        } catch (error) {
          console.error(`Error fetching members for halaqah ${halaqah.HalaqahID}:`, error);
        }
      }

      setHalaqahWithMembers(combined);

      // Initialize absensi state with default "HADIR"
      const initialState: AbsensiState[] = combined.map(h => ({
        halaqahId: h.halaqah.HalaqahID,
        musammiId: h.musammi.MusammiID,
        musammiStatus: 'HADIR',
        santriStatuses: new Map(h.santriList.map(s => [s.SantriID, 'HADIR']))
      }));
      setAbsensiState(initialState);
    };

    fetchMembers();
  }, [halaqahList, allMusammi, allSantri]);

  const handleStatusChange = (halaqahId: string, personId: string, status: string, type: 'musammi' | 'santri') => {
    setAbsensiState(prev => prev.map(state => {
      if (state.halaqahId === halaqahId) {
        if (type === 'musammi') {
          return { ...state, musammiStatus: status };
        } else {
          const newStatuses = new Map(state.santriStatuses);
          newStatuses.set(personId, status);
          return { ...state, santriStatuses: newStatuses };
        }
      }
      return state;
    }));
  };

  const batchAbsensiMutation = useMutation({
    mutationFn: async (data: BatchAbsensi) => {
      const res = await apiRequest('POST', '/api/absensi/batch', data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Absensi Berhasil Disimpan",
        description: `Data absensi untuk ${marhalah === 'MUT' ? 'Mutawassitoh' : 'Aliyah'} - ${waktu === 'SUBUH' ? 'Shubuh' : waktu === 'ASHAR' ? 'Ashar' : 'Isya'} telah disimpan`,
      });
      // Reset to default HADIR
      setAbsensiState(prev => prev.map(state => ({
        ...state,
        musammiStatus: 'HADIR',
        santriStatuses: new Map(Array.from(state.santriStatuses.keys()).map(id => [id, 'HADIR']))
      })));
    },
    onError: (error: Error) => {
      toast({
        title: "Gagal Menyimpan Absensi",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleSubmit = () => {
    const musammiData = absensiState.map(state => ({
      halaqahId: state.halaqahId,
      musammiId: state.musammiId,
      statusId: state.musammiStatus as any,
      keterangan: ''
    }));

    const santriData = absensiState.flatMap(state => 
      Array.from(state.santriStatuses.entries()).map(([santriId, statusId]) => ({
        halaqahId: state.halaqahId,
        santriId,
        statusId: statusId as any,
        keterangan: ''
      }))
    );

    const batchData: BatchAbsensi = {
      tanggal,
      marhalahId: marhalah as any,
      waktuId: waktu as any,
      musammi: musammiData,
      santri: santriData
    };

    batchAbsensiMutation.mutate(batchData);
  };

  const handleMarkAllHadir = () => {
    setAbsensiState(prev => prev.map(state => ({
      ...state,
      musammiStatus: 'HADIR',
      santriStatuses: new Map(Array.from(state.santriStatuses.keys()).map(id => [id, 'HADIR']))
    })));
    toast({
      title: "Semua Ditandai Hadir",
      description: "Semua musammi dan santri telah ditandai hadir"
    });
  };

  if (loadingHalaqah) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-96" />
          <Skeleton className="h-5 w-full max-w-2xl mt-2" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Absensi Halaqah</h1>
        <p className="text-muted-foreground mt-2">
          Catat kehadiran musammi dan santri untuk setiap halaqah
        </p>
      </div>

      <AbsensiFilters
        marhalah={marhalah}
        waktu={waktu}
        tanggal={tanggal}
        onMarhalahChange={(value) => {
          setMarhalah(value);
          setAbsensiState([]);
        }}
        onWaktuChange={setWaktu}
        onTanggalChange={setTanggal}
      />

      <div className="flex justify-end gap-2">
        <Button 
          variant="outline" 
          onClick={handleMarkAllHadir}
          data-testid="button-mark-all-hadir"
        >
          Tandai Semua Hadir
        </Button>
      </div>

      {halaqahWithMembers.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              Tidak ada halaqah yang ditemukan untuk marhalah {marhalah === 'MUT' ? 'Mutawassitoh' : 'Aliyah'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {halaqahWithMembers.map((h, index) => {
            const state = absensiState.find(s => s.halaqahId === h.halaqah.HalaqahID);
            if (!state) return null;

            return (
              <AbsensiGroup
                key={h.halaqah.HalaqahID}
                halaqahNo={h.halaqah.NomorUrutHalaqah}
                musammi={{
                  id: h.musammi.MusammiID,
                  nama: h.musammi.NamaMusammi,
                  kelas: h.musammi.KelasMusammi,
                  status: state.musammiStatus
                }}
                santri={h.santriList.map(s => ({
                  id: s.SantriID,
                  nama: s.NamaSantri,
                  kelas: s.Kelas,
                  status: state.santriStatuses.get(s.SantriID) || 'HADIR'
                }))}
                onStatusChange={(personId, status, type) => 
                  handleStatusChange(h.halaqah.HalaqahID, personId, status, type)
                }
              />
            );
          })}
        </div>
      )}

      <div className="flex justify-end">
        <Button 
          onClick={handleSubmit} 
          size="lg" 
          data-testid="button-submit-absensi"
          disabled={batchAbsensiMutation.isPending || halaqahWithMembers.length === 0}
        >
          {batchAbsensiMutation.isPending ? 'Menyimpan...' : 'Submit Absensi'}
        </Button>
      </div>
    </div>
  );
}
