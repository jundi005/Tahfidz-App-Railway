import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueries } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Calendar, AlertCircle, Plus, Upload, Trash2, Pencil } from "lucide-react";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Fallback data jika API lookups error
const FALLBACK_LOOKUPS: LookupsResponse = {
  marhalah: [
    { MarhalahID: "MUT", NamaMarhalah: "Mutawassitoh" },
    { MarhalahID: "ALI", NamaMarhalah: "Aliyah" },
    { MarhalahID: "JAM", NamaMarhalah: "Jami'iyyah" }
  ],
  waktu: [
    { WaktuID: "SUBUH", NamaWaktu: "Subuh" },
    { WaktuID: "DHUHA", NamaWaktu: "Dhuha" },
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

// Interface untuk data row pada tabel tambah halaqah
interface HalaqahRow {
  id: string;
  namaSantri: string;
  marhalahSantri: string;
  kelasSantri: string;
  nomorUrutHalaqah: string;
  namaMusammi: string;
  marhalahMusammi: string;
  kelasMusammi: string;
}

export default function HalaqohPagi() {
  const { toast } = useToast();
  const [selectedMarhalah, setSelectedMarhalah] = useState<string>("");
  const [absensiMarhalah, setAbsensiMarhalah] = useState<string>("");
  const [selectedWaktu, setSelectedWaktu] = useState<string>("DHUHA");
  const [tanggal, setTanggal] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showAbsensiDialog, setShowAbsensiDialog] = useState(false);
  const [showTambahDialog, setShowTambahDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingHalaqahId, setEditingHalaqahId] = useState<string>("");
  const [editingMarhalahHalaqah, setEditingMarhalahHalaqah] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State untuk menyimpan status absensi setiap santri dan musammi
  const [absensiState, setAbsensiState] = useState<Record<string, string>>({});
  const [musammiAbsensiState, setMusammiAbsensiState] = useState<Record<string, string>>({});
  
  // State untuk konfirmasi hapus
  const [deleteHalaqahDialog, setDeleteHalaqahDialog] = useState<{open: boolean, halaqahId: string, nomorUrut: number}>({open: false, halaqahId: '', nomorUrut: 0});
  const [deleteMemberDialog, setDeleteMemberDialog] = useState<{open: boolean, halaqahId: string, santriId: string, namaSantri: string}>({open: false, halaqahId: '', santriId: '', namaSantri: ''});
  
  // State untuk data tabel tambah halaqah
  const [halaqahRows, setHalaqahRows] = useState<HalaqahRow[]>([
    {
      id: crypto.randomUUID(),
      namaSantri: "",
      marhalahSantri: "",
      kelasSantri: "",
      nomorUrutHalaqah: "",
      namaMusammi: "",
      marhalahMusammi: "",
      kelasMusammi: "",
    }
  ]);

  // State untuk data tabel edit halaqah
  const [editHalaqahRows, setEditHalaqahRows] = useState<HalaqahRow[]>([]);

  // Fetch lookups
  const { data: lookupsData, isLoading: loadingLookups, isError: errorLookups } = useQuery<LookupsResponse>({
    queryKey: ['/api/lookups'],
    retry: 2,
  });
  
  // Gunakan fallback data jika API error
  const lookups = errorLookups ? FALLBACK_LOOKUPS : lookupsData;

  // Fetch all halaqah pagi
  const { data: allHalaqah, isLoading: loadingHalaqah } = useQuery<Halaqah[]>({
    queryKey: ['/api/halaqah', 'PAGI'],
    queryFn: async () => {
      const response = await fetch('/api/halaqah?jenis=PAGI');
      if (!response.ok) throw new Error('Failed to fetch halaqah');
      const data = await response.json() as Halaqah[];
      
      // SAFETY FILTER: Filter di frontend juga untuk memastikan hanya halaqah PAGI
      // Ini untuk handle jika Google Apps Script belum memfilter dengan benar
      const filteredData = data.filter(h => h.JenisHalaqah === 'PAGI');
      
      console.log('🔍 Halaqoh Pagi - Data dari server:', data.length, 'halaqah');
      console.log('🔍 Halaqoh Pagi - Setelah filter PAGI:', filteredData.length, 'halaqah');
      if (data.length > 0 && filteredData.length === 0) {
        console.warn('⚠️ WARNING: Server mengirim halaqah tapi tidak ada yang JenisHalaqah=PAGI!');
        console.warn('⚠️ Silakan perbaiki Google Apps Script untuk memfilter berdasarkan parameter jenis');
      }
      
      return filteredData;
    },
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
  
  // Gunakan useQueries untuk fetch members secara parallel dengan jumlah yang dynamic
  const membersResults = useQueries({
    queries: halaqahIds.map(halaqahId => ({
      queryKey: ['/api/halaqah-members', halaqahId],
      queryFn: async () => {
        const response = await fetch(`/api/halaqah-members?halaqahId=${halaqahId}`);
        if (!response.ok) throw new Error('Failed to fetch members');
        return response.json() as Promise<HalaqahMembers[]>;
      },
      enabled: !!halaqahId,
    }))
  });

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
    if (!selectedMarhalah || selectedMarhalah === "all") return halaqahWithDetails;
    return halaqahWithDetails.filter(h => h.marhalahId === selectedMarhalah);
  }, [halaqahWithDetails, selectedMarhalah]);

  // Initialize default "HADIR" for new musammi and santri when data loads or marhalah changes
  useEffect(() => {
    if (absensiMarhalah && absensiMarhalah !== "all" && halaqahWithDetails.length > 0) {
      const filteredForAbsensi = halaqahWithDetails.filter(h => h.marhalahId === absensiMarhalah);
      
      // Collect required IDs
      const requiredHalaqahIds = new Set<string>();
      const requiredSantriIds = new Set<string>();
      filteredForAbsensi.forEach(halaqah => {
        requiredHalaqahIds.add(halaqah.halaqahId);
        halaqah.santriList.forEach(santri => {
          requiredSantriIds.add(santri.santriId);
        });
      });
      
      // Merge with existing state - only add missing keys, preserve existing values
      setMusammiAbsensiState(prev => {
        const next = { ...prev };
        Array.from(requiredHalaqahIds).forEach(halaqahId => {
          if (!(halaqahId in next)) {
            next[halaqahId] = "HADIR";
          }
        });
        return next;
      });
      
      setAbsensiState(prev => {
        const next = { ...prev };
        Array.from(requiredSantriIds).forEach(santriId => {
          if (!(santriId in next)) {
            next[santriId] = "HADIR";
          }
        });
        return next;
      });
    }
  }, [absensiMarhalah, halaqahWithDetails]);

  // Fungsi untuk menambah baris baru
  const addNewRow = () => {
    setHalaqahRows([...halaqahRows, {
      id: crypto.randomUUID(),
      namaSantri: "",
      marhalahSantri: "",
      kelasSantri: "",
      nomorUrutHalaqah: "",
      namaMusammi: "",
      marhalahMusammi: "",
      kelasMusammi: "",
    }]);
  };

  // Fungsi untuk menghapus baris
  const deleteRow = (id: string) => {
    if (halaqahRows.length === 1) {
      toast({
        title: "Peringatan",
        description: "Minimal harus ada 1 baris",
        variant: "destructive"
      });
      return;
    }
    setHalaqahRows(halaqahRows.filter(row => row.id !== id));
  };

  // Fungsi untuk update field di row tertentu
  const updateRow = (id: string, field: keyof HalaqahRow, value: string) => {
    setHalaqahRows(halaqahRows.map(row => {
      if (row.id === id) {
        const updated = { ...row, [field]: value };
        
        // Reset kelas jika marhalah berubah
        if (field === 'marhalahSantri' && row.marhalahSantri !== value) {
          updated.kelasSantri = "";
        }
        if (field === 'marhalahMusammi' && row.marhalahMusammi !== value) {
          updated.kelasMusammi = "";
        }
        
        return updated;
      }
      return row;
    }));
  };

  // Helper function untuk mapping marhalah name ke ID
  const mapMarhalahToId = (marhalahInput: string): string => {
    if (!marhalahInput) return "";
    
    const normalized = marhalahInput.trim().toUpperCase();
    
    // Cek apakah sudah dalam format ID yang valid
    if (normalized === 'MUT' || normalized === 'ALI' || normalized === 'JAM') {
      return normalized;
    }
    
    // Mapping dari nama lengkap atau alias ke ID
    if (normalized.includes('MUTAWASSITOH') || normalized === 'MTS') {
      return 'MUT';
    }
    if (normalized.includes('ALIYAH') || normalized === 'MA' || normalized === 'ALI') {
      return 'ALI';
    }
    if (normalized.includes('JAMI') || normalized.includes("JAMI'")) {
      return 'JAM';
    }
    
    // Cek apakah cocok dengan nama di lookups
    const matchedMarhalah = lookups?.marhalah.find(
      m => m.NamaMarhalah.toUpperCase() === normalized
    );
    
    if (matchedMarhalah) {
      return matchedMarhalah.MarhalahID;
    }
    
    // Return empty string jika tidak cocok (bukan nilai asli)
    return "";
  };

  // Helper function untuk validasi kelas berdasarkan marhalah
  const validateAndGetKelas = (kelasInput: string, marhalahId: string): string => {
    if (!kelasInput || !lookups || !marhalahId) return "";
    
    const normalizedInput = kelasInput.trim();
    
    // Cek apakah kelas valid untuk marhalah ini (exact match)
    const exactMatch = lookups.kelas.find(
      k => k.MarhalahID === marhalahId && k.Kelas === normalizedInput
    );
    
    if (exactMatch) return normalizedInput;
    
    // Cek case-insensitive exact match
    const caseInsensitiveMatch = lookups.kelas.find(
      k => k.MarhalahID === marhalahId && 
      k.Kelas.toLowerCase() === normalizedInput.toLowerCase()
    );
    
    if (caseInsensitiveMatch) return caseInsensitiveMatch.Kelas;
    
    // Return empty string jika tidak ada yang cocok
    return "";
  };

  // Fungsi untuk handle upload CSV
  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        // Split by newline and trim CRLF
        const lines = text.split(/\r?\n/).filter(line => line.trim());
        
        // Skip header
        const dataLines = lines.slice(1);
        
        const newRows: HalaqahRow[] = [];
        const errors: string[] = [];
        const warnings: string[] = [];
        
        dataLines.forEach((line, index) => {
          // Trim the line first
          const trimmedLine = line.trim();
          if (!trimmedLine) return;
          
          const columns = trimmedLine.split(',').map(item => item.trim());
          
          // Validasi jumlah kolom
          if (columns.length !== 7) {
            errors.push(`Baris ${index + 2}: Expected 7 columns, got ${columns.length}`);
            return;
          }
          
          const [namaSantri, kelasSantriRaw, marhalahSantriRaw, nomorUrutHalaqah, namaMusammi, marhalahMusammiRaw, kelasMusammiRaw] = columns;
          
          // Validasi nomor halaqah
          const nomorParsed = parseInt(nomorUrutHalaqah);
          if (isNaN(nomorParsed) || nomorParsed <= 0) {
            errors.push(`Baris ${index + 2}: Nomor halaqah "${nomorUrutHalaqah}" tidak valid`);
            return;
          }
          
          // Map marhalah ke ID yang benar
          const marhalahSantri = mapMarhalahToId(marhalahSantriRaw);
          const marhalahMusammi = mapMarhalahToId(marhalahMusammiRaw);
          
          // Validasi marhalah
          if (!marhalahSantri && marhalahSantriRaw) {
            warnings.push(`Baris ${index + 2}: Marhalah santri "${marhalahSantriRaw}" tidak dikenali (gunakan MUT atau ALI), akan dikosongkan`);
          }
          if (!marhalahMusammi && marhalahMusammiRaw) {
            warnings.push(`Baris ${index + 2}: Marhalah musammi "${marhalahMusammiRaw}" tidak dikenali (gunakan MUT atau ALI), akan dikosongkan`);
          }
          
          // Validasi dan map kelas
          const kelasSantri = validateAndGetKelas(kelasSantriRaw, marhalahSantri);
          const kelasMusammi = validateAndGetKelas(kelasMusammiRaw, marhalahMusammi);
          
          if (kelasSantriRaw && !kelasSantri) {
            warnings.push(`Baris ${index + 2}: Kelas santri "${kelasSantriRaw}" tidak valid untuk marhalah ${marhalahSantri || 'yang dipilih'}, akan dikosongkan`);
          }
          if (kelasMusammiRaw && !kelasMusammi) {
            warnings.push(`Baris ${index + 2}: Kelas musammi "${kelasMusammiRaw}" tidak valid untuk marhalah ${marhalahMusammi || 'yang dipilih'}, akan dikosongkan`);
          }
          
          newRows.push({
            id: crypto.randomUUID(),
            namaSantri: namaSantri || "",
            marhalahSantri: marhalahSantri || "",
            kelasSantri: kelasSantri || "",
            nomorUrutHalaqah: nomorUrutHalaqah || "",
            namaMusammi: namaMusammi || "",
            marhalahMusammi: marhalahMusammi || "",
            kelasMusammi: kelasMusammi || "",
          });
        });

        if (errors.length > 0) {
          toast({
            title: "Peringatan",
            description: `${errors.length} baris gagal dimuat. ${errors.slice(0, 3).join('; ')}`,
            variant: "destructive"
          });
        }
        
        if (warnings.length > 0 && newRows.length > 0) {
          toast({
            title: "Data Dimuat dengan Penyesuaian",
            description: `${newRows.length} baris dimuat. ${warnings.length} penyesuaian dilakukan. Periksa data sebelum menyimpan.`,
          });
        } else if (newRows.length > 0) {
          toast({
            title: "Berhasil",
            description: `${newRows.length} baris data berhasil dimuat dari CSV`
          });
        }
        
        if (newRows.length > 0) {
          setHalaqahRows(newRows);
        } else if (errors.length === 0) {
          toast({
            title: "Gagal",
            description: "Tidak ada data yang valid dalam file CSV",
            variant: "destructive"
          });
        }
      } catch (error) {
        toast({
          title: "Gagal",
          description: "Format CSV tidak valid",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Mutation untuk submit data halaqah
  const submitHalaqahMutation = useMutation({
    mutationFn: async (rows: HalaqahRow[]) => {
      // Validasi data
      for (const row of rows) {
        if (!row.namaSantri || !row.marhalahSantri || !row.kelasSantri || 
            !row.nomorUrutHalaqah || !row.namaMusammi || !row.marhalahMusammi || !row.kelasMusammi) {
          throw new Error('Semua field harus diisi');
        }
        
        // Validasi nomor halaqah harus angka positif
        const nomorHalaqah = parseInt(row.nomorUrutHalaqah);
        if (isNaN(nomorHalaqah) || nomorHalaqah <= 0) {
          throw new Error(`Nomor halaqah harus berupa angka positif untuk santri ${row.namaSantri}`);
        }
      }

      // Gunakan batch endpoint - kirim semua data sekaligus!
      const batchData = {
        rows: rows.map(row => ({
          namaSantri: row.namaSantri,
          marhalahSantri: row.marhalahSantri,
          kelasSantri: row.kelasSantri,
          nomorUrutHalaqah: parseInt(row.nomorUrutHalaqah),
          namaMusammi: row.namaMusammi,
          marhalahMusammi: row.marhalahMusammi,
          kelasMusammi: row.kelasMusammi,
        })),
        jenisHalaqah: "PAGI",
      };

      const response = await apiRequest('POST', '/api/halaqah/batch', batchData);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Berhasil",
        description: "Data halaqah berhasil disimpan"
      });
      setShowTambahDialog(false);
      setHalaqahRows([{
        id: crypto.randomUUID(),
        namaSantri: "",
        marhalahSantri: "",
        kelasSantri: "",
        nomorUrutHalaqah: "",
        namaMusammi: "",
        marhalahMusammi: "",
        kelasMusammi: "",
      }]);
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/halaqah'] });
      queryClient.invalidateQueries({ queryKey: ['/api/santri'] });
      queryClient.invalidateQueries({ queryKey: ['/api/musammi'] });
      queryClient.invalidateQueries({ queryKey: ['/api/halaqah-members'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Gagal",
        description: error.message,
        variant: "destructive"
      });
    }
  });

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
      setMusammiAbsensiState({});
    },
    onError: (error: Error) => {
      toast({ 
        title: "Gagal", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });

  // Mutation untuk hapus halaqah
  const deleteHalaqahMutation = useMutation({
    mutationFn: async (halaqahId: string) => {
      return await apiRequest('DELETE', `/api/halaqah/${halaqahId}`);
    },
    onSuccess: () => {
      toast({ 
        title: "Berhasil", 
        description: "Halaqah berhasil dihapus" 
      });
      setDeleteHalaqahDialog({open: false, halaqahId: '', nomorUrut: 0});
      queryClient.invalidateQueries({ queryKey: ['/api/halaqah'] });
      queryClient.invalidateQueries({ queryKey: ['/api/halaqah-members'] });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Gagal", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });

  // Mutation untuk hapus member dari halaqah
  const deleteMemberMutation = useMutation({
    mutationFn: async ({halaqahId, santriId}: {halaqahId: string, santriId: string}) => {
      return await apiRequest('DELETE', `/api/halaqah-members/${halaqahId}/${santriId}`);
    },
    onSuccess: () => {
      toast({ 
        title: "Berhasil", 
        description: "Santri berhasil dihapus dari halaqah" 
      });
      setDeleteMemberDialog({open: false, halaqahId: '', santriId: '', namaSantri: ''});
      queryClient.invalidateQueries({ queryKey: ['/api/halaqah-members'] });
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

  const handleUpdateMusammiAbsensi = (halaqahId: string, statusId: string) => {
    setMusammiAbsensiState(prev => ({
      ...prev,
      [halaqahId]: statusId,
    }));
  };

  const handleSubmitAbsensi = () => {
    // Validasi marhalah harus MUT (Halaqoh Pagi hanya untuk Mutawassitoh)
    if (!absensiMarhalah || absensiMarhalah !== "MUT") {
      toast({
        title: "Error",
        description: "Halaqoh Pagi hanya untuk marhalah Mutawassitoh",
        variant: "destructive"
      });
      return;
    }
    
    if (!selectedWaktu) {
      toast({
        title: "Error",
        description: "Pilih waktu terlebih dahulu",
        variant: "destructive"
      });
      return;
    }

    // Get halaqah for the selected marhalah only
    const filteredForAbsensi = halaqahWithDetails.filter(h => h.marhalahId === absensiMarhalah);

    // Build musammi absensi list - only for selected marhalah
    const musammiAbsensi = filteredForAbsensi.map(halaqahDetail => {
      const halaqah = allHalaqah?.find(h => h.HalaqahID === halaqahDetail.halaqahId);
      if (!halaqah) return null;
      
      const statusId = musammiAbsensiState[halaqahDetail.halaqahId] || "HADIR";
      
      return {
        halaqahId: halaqahDetail.halaqahId,
        musammiId: halaqah.MusammiID,
        statusId: statusId as any,
        keterangan: '',
      };
    }).filter((item): item is NonNullable<typeof item> => item !== null);

    // Build santri absensi list - only for selected marhalah
    const santriAbsensi = filteredForAbsensi.flatMap(halaqahDetail => 
      halaqahDetail.santriList.map(santri => ({
        halaqahId: halaqahDetail.halaqahId,
        santriId: santri.santriId,
        statusId: (absensiState[santri.santriId] || "HADIR") as any,
        keterangan: '',
      }))
    );

    const batchData: BatchAbsensi = {
      tanggal,
      marhalahId: absensiMarhalah as any,
      waktuId: selectedWaktu as any,
      jenisHalaqah: "PAGI",
      musammi: musammiAbsensi,
      santri: santriAbsensi,
    };

    submitAbsensiMutation.mutate(batchData);
  };

  // ========== FUNGSI UNTUK EDIT HALAQAH ==========
  
  // Fungsi untuk membuka dialog edit dan load data halaqah
  const handleOpenEditDialog = (halaqahId: string) => {
    const halaqah = allHalaqah?.find(h => h.HalaqahID === halaqahId);
    const halaqahDetail = halaqahWithDetails.find(h => h.halaqahId === halaqahId);
    
    if (!halaqah || !halaqahDetail) {
      toast({
        title: "Error",
        description: "Data halaqah tidak ditemukan",
        variant: "destructive"
      });
      return;
    }

    const musammi = allMusammi?.find(m => m.MusammiID === halaqah.MusammiID);
    
    // Build rows dari santri yang ada di halaqah
    const rows: HalaqahRow[] = halaqahDetail.santriList.map(santri => {
      const santriData = allSantri?.find(s => s.SantriID === santri.santriId);
      return {
        id: crypto.randomUUID(),
        namaSantri: santri.namaSantri,
        marhalahSantri: santriData?.MarhalahID || halaqah.MarhalahID,
        kelasSantri: santri.kelas,
        nomorUrutHalaqah: String(halaqah.NomorUrutHalaqah),
        namaMusammi: musammi?.NamaMusammi || '',
        marhalahMusammi: musammi?.MarhalahID || halaqah.MarhalahID,
        kelasMusammi: musammi?.KelasMusammi || halaqah.KelasMusammi,
      };
    });

    // Jika tidak ada santri, buat 1 row kosong dengan data musammi
    if (rows.length === 0) {
      rows.push({
        id: crypto.randomUUID(),
        namaSantri: "",
        marhalahSantri: halaqah.MarhalahID,
        kelasSantri: "",
        nomorUrutHalaqah: String(halaqah.NomorUrutHalaqah),
        namaMusammi: musammi?.NamaMusammi || '',
        marhalahMusammi: musammi?.MarhalahID || halaqah.MarhalahID,
        kelasMusammi: musammi?.KelasMusammi || halaqah.KelasMusammi,
      });
    }

    setEditHalaqahRows(rows);
    setEditingHalaqahId(halaqahId);
    setEditingMarhalahHalaqah(halaqah.MarhalahID);
    setShowEditDialog(true);
  };

  // Fungsi untuk update field di edit row
  const updateEditRow = (id: string, field: keyof HalaqahRow, value: string) => {
    setEditHalaqahRows(editHalaqahRows.map(row => {
      if (row.id === id) {
        const updated = { ...row, [field]: value };
        
        // Reset kelas jika marhalah berubah
        if (field === 'marhalahSantri' && row.marhalahSantri !== value) {
          updated.kelasSantri = "";
        }
        if (field === 'marhalahMusammi' && row.marhalahMusammi !== value) {
          updated.kelasMusammi = "";
        }
        
        return updated;
      }
      return row;
    }));
  };

  // Fungsi untuk menambah baris baru di edit
  const addNewEditRow = () => {
    const lastRow = editHalaqahRows[editHalaqahRows.length - 1];
    setEditHalaqahRows([...editHalaqahRows, {
      id: crypto.randomUUID(),
      namaSantri: "",
      marhalahSantri: lastRow?.marhalahSantri || "",
      kelasSantri: "",
      nomorUrutHalaqah: lastRow?.nomorUrutHalaqah || "",
      namaMusammi: lastRow?.namaMusammi || "",
      marhalahMusammi: lastRow?.marhalahMusammi || "",
      kelasMusammi: lastRow?.kelasMusammi || "",
    }]);
  };

  // Fungsi untuk menghapus baris di edit
  const deleteEditRow = (id: string) => {
    if (editHalaqahRows.length === 1) {
      toast({
        title: "Peringatan",
        description: "Minimal harus ada 1 baris",
        variant: "destructive"
      });
      return;
    }
    setEditHalaqahRows(editHalaqahRows.filter(row => row.id !== id));
  };

  // Mutation untuk submit edit halaqah
  const submitEditHalaqahMutation = useMutation({
    mutationFn: async (rows: HalaqahRow[]) => {
      // Validasi data
      for (const row of rows) {
        if (!row.nomorUrutHalaqah || !row.namaMusammi || !row.marhalahMusammi || !row.kelasMusammi) {
          throw new Error('Data musammi harus diisi lengkap');
        }
        
        // Untuk row yang ada santri, validasi juga data santri
        if (row.namaSantri && (!row.marhalahSantri || !row.kelasSantri)) {
          throw new Error(`Data santri ${row.namaSantri} harus diisi lengkap`);
        }
      }

      const firstRow = rows[0];
      const halaqah = allHalaqah?.find(h => h.HalaqahID === editingHalaqahId);
      
      if (!halaqah) {
        throw new Error('Halaqah tidak ditemukan');
      }

      // Update atau create musammi
      let musammiId: string = halaqah.MusammiID;
      const existingMusammi = allMusammi?.find(
        m => m.NamaMusammi === firstRow.namaMusammi && m.MarhalahID === firstRow.marhalahMusammi
      );
      
      if (existingMusammi) {
        musammiId = existingMusammi.MusammiID;
        // Update musammi jika kelasnya berbeda
        if (existingMusammi.KelasMusammi !== firstRow.kelasMusammi) {
          await apiRequest('PUT', `/api/musammi/${musammiId}`, {
            KelasMusammi: firstRow.kelasMusammi,
          });
        }
      } else {
        // Create musammi baru
        const response = await apiRequest('POST', '/api/musammi', {
          NamaMusammi: firstRow.namaMusammi,
          MarhalahID: firstRow.marhalahMusammi,
          KelasMusammi: firstRow.kelasMusammi,
        });
        const newMusammi = await response.json();
        musammiId = newMusammi.MusammiID;
      }

      // Update halaqah
      await apiRequest('PUT', `/api/halaqah/${editingHalaqahId}`, {
        NomorUrutHalaqah: parseInt(firstRow.nomorUrutHalaqah),
        MarhalahID: editingMarhalahHalaqah,
        MusammiID: musammiId,
        KelasMusammi: firstRow.kelasMusammi,
      });

      // Get existing members
      const existingMembersResponse = await fetch(`/api/halaqah-members?halaqahId=${editingHalaqahId}`);
      const existingMembers: HalaqahMembers[] = await existingMembersResponse.json();
      const existingMemberIds = new Set(existingMembers.map(m => m.SantriID));

      // Process santri
      const newMemberIds = new Set<string>();
      
      for (const row of rows) {
        if (!row.namaSantri) continue; // Skip empty rows
        
        // Find or create santri
        let santriId: string | undefined;
        const existingSantri = allSantri?.find(
          s => s.NamaSantri === row.namaSantri && s.MarhalahID === row.marhalahSantri && s.Kelas === row.kelasSantri
        );
        
        if (existingSantri) {
          santriId = existingSantri.SantriID;
        } else {
          const response = await apiRequest('POST', '/api/santri', {
            NamaSantri: row.namaSantri,
            MarhalahID: row.marhalahSantri,
            Kelas: row.kelasSantri,
            Aktif: true,
          });
          const newSantri = await response.json();
          santriId = newSantri.SantriID;
        }

        if (!santriId) continue;

        newMemberIds.add(santriId);

        // Add to halaqah if not already a member
        if (!existingMemberIds.has(santriId)) {
          await apiRequest('POST', '/api/halaqah-members', {
            HalaqahID: editingHalaqahId,
            SantriID: santriId,
            TanggalMulai: new Date().toISOString().split('T')[0],
            JenisHalaqah: "PAGI",
          });
        }
      }

      // Remove members that are no longer in the list
      for (const member of existingMembers) {
        if (!newMemberIds.has(member.SantriID)) {
          await apiRequest('DELETE', `/api/halaqah-members/${editingHalaqahId}/${member.SantriID}`);
        }
      }
    },
    onSuccess: () => {
      toast({ 
        title: "Berhasil", 
        description: "Data halaqah berhasil diperbarui" 
      });
      setShowEditDialog(false);
      setEditingHalaqahId("");
      setEditingMarhalahHalaqah("");
      setEditHalaqahRows([]);
      queryClient.invalidateQueries({ queryKey: ['/api/halaqah'] });
      queryClient.invalidateQueries({ queryKey: ['/api/musammi'] });
      queryClient.invalidateQueries({ queryKey: ['/api/santri'] });
      queryClient.invalidateQueries({ queryKey: ['/api/halaqah-members'] });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Gagal", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });

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
          <h1 className="text-3xl font-bold" data-testid="title-halaqoh-pagi">Halaqoh Pagi</h1>
          <p className="text-muted-foreground mt-2">
            Kelola data halaqoh pagi (waktu Dhuha) dan absensi santri
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => setShowTambahDialog(true)}
            data-testid="button-open-tambah-halaqah-pagi"
          >
            <Plus className="h-4 w-4 mr-2" />
            Tambah Halaqoh Pagi
          </Button>
          <Button 
            onClick={() => setShowAbsensiDialog(true)}
            data-testid="button-open-absensi-pagi"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Isi Absensi
          </Button>
        </div>
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

      {/* Filter Marhalah - Halaqoh Pagi hanya untuk Mutawassitoh */}
      <div className="flex gap-4 items-center">
        <div className="w-48">
          <Label>Filter Marhalah</Label>
          <Select value={selectedMarhalah} onValueChange={setSelectedMarhalah}>
            <SelectTrigger data-testid="select-filter-marhalah">
              <SelectValue placeholder="Semua Marhalah" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Marhalah</SelectItem>
              {lookups?.marhalah.filter(m => m.MarhalahID === 'MUT').map((m) => (
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
                Tidak ada data halaqoh pagi
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
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleOpenEditDialog(halaqah.halaqahId)}
                      data-testid={`button-edit-halaqah-${halaqah.halaqahId}`}
                    >
                      <Pencil className="h-4 w-4 text-primary" />
                    </Button>
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
                            className="p-2 rounded-lg border bg-card hover-elevate"
                            data-testid={`item-santri-${santri.santriId}`}
                          >
                            <p className="font-medium">{santri.namaSantri}</p>
                            <p className="text-sm text-muted-foreground">Kelas: {santri.kelas}</p>
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
            <DialogTitle>Form Absensi Halaqoh Pagi (Dhuha)</DialogTitle>
            <DialogDescription>
              Isi absensi untuk musammi dan santri di halaqoh pagi yang dipilih
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
                <Select value={absensiMarhalah} onValueChange={setAbsensiMarhalah}>
                  <SelectTrigger data-testid="select-marhalah-absensi">
                    <SelectValue placeholder="Pilih Marhalah" />
                  </SelectTrigger>
                  <SelectContent>
                    {lookups?.marhalah.filter(m => m.MarhalahID === 'MUT').map((m) => (
                      <SelectItem key={m.MarhalahID} value={m.MarhalahID}>
                        {m.NamaMarhalah}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="waktu">Waktu (Halaqoh Pagi hanya Dhuha)</Label>
                <Select value={selectedWaktu} onValueChange={setSelectedWaktu}>
                  <SelectTrigger data-testid="select-waktu-absensi">
                    <SelectValue placeholder="Pilih Waktu" />
                  </SelectTrigger>
                  <SelectContent>
                    {lookups?.waktu.filter(w => w.WaktuID === 'DHUHA').map((w) => (
                      <SelectItem key={w.WaktuID} value={w.WaktuID}>
                        {w.NamaWaktu}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Daftar Musammi dan Santri untuk Absensi */}
            {absensiMarhalah && (
              <div className="space-y-3">
                <p className="text-sm font-medium">Daftar Musammi dan Santri:</p>
                {halaqahWithDetails
                  .filter(h => h.marhalahId === absensiMarhalah)
                  .map((halaqah) => (
                  <Card key={halaqah.halaqahId}>
                    <CardHeader>
                      <CardTitle className="text-base">
                        Halaqah {halaqah.nomorUrutHalaqah} - {halaqah.namaMusammi}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Absensi Musammi */}
                      <div className="border-b pb-3">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Musammi:</p>
                        <div 
                          className="flex items-center justify-between gap-4 p-2 border rounded-lg bg-accent/20"
                          data-testid={`absensi-musammi-${halaqah.halaqahId}`}
                        >
                          <div className="flex-1">
                            <p className="font-medium text-sm">{halaqah.namaMusammi}</p>
                            <p className="text-xs text-muted-foreground">Pembimbing</p>
                          </div>
                          <div className="w-40">
                            <Select 
                              value={musammiAbsensiState[halaqah.halaqahId] || "HADIR"} 
                              onValueChange={(value) => handleUpdateMusammiAbsensi(halaqah.halaqahId, value)}
                            >
                              <SelectTrigger data-testid={`select-status-musammi-${halaqah.halaqahId}`}>
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
                      </div>

                      {/* Absensi Santri */}
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">Santri:</p>
                        <div className="space-y-2">
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
                                  value={absensiState[santri.santriId] || "HADIR"} 
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
                        </div>
                      </div>
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

      {/* Dialog Tambah Halaqah */}
      <Dialog open={showTambahDialog} onOpenChange={setShowTambahDialog}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto" data-testid="dialog-tambah-halaqah">
          <DialogHeader>
            <DialogTitle>Tambah Data Halaqoh Pagi</DialogTitle>
            <DialogDescription>
              Isi data halaqoh pagi secara manual atau upload file CSV
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Button Upload CSV dan Tambah Baris */}
            <div className="flex gap-2 justify-between items-center">
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleCSVUpload}
                  data-testid="input-csv-file"
                />
                <Button 
                  variant="outline" 
                  onClick={() => fileInputRef.current?.click()}
                  data-testid="button-upload-csv"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload CSV
                </Button>
                <Button 
                  variant="outline" 
                  onClick={addNewRow}
                  data-testid="button-add-row"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Baris
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Format CSV: Nama Santri, Kelas Santri, Marhalah Santri, Nomor Halaqah, Nama Musammi, Marhalah Musammi, Kelas Musammi
              </p>
            </div>

            {/* Tabel Input */}
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">Nama Santri</TableHead>
                    <TableHead className="min-w-[120px]">Marhalah Santri</TableHead>
                    <TableHead className="min-w-[120px]">Kelas Santri</TableHead>
                    <TableHead className="min-w-[120px]">No. Halaqah</TableHead>
                    <TableHead className="min-w-[150px]">Nama Musammi</TableHead>
                    <TableHead className="min-w-[130px]">Marhalah Musammi</TableHead>
                    <TableHead className="min-w-[120px]">Kelas Musammi</TableHead>
                    <TableHead className="w-[60px]">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {halaqahRows.map((row) => {
                    const kelasOptionsSantri = lookups?.kelas.filter(
                      k => k.MarhalahID === row.marhalahSantri
                    ) || [];
                    const kelasOptionsMusammi = lookups?.kelas.filter(
                      k => k.MarhalahID === row.marhalahMusammi
                    ) || [];

                    return (
                      <TableRow key={row.id} data-testid={`row-halaqah-input-${row.id}`}>
                        <TableCell>
                          <Input
                            value={row.namaSantri}
                            onChange={(e) => updateRow(row.id, 'namaSantri', e.target.value)}
                            placeholder="Nama santri"
                            data-testid={`input-nama-santri-${row.id}`}
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={row.marhalahSantri}
                            onValueChange={(value) => updateRow(row.id, 'marhalahSantri', value)}
                          >
                            <SelectTrigger data-testid={`select-marhalah-santri-${row.id}`}>
                              <SelectValue placeholder="Pilih" />
                            </SelectTrigger>
                            <SelectContent>
                              {lookups?.marhalah.filter(m => m.MarhalahID === 'MUT').map((m) => (
                                <SelectItem key={m.MarhalahID} value={m.MarhalahID}>
                                  {m.NamaMarhalah}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={row.kelasSantri}
                            onValueChange={(value) => updateRow(row.id, 'kelasSantri', value)}
                            disabled={!row.marhalahSantri}
                          >
                            <SelectTrigger data-testid={`select-kelas-santri-${row.id}`}>
                              <SelectValue placeholder="Pilih" />
                            </SelectTrigger>
                            <SelectContent>
                              {kelasOptionsSantri.map((k) => (
                                <SelectItem key={k.Kelas} value={k.Kelas}>
                                  {k.Kelas}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            value={row.nomorUrutHalaqah}
                            onChange={(e) => updateRow(row.id, 'nomorUrutHalaqah', e.target.value)}
                            placeholder="Nomor"
                            type="number"
                            data-testid={`input-nomor-halaqah-${row.id}`}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={row.namaMusammi}
                            onChange={(e) => updateRow(row.id, 'namaMusammi', e.target.value)}
                            placeholder="Nama musammi"
                            data-testid={`input-nama-musammi-${row.id}`}
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={row.marhalahMusammi}
                            onValueChange={(value) => updateRow(row.id, 'marhalahMusammi', value)}
                          >
                            <SelectTrigger data-testid={`select-marhalah-musammi-${row.id}`}>
                              <SelectValue placeholder="Pilih" />
                            </SelectTrigger>
                            <SelectContent>
                              {lookups?.marhalah.map((m) => (
                                <SelectItem key={m.MarhalahID} value={m.MarhalahID}>
                                  {m.NamaMarhalah}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={row.kelasMusammi}
                            onValueChange={(value) => updateRow(row.id, 'kelasMusammi', value)}
                            disabled={!row.marhalahMusammi}
                          >
                            <SelectTrigger data-testid={`select-kelas-musammi-${row.id}`}>
                              <SelectValue placeholder="Pilih" />
                            </SelectTrigger>
                            <SelectContent>
                              {kelasOptionsMusammi.map((k) => (
                                <SelectItem key={k.Kelas} value={k.Kelas}>
                                  {k.Kelas}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteRow(row.id)}
                            data-testid={`button-delete-row-${row.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowTambahDialog(false)}
              data-testid="button-cancel-tambah"
            >
              Batal
            </Button>
            <Button 
              onClick={() => submitHalaqahMutation.mutate(halaqahRows)}
              disabled={submitHalaqahMutation.isPending}
              data-testid="button-submit-tambah"
            >
              {submitHalaqahMutation.isPending ? 'Menyimpan...' : 'Simpan Data'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Edit Halaqah */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto" data-testid="dialog-edit-halaqah">
          <DialogHeader>
            <DialogTitle>Edit Data Halaqoh Pagi</DialogTitle>
            <DialogDescription>
              Edit data musammi, anggota halaqoh pagi, dan kelasnya
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Select Marhalah Halaqah */}
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium min-w-[120px]">Marhalah Halaqah:</label>
              <Select
                value={editingMarhalahHalaqah}
                onValueChange={setEditingMarhalahHalaqah}
              >
                <SelectTrigger className="w-[200px]" data-testid="select-edit-marhalah-halaqah">
                  <SelectValue placeholder="Pilih marhalah" />
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

            {/* Button Tambah Baris */}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={addNewEditRow}
                data-testid="button-add-edit-row"
              >
                <Plus className="h-4 w-4 mr-2" />
                Tambah Anggota
              </Button>
            </div>

            {/* Tabel Input Edit */}
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">Nama Santri</TableHead>
                    <TableHead className="min-w-[120px]">Marhalah Santri</TableHead>
                    <TableHead className="min-w-[120px]">Kelas Santri</TableHead>
                    <TableHead className="min-w-[120px]">No. Halaqah</TableHead>
                    <TableHead className="min-w-[150px]">Nama Musammi</TableHead>
                    <TableHead className="min-w-[130px]">Marhalah Musammi</TableHead>
                    <TableHead className="min-w-[120px]">Kelas Musammi</TableHead>
                    <TableHead className="w-[60px]">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {editHalaqahRows.map((row) => {
                    const kelasOptionsSantri = lookups?.kelas.filter(
                      k => k.MarhalahID === row.marhalahSantri
                    ) || [];
                    const kelasOptionsMusammi = lookups?.kelas.filter(
                      k => k.MarhalahID === row.marhalahMusammi
                    ) || [];

                    return (
                      <TableRow key={row.id} data-testid={`row-edit-halaqah-${row.id}`}>
                        <TableCell>
                          <Input
                            value={row.namaSantri}
                            onChange={(e) => updateEditRow(row.id, 'namaSantri', e.target.value)}
                            placeholder="Nama santri"
                            data-testid={`input-edit-nama-santri-${row.id}`}
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={row.marhalahSantri}
                            onValueChange={(value) => updateEditRow(row.id, 'marhalahSantri', value)}
                          >
                            <SelectTrigger data-testid={`select-edit-marhalah-santri-${row.id}`}>
                              <SelectValue placeholder="Pilih" />
                            </SelectTrigger>
                            <SelectContent>
                              {lookups?.marhalah.filter(m => m.MarhalahID !== 'JAM').map((m) => (
                                <SelectItem key={m.MarhalahID} value={m.MarhalahID}>
                                  {m.NamaMarhalah}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={row.kelasSantri}
                            onValueChange={(value) => updateEditRow(row.id, 'kelasSantri', value)}
                            disabled={!row.marhalahSantri}
                          >
                            <SelectTrigger data-testid={`select-edit-kelas-santri-${row.id}`}>
                              <SelectValue placeholder="Pilih" />
                            </SelectTrigger>
                            <SelectContent>
                              {kelasOptionsSantri.map((k) => (
                                <SelectItem key={k.Kelas} value={k.Kelas}>
                                  {k.Kelas}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            value={row.nomorUrutHalaqah}
                            onChange={(e) => updateEditRow(row.id, 'nomorUrutHalaqah', e.target.value)}
                            placeholder="Nomor"
                            type="number"
                            data-testid={`input-edit-nomor-halaqah-${row.id}`}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={row.namaMusammi}
                            onChange={(e) => updateEditRow(row.id, 'namaMusammi', e.target.value)}
                            placeholder="Nama musammi"
                            data-testid={`input-edit-nama-musammi-${row.id}`}
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={row.marhalahMusammi}
                            onValueChange={(value) => updateEditRow(row.id, 'marhalahMusammi', value)}
                          >
                            <SelectTrigger data-testid={`select-edit-marhalah-musammi-${row.id}`}>
                              <SelectValue placeholder="Pilih" />
                            </SelectTrigger>
                            <SelectContent>
                              {lookups?.marhalah.map((m) => (
                                <SelectItem key={m.MarhalahID} value={m.MarhalahID}>
                                  {m.NamaMarhalah}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={row.kelasMusammi}
                            onValueChange={(value) => updateEditRow(row.id, 'kelasMusammi', value)}
                            disabled={!row.marhalahMusammi}
                          >
                            <SelectTrigger data-testid={`select-edit-kelas-musammi-${row.id}`}>
                              <SelectValue placeholder="Pilih" />
                            </SelectTrigger>
                            <SelectContent>
                              {kelasOptionsMusammi.map((k) => (
                                <SelectItem key={k.Kelas} value={k.Kelas}>
                                  {k.Kelas}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteEditRow(row.id)}
                            data-testid={`button-delete-edit-row-${row.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowEditDialog(false)}
              data-testid="button-cancel-edit"
            >
              Batal
            </Button>
            <Button 
              onClick={() => submitEditHalaqahMutation.mutate(editHalaqahRows)}
              disabled={submitEditHalaqahMutation.isPending}
              data-testid="button-submit-edit"
            >
              {submitEditHalaqahMutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Konfirmasi Hapus Halaqah */}
      <Dialog open={deleteHalaqahDialog.open} onOpenChange={(open) => setDeleteHalaqahDialog({...deleteHalaqahDialog, open})}>
        <DialogContent data-testid="dialog-delete-halaqah">
          <DialogHeader>
            <DialogTitle>Hapus Halaqah?</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus Halaqah {deleteHalaqahDialog.nomorUrut}? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteHalaqahDialog({open: false, halaqahId: '', nomorUrut: 0})}
              data-testid="button-cancel-delete-halaqah"
            >
              Batal
            </Button>
            <Button 
              variant="destructive"
              onClick={() => deleteHalaqahMutation.mutate(deleteHalaqahDialog.halaqahId)}
              disabled={deleteHalaqahMutation.isPending}
              data-testid="button-confirm-delete-halaqah"
            >
              {deleteHalaqahMutation.isPending ? 'Menghapus...' : 'Hapus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Konfirmasi Hapus Santri dari Halaqah */}
      <Dialog open={deleteMemberDialog.open} onOpenChange={(open) => setDeleteMemberDialog({...deleteMemberDialog, open})}>
        <DialogContent data-testid="dialog-delete-member">
          <DialogHeader>
            <DialogTitle>Hapus Santri dari Halaqah?</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus {deleteMemberDialog.namaSantri} dari halaqah ini? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteMemberDialog({open: false, halaqahId: '', santriId: '', namaSantri: ''})}
              data-testid="button-cancel-delete-member"
            >
              Batal
            </Button>
            <Button 
              variant="destructive"
              onClick={() => deleteMemberMutation.mutate({halaqahId: deleteMemberDialog.halaqahId, santriId: deleteMemberDialog.santriId})}
              disabled={deleteMemberMutation.isPending}
              data-testid="button-confirm-delete-member"
            >
              {deleteMemberMutation.isPending ? 'Menghapus...' : 'Hapus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
