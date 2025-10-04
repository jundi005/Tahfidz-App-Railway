import {
  type Halaqah,
  type InsertHalaqah,
  type Musammi,
  type InsertMusammi,
  type Santri,
  type InsertSantri,
  type HalaqahMembers,
  type InsertHalaqahMembers,
  type AbsensiSantri,
  type InsertAbsensiSantri,
  type AbsensiMusammi,
  type InsertAbsensiMusammi,
  type BatchAbsensi,
  type HafalanBulanan,
  type InsertHafalanBulanan,
  type MurojaahBulanan,
  type InsertMurojaahBulanan,
  type PenambahanHafalan,
  type InsertPenambahanHafalan,
  type Tasks,
  type InsertTasks,
  type DashboardStats,
  type LookupsResponse,
  type AbsensiReportResponse,
} from "@shared/schema";

export interface IStorage {
  // Lookups
  getLookups(): Promise<LookupsResponse>;

  // Halaqah
  getHalaqah(id: string): Promise<Halaqah | undefined>;
  getAllHalaqah(marhalahId?: string, jenisHalaqah?: string): Promise<Halaqah[]>;
  createHalaqah(halaqah: InsertHalaqah): Promise<Halaqah>;
  updateHalaqah(id: string, halaqah: Partial<InsertHalaqah>): Promise<Halaqah>;
  deleteHalaqah(id: string): Promise<void>;

  // Musammi
  getMusammi(id: string): Promise<Musammi | undefined>;
  getAllMusammi(marhalahId?: string): Promise<Musammi[]>;
  createMusammi(musammi: InsertMusammi): Promise<Musammi>;
  updateMusammi(id: string, musammi: Partial<InsertMusammi>): Promise<Musammi>;
  deleteMusammi(id: string): Promise<void>;

  // Santri
  getSantri(id: string): Promise<Santri | undefined>;
  getAllSantri(marhalahId?: string, aktif?: boolean): Promise<Santri[]>;
  createSantri(santri: InsertSantri): Promise<Santri>;
  updateSantri(id: string, santri: Partial<InsertSantri>): Promise<Santri>;
  deleteSantri(id: string): Promise<void>;

  // HalaqahMembers
  getHalaqahMembers(halaqahId: string): Promise<HalaqahMembers[]>;
  createHalaqahMember(member: InsertHalaqahMembers): Promise<HalaqahMembers>;
  updateHalaqahMember(
    halaqahId: string,
    santriId: string,
    member: Partial<InsertHalaqahMembers>,
  ): Promise<HalaqahMembers>;
  deleteHalaqahMember(halaqahId: string, santriId: string): Promise<void>;

  // Absensi
  batchCreateAbsensi(
    data: BatchAbsensi,
  ): Promise<{ musammi: AbsensiMusammi[]; santri: AbsensiSantri[] }>;
  getAbsensiSantri(
    tanggal: string,
    marhalahId?: string,
    waktuId?: string,
    jenisHalaqah?: string,
  ): Promise<AbsensiSantri[]>;
  getAbsensiMusammi(
    tanggal: string,
    marhalahId?: string,
    waktuId?: string,
    jenisHalaqah?: string,
  ): Promise<AbsensiMusammi[]>;
  getAbsensiReport(
    tanggalDari?: string,
    tanggalSampai?: string,
    marhalahId?: string,
    kelas?: string,
    peran?: string,
    jenisHalaqah?: string,
  ): Promise<AbsensiReportResponse>;

  // Hafalan
  getHafalanBulanan(
    bulan: string,
    marhalahId?: string,
    jenisHalaqah?: string,
  ): Promise<HafalanBulanan[]>;
  createHafalanBulanan(hafalan: InsertHafalanBulanan): Promise<HafalanBulanan>;
  batchCreateHafalanBulanan(
    hafalan: InsertHafalanBulanan[],
  ): Promise<HafalanBulanan[]>;
  updateHafalanBulanan(
    id: string,
    hafalan: Partial<InsertHafalanBulanan>,
  ): Promise<HafalanBulanan>;
  deleteHafalanBulanan(id: string): Promise<void>;

  // Murojaah
  getMurojaahBulanan(
    bulan: string,
    marhalahId?: string,
    jenisHalaqah?: string,
  ): Promise<MurojaahBulanan[]>;
  createMurojaahBulanan(
    murojaah: InsertMurojaahBulanan,
  ): Promise<MurojaahBulanan>;
  batchCreateMurojaahBulanan(
    murojaah: InsertMurojaahBulanan[],
  ): Promise<MurojaahBulanan[]>;
  updateMurojaahBulanan(
    id: string,
    murojaah: Partial<InsertMurojaahBulanan>,
  ): Promise<MurojaahBulanan>;
  deleteMurojaahBulanan(id: string): Promise<void>;

  // Penambahan Hafalan
  getPenambahanHafalan(
    bulan?: string,
    marhalahId?: string,
    jenisHalaqah?: string,
  ): Promise<PenambahanHafalan[]>;
  createPenambahanHafalan(
    penambahan: InsertPenambahanHafalan,
  ): Promise<PenambahanHafalan>;
  batchCreatePenambahanHafalan(
    penambahan: InsertPenambahanHafalan[],
  ): Promise<PenambahanHafalan[]>;

  // Tasks
  getTasks(status?: string): Promise<Tasks[]>;
  createTask(task: InsertTasks): Promise<Tasks>;
  updateTask(id: string, task: Partial<InsertTasks>): Promise<Tasks>;
  deleteTask(id: string): Promise<void>;

  // Dashboard
  getDashboardStats(): Promise<DashboardStats>;
}

// Google Sheets Storage Implementation
export class GoogleSheetsStorage implements IStorage {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    const url =
      baseUrl ||
      process.env.GOOGLE_APPS_SCRIPT_URL ||
      "https://script.google.com/macros/s/AKfycbyLp_0XuL5OVQOzwuqzg5vrdijdhnb9Gsf8g08uhbPUupmKCydvQrdpgMRAa0bv6qtYHg/exec";

    if (!url || url.trim() === "") {
      throw new Error(
        "GOOGLE_APPS_SCRIPT_URL environment variable is required. " +
          "Please set it to your Google Apps Script web app URL.",
      );
    }

    // Validate that it's a valid URL
    try {
      new URL(url);
      this.baseUrl = url;
    } catch (error) {
      throw new Error(
        `Invalid GOOGLE_APPS_SCRIPT_URL: ${url}. ` +
          "Please provide a valid URL for your Google Apps Script web app.",
      );
    }
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit & { allowUndefined?: boolean },
  ): Promise<T> {
    // Parse endpoint to extract path, ID (if present), and query parameters
    const [pathPart, queryString] = endpoint.split("?");

    // Remove leading slash and split path to extract ID if present
    const cleanPath = pathPart.replace(/^\//, "");
    const pathSegments = cleanPath.split("/");

    // Build URL with path as query parameter for Google Apps Script
    const url = new URL(this.baseUrl);

    // Set the base path (without ID)
    if (pathSegments.length === 1) {
      // Simple path like 'lookups' or 'halaqah'
      url.searchParams.set("path", pathSegments[0]);
    } else if (pathSegments.length === 2) {
      // Path with ID like 'halaqah/123' or path with subpath like 'dashboard/stats'
      const firstSegment = pathSegments[0];
      const secondSegment = pathSegments[1];

      // Resources that have IDs
      const resourcesWithIds = [
        "halaqah",
        "musammi",
        "santri",
        "hafalan",
        "murojaah",
        "tasks",
      ];

      // Check if this is a batch endpoint
      if (secondSegment === "batch") {
        // This is a batch endpoint like 'hafalan/batch', 'murojaah/batch', 'penambahan/batch'
        url.searchParams.set("path", cleanPath);
      } else if (resourcesWithIds.includes(firstSegment)) {
        // This is a resource with an ID
        url.searchParams.set("path", firstSegment);
        url.searchParams.set("id", secondSegment);
      } else {
        // This is a subpath like 'dashboard/stats' or 'absensi/santri'
        url.searchParams.set("path", cleanPath);
      }
    } else if (pathSegments.length === 3) {
      // Path like 'halaqah-members/halaqahId/santriId'
      url.searchParams.set("path", pathSegments[0]);
      url.searchParams.set("id", pathSegments[1]);
      url.searchParams.set("santriId", pathSegments[2]);
    } else {
      // Fallback: use the full clean path
      url.searchParams.set("path", cleanPath);
    }

    // Add any additional query parameters from the endpoint
    if (queryString) {
      const params = new URLSearchParams(queryString);
      params.forEach((value, key) => {
        url.searchParams.set(key, value);
      });
    }

    // Google Apps Script only supports GET and POST
    // Convert PUT and DELETE to POST with method override
    const actualMethod = options?.method || "GET";
    let fetchOptions = { ...options };

    if (actualMethod === "PUT" || actualMethod === "DELETE") {
      url.searchParams.set("_method", actualMethod);
      fetchOptions.method = "POST";
    }

    const response = await fetch(url.toString(), {
      ...fetchOptions,
      headers: {
        "Content-Type": "application/json",
        ...fetchOptions?.headers,
      },
    });

    // Google Apps Script always returns 200 OK, error info is in JSON body
    const data = await response.json();

    // Google Apps Script returns { error, code } for errors
    if (data && typeof data === "object" && "error" in data) {
      if (data.code === 404 && options?.allowUndefined) {
        return undefined as T;
      }
      throw new Error(data.error);
    }

    // Google Apps Script returns { success, message } for DELETE operations
    if (data && typeof data === "object" && "success" in data && data.success) {
      return undefined as T;
    }

    return data;
  }

  async getLookups(): Promise<LookupsResponse> {
    return this.request<LookupsResponse>("/lookups");
  }

  async getHalaqah(id: string): Promise<Halaqah | undefined> {
    return this.request<Halaqah>(`/halaqah/${id}`, { allowUndefined: true });
  }

  async getAllHalaqah(marhalahId?: string, jenisHalaqah?: string): Promise<Halaqah[]> {
    const params = new URLSearchParams();
    if (marhalahId) params.append("marhalah", marhalahId);
    if (jenisHalaqah) params.append("jenis", jenisHalaqah);
    const query = params.toString() ? `?${params.toString()}` : "";
    return this.request<Halaqah[]>(`/halaqah${query}`);
  }

  async createHalaqah(halaqah: InsertHalaqah): Promise<Halaqah> {
    return this.request<Halaqah>("/halaqah", {
      method: "POST",
      body: JSON.stringify(halaqah),
    });
  }

  async updateHalaqah(
    id: string,
    halaqah: Partial<InsertHalaqah>,
  ): Promise<Halaqah> {
    return this.request<Halaqah>(`/halaqah/${id}`, {
      method: "PUT",
      body: JSON.stringify(halaqah),
    });
  }

  async deleteHalaqah(id: string): Promise<void> {
    await this.request(`/halaqah/${id}`, { method: "DELETE" });
  }

  async getMusammi(id: string): Promise<Musammi | undefined> {
    return this.request<Musammi>(`/musammi/${id}`, { allowUndefined: true });
  }

  async getAllMusammi(marhalahId?: string): Promise<Musammi[]> {
    const query = marhalahId ? `?marhalah=${marhalahId}` : "";
    return this.request<Musammi[]>(`/musammi${query}`);
  }

  async createMusammi(musammi: InsertMusammi): Promise<Musammi> {
    return this.request<Musammi>("/musammi", {
      method: "POST",
      body: JSON.stringify(musammi),
    });
  }

  async updateMusammi(
    id: string,
    musammi: Partial<InsertMusammi>,
  ): Promise<Musammi> {
    return this.request<Musammi>(`/musammi/${id}`, {
      method: "PUT",
      body: JSON.stringify(musammi),
    });
  }

  async deleteMusammi(id: string): Promise<void> {
    await this.request(`/musammi/${id}`, { method: "DELETE" });
  }

  async getSantri(id: string): Promise<Santri | undefined> {
    return this.request<Santri>(`/santri/${id}`, { allowUndefined: true });
  }

  async getAllSantri(marhalahId?: string, aktif?: boolean): Promise<Santri[]> {
    const params = new URLSearchParams();
    if (marhalahId) params.append("marhalah", marhalahId);
    if (aktif !== undefined) params.append("aktif", aktif.toString());
    const query = params.toString() ? `?${params.toString()}` : "";
    return this.request<Santri[]>(`/santri${query}`);
  }

  async createSantri(santri: InsertSantri): Promise<Santri> {
    return this.request<Santri>("/santri", {
      method: "POST",
      body: JSON.stringify(santri),
    });
  }

  async updateSantri(
    id: string,
    santri: Partial<InsertSantri>,
  ): Promise<Santri> {
    return this.request<Santri>(`/santri/${id}`, {
      method: "PUT",
      body: JSON.stringify(santri),
    });
  }

  async deleteSantri(id: string): Promise<void> {
    await this.request(`/santri/${id}`, { method: "DELETE" });
  }

  async getHalaqahMembers(halaqahId: string): Promise<HalaqahMembers[]> {
    return this.request<HalaqahMembers[]>(
      `/halaqah-members?halaqahId=${halaqahId}`,
    );
  }

  async createHalaqahMember(
    member: InsertHalaqahMembers,
  ): Promise<HalaqahMembers> {
    return this.request<HalaqahMembers>("/halaqah-members", {
      method: "POST",
      body: JSON.stringify(member),
    });
  }

  async updateHalaqahMember(
    halaqahId: string,
    santriId: string,
    member: Partial<InsertHalaqahMembers>,
  ): Promise<HalaqahMembers> {
    return this.request<HalaqahMembers>(
      `/halaqah-members/${halaqahId}/${santriId}`,
      {
        method: "PUT",
        body: JSON.stringify(member),
      },
    );
  }

  async deleteHalaqahMember(
    halaqahId: string,
    santriId: string,
  ): Promise<void> {
    await this.request(`/halaqah-members/${halaqahId}/${santriId}`, {
      method: "DELETE",
    });
  }

  async batchCreateAbsensi(
    data: BatchAbsensi,
  ): Promise<{ musammi: AbsensiMusammi[]; santri: AbsensiSantri[] }> {
    return this.request<{ musammi: AbsensiMusammi[]; santri: AbsensiSantri[] }>(
      "/absensi/batch",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    );
  }

  async getAbsensiSantri(
    tanggal: string,
    marhalahId?: string,
    waktuId?: string,
    jenisHalaqah?: string,
  ): Promise<AbsensiSantri[]> {
    const params = new URLSearchParams({ tanggal });
    if (marhalahId) params.append("marhalah", marhalahId);
    if (waktuId) params.append("waktu", waktuId);
    if (jenisHalaqah) params.append("jenis", jenisHalaqah);
    return this.request<AbsensiSantri[]>(
      `/absensi/santri?${params.toString()}`,
    );
  }

  async getAbsensiMusammi(
    tanggal: string,
    marhalahId?: string,
    waktuId?: string,
    jenisHalaqah?: string,
  ): Promise<AbsensiMusammi[]> {
    const params = new URLSearchParams({ tanggal });
    if (marhalahId) params.append("marhalah", marhalahId);
    if (waktuId) params.append("waktu", waktuId);
    if (jenisHalaqah) params.append("jenis", jenisHalaqah);
    return this.request<AbsensiMusammi[]>(
      `/absensi/musammi?${params.toString()}`,
    );
  }

  async getAbsensiReport(
    tanggalDari?: string,
    tanggalSampai?: string,
    marhalahId?: string,
    kelas?: string,
    peran?: string,
    jenisHalaqah?: string,
  ): Promise<AbsensiReportResponse> {
    const params = new URLSearchParams();
    if (tanggalDari) params.append("tanggalDari", tanggalDari);
    if (tanggalSampai) params.append("tanggalSampai", tanggalSampai);
    if (marhalahId) params.append("marhalah", marhalahId);
    if (kelas) params.append("kelas", kelas);
    if (peran) params.append("peran", peran);
    if (jenisHalaqah) params.append("jenis", jenisHalaqah);
    const queryString = params.toString();
    return this.request<AbsensiReportResponse>(
      queryString ? `/absensi/report?${queryString}` : `/absensi/report`,
    );
  }

  async getHafalanBulanan(
    bulan: string,
    marhalahId?: string,
    jenisHalaqah?: string,
  ): Promise<HafalanBulanan[]> {
    const params = new URLSearchParams({ bulan });
    if (marhalahId) params.append("marhalah", marhalahId);
    if (jenisHalaqah) params.append("jenis", jenisHalaqah);
    return this.request<HafalanBulanan[]>(`/hafalan?${params.toString()}`);
  }

  async createHafalanBulanan(
    hafalan: InsertHafalanBulanan,
  ): Promise<HafalanBulanan> {
    return this.request<HafalanBulanan>("/hafalan", {
      method: "POST",
      body: JSON.stringify(hafalan),
    });
  }

  async batchCreateHafalanBulanan(
    hafalan: InsertHafalanBulanan[],
  ): Promise<HafalanBulanan[]> {
    return this.request<HafalanBulanan[]>("/hafalan/batch", {
      method: "POST",
      body: JSON.stringify({ data: hafalan }),
    });
  }

  async updateHafalanBulanan(
    id: string,
    hafalan: Partial<InsertHafalanBulanan>,
  ): Promise<HafalanBulanan> {
    return this.request<HafalanBulanan>(`/hafalan/${id}`, {
      method: "PUT",
      body: JSON.stringify(hafalan),
    });
  }

  async deleteHafalanBulanan(id: string): Promise<void> {
    await this.request(`/hafalan/${id}`, { method: "DELETE" });
  }

  async getMurojaahBulanan(
    bulan: string,
    marhalahId?: string,
    jenisHalaqah?: string,
  ): Promise<MurojaahBulanan[]> {
    const params = new URLSearchParams({ bulan });
    if (marhalahId) params.append("marhalah", marhalahId);
    if (jenisHalaqah) params.append("jenis", jenisHalaqah);
    return this.request<MurojaahBulanan[]>(`/murojaah?${params.toString()}`);
  }

  async createMurojaahBulanan(
    murojaah: InsertMurojaahBulanan,
  ): Promise<MurojaahBulanan> {
    return this.request<MurojaahBulanan>("/murojaah", {
      method: "POST",
      body: JSON.stringify(murojaah),
    });
  }

  async batchCreateMurojaahBulanan(
    murojaah: InsertMurojaahBulanan[],
  ): Promise<MurojaahBulanan[]> {
    return this.request<MurojaahBulanan[]>("/murojaah/batch", {
      method: "POST",
      body: JSON.stringify({ data: murojaah }),
    });
  }

  async updateMurojaahBulanan(
    id: string,
    murojaah: Partial<InsertMurojaahBulanan>,
  ): Promise<MurojaahBulanan> {
    return this.request<MurojaahBulanan>(`/murojaah/${id}`, {
      method: "PUT",
      body: JSON.stringify(murojaah),
    });
  }

  async deleteMurojaahBulanan(id: string): Promise<void> {
    await this.request(`/murojaah/${id}`, { method: "DELETE" });
  }

  async getPenambahanHafalan(
    bulan?: string,
    marhalahId?: string,
    jenisHalaqah?: string,
  ): Promise<PenambahanHafalan[]> {
    const params = new URLSearchParams();
    if (bulan) params.append("bulan", bulan);
    if (marhalahId) params.append("marhalah", marhalahId);
    if (jenisHalaqah) params.append("jenis", jenisHalaqah);
    const queryString = params.toString();
    return this.request<PenambahanHafalan[]>(
      queryString ? `/penambahan?${queryString}` : "/penambahan",
    );
  }

  async createPenambahanHafalan(
    penambahan: InsertPenambahanHafalan,
  ): Promise<PenambahanHafalan> {
    return this.request<PenambahanHafalan>("/penambahan", {
      method: "POST",
      body: JSON.stringify(penambahan),
    });
  }

  async batchCreatePenambahanHafalan(
    penambahan: InsertPenambahanHafalan[],
  ): Promise<PenambahanHafalan[]> {
    return this.request<PenambahanHafalan[]>("/penambahan/batch", {
      method: "POST",
      body: JSON.stringify({ data: penambahan }),
    });
  }

  async getTasks(status?: string): Promise<Tasks[]> {
    const query = status ? `?status=${status}` : "";
    return this.request<Tasks[]>(`/tasks${query}`);
  }

  async createTask(task: InsertTasks): Promise<Tasks> {
    return this.request<Tasks>("/tasks", {
      method: "POST",
      body: JSON.stringify(task),
    });
  }

  async updateTask(id: string, task: Partial<InsertTasks>): Promise<Tasks> {
    return this.request<Tasks>(`/tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify(task),
    });
  }

  async deleteTask(id: string): Promise<void> {
    await this.request(`/tasks/${id}`, { method: "DELETE" });
  }

  async getDashboardStats(): Promise<DashboardStats> {
    return this.request<DashboardStats>("/dashboard/stats");
  }
}

// In-Memory Storage Implementation for Development
export class MemStorage implements IStorage {
  private halaqah: Map<string, Halaqah> = new Map();
  private musammi: Map<string, Musammi> = new Map();
  private santri: Map<string, Santri> = new Map();
  private halaqahMembers: Map<string, HalaqahMembers[]> = new Map();
  private absensiSantri: AbsensiSantri[] = [];
  private absensiMusammi: AbsensiMusammi[] = [];
  private hafalanBulanan: Map<string, HafalanBulanan> = new Map();
  private murojaahBulanan: Map<string, MurojaahBulanan> = new Map();
  private penambahanHafalan: PenambahanHafalan[] = [];
  private tasks: Map<string, Tasks> = new Map();

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  async getLookups(): Promise<LookupsResponse> {
    return {
      marhalah: [
        { MarhalahID: "MUT", NamaMarhalah: "Mutawassitoh" },
        { MarhalahID: "ALI", NamaMarhalah: "Aliyah" },
        { MarhalahID: "JAM", NamaMarhalah: "Jamii" },
      ],
      waktu: [
        { WaktuID: "SUBUH", NamaWaktu: "Subuh" },
        { WaktuID: "ASHAR", NamaWaktu: "Ashar" },
        { WaktuID: "ISYA", NamaWaktu: "Isya" },
      ],
      kehadiran: [
        { StatusID: "HADIR", NamaStatus: "Hadir" },
        { StatusID: "SAKIT", NamaStatus: "Sakit" },
        { StatusID: "IZIN", NamaStatus: "Izin" },
        { StatusID: "ALPA", NamaStatus: "Alpa" },
        { StatusID: "TERLAMBAT", NamaStatus: "Terlambat" },
      ],
      kelas: [
        { MarhalahID: "MUT", Kelas: "1 Mutawassitoh" },
        { MarhalahID: "MUT", Kelas: "2 Mutawassitoh" },
        { MarhalahID: "MUT", Kelas: "3 Mutawassitoh" },
        { MarhalahID: "ALI", Kelas: "1 Aliyah" },
        { MarhalahID: "ALI", Kelas: "2 Aliyah" },
        { MarhalahID: "ALI", Kelas: "3 Aliyah" },
        { MarhalahID: "JAM", Kelas: "Jamii" },
      ],
    };
  }

  async getHalaqah(id: string): Promise<Halaqah | undefined> {
    return this.halaqah.get(id);
  }

  async getAllHalaqah(marhalahId?: string, jenisHalaqah?: string): Promise<Halaqah[]> {
    let all = Array.from(this.halaqah.values());
    if (marhalahId) {
      all = all.filter((h) => h.MarhalahID === marhalahId);
    }
    if (jenisHalaqah) {
      all = all.filter((h) => h.JenisHalaqah === jenisHalaqah);
    }
    return all;
  }

  async createHalaqah(halaqah: InsertHalaqah): Promise<Halaqah> {
    const id = this.generateId();
    const newHalaqah: Halaqah = { ...halaqah, HalaqahID: id };
    this.halaqah.set(id, newHalaqah);
    return newHalaqah;
  }

  async updateHalaqah(
    id: string,
    halaqah: Partial<InsertHalaqah>,
  ): Promise<Halaqah> {
    const existing = this.halaqah.get(id);
    if (!existing) throw new Error("Halaqah not found");
    const updated = { ...existing, ...halaqah };
    this.halaqah.set(id, updated);
    return updated;
  }

  async deleteHalaqah(id: string): Promise<void> {
    if (!this.halaqah.has(id)) throw new Error("Halaqah not found");
    this.halaqah.delete(id);
  }

  async getMusammi(id: string): Promise<Musammi | undefined> {
    return this.musammi.get(id);
  }

  async getAllMusammi(marhalahId?: string): Promise<Musammi[]> {
    const all = Array.from(this.musammi.values());
    if (marhalahId) {
      return all.filter((m) => m.MarhalahID === marhalahId);
    }
    return all;
  }

  async createMusammi(musammi: InsertMusammi): Promise<Musammi> {
    const id = this.generateId();
    const newMusammi: Musammi = { ...musammi, MusammiID: id };
    this.musammi.set(id, newMusammi);
    return newMusammi;
  }

  async updateMusammi(
    id: string,
    musammi: Partial<InsertMusammi>,
  ): Promise<Musammi> {
    const existing = this.musammi.get(id);
    if (!existing) throw new Error("Musammi not found");
    const updated = { ...existing, ...musammi };
    this.musammi.set(id, updated);
    return updated;
  }

  async deleteMusammi(id: string): Promise<void> {
    if (!this.musammi.has(id)) throw new Error("Musammi not found");
    this.musammi.delete(id);
  }

  async getSantri(id: string): Promise<Santri | undefined> {
    return this.santri.get(id);
  }

  async getAllSantri(marhalahId?: string, aktif?: boolean): Promise<Santri[]> {
    let all = Array.from(this.santri.values());
    if (marhalahId) {
      all = all.filter((s) => s.MarhalahID === marhalahId);
    }
    if (aktif !== undefined) {
      all = all.filter((s) => s.Aktif === aktif);
    }
    return all;
  }

  async createSantri(santri: InsertSantri): Promise<Santri> {
    const id = this.generateId();
    const newSantri: Santri = { ...santri, SantriID: id };
    this.santri.set(id, newSantri);
    return newSantri;
  }

  async updateSantri(
    id: string,
    santri: Partial<InsertSantri>,
  ): Promise<Santri> {
    const existing = this.santri.get(id);
    if (!existing) throw new Error("Santri not found");
    const updated = { ...existing, ...santri };
    this.santri.set(id, updated);
    return updated;
  }

  async deleteSantri(id: string): Promise<void> {
    if (!this.santri.has(id)) throw new Error("Santri not found");
    this.santri.delete(id);
  }

  async getHalaqahMembers(halaqahId: string): Promise<HalaqahMembers[]> {
    return this.halaqahMembers.get(halaqahId) || [];
  }

  async createHalaqahMember(
    member: InsertHalaqahMembers,
  ): Promise<HalaqahMembers> {
    const members = this.halaqahMembers.get(member.HalaqahID) || [];
    members.push(member);
    this.halaqahMembers.set(member.HalaqahID, members);
    return member;
  }

  async updateHalaqahMember(
    halaqahId: string,
    santriId: string,
    member: Partial<InsertHalaqahMembers>,
  ): Promise<HalaqahMembers> {
    const members = this.halaqahMembers.get(halaqahId) || [];
    const index = members.findIndex((m) => m.SantriID === santriId);
    if (index === -1) throw new Error("Halaqah member not found");
    members[index] = { ...members[index], ...member };
    return members[index];
  }

  async deleteHalaqahMember(
    halaqahId: string,
    santriId: string,
  ): Promise<void> {
    const members = this.halaqahMembers.get(halaqahId) || [];
    const filtered = members.filter((m) => m.SantriID !== santriId);
    if (filtered.length === members.length)
      throw new Error("Halaqah member not found");
    this.halaqahMembers.set(halaqahId, filtered);
  }

  async batchCreateAbsensi(
    data: BatchAbsensi,
  ): Promise<{ musammi: AbsensiMusammi[]; santri: AbsensiSantri[] }> {
    const musammiAbsensi: AbsensiMusammi[] = [];
    const santriAbsensi: AbsensiSantri[] = [];

    for (const m of data.musammi) {
      const absensi: AbsensiMusammi = {
        AbsensiMusammiID: this.generateId(),
        Tanggal: data.tanggal,
        MarhalahID: data.marhalahId,
        WaktuID: data.waktuId,
        HalaqahID: m.halaqahId,
        MusammiID: m.musammiId,
        StatusID: m.statusId,
        Keterangan: m.keterangan,
        JenisHalaqah: data.jenisHalaqah || "UTAMA",
      };
      this.absensiMusammi.push(absensi);
      musammiAbsensi.push(absensi);
    }

    for (const s of data.santri) {
      const absensi: AbsensiSantri = {
        AbsensiSantriID: this.generateId(),
        Tanggal: data.tanggal,
        MarhalahID: data.marhalahId,
        WaktuID: data.waktuId,
        HalaqahID: s.halaqahId,
        SantriID: s.santriId,
        StatusID: s.statusId,
        Keterangan: s.keterangan,
        JenisHalaqah: data.jenisHalaqah || "UTAMA",
      };
      this.absensiSantri.push(absensi);
      santriAbsensi.push(absensi);
    }

    return { musammi: musammiAbsensi, santri: santriAbsensi };
  }

  async getAbsensiSantri(
    tanggal: string,
    marhalahId?: string,
    waktuId?: string,
    jenisHalaqah?: string,
  ): Promise<AbsensiSantri[]> {
    let filtered = this.absensiSantri.filter((a) => a.Tanggal === tanggal);
    if (marhalahId)
      filtered = filtered.filter((a) => a.MarhalahID === marhalahId);
    if (waktuId) filtered = filtered.filter((a) => a.WaktuID === waktuId);
    if (jenisHalaqah)
      filtered = filtered.filter((a) => a.JenisHalaqah === jenisHalaqah);
    return filtered;
  }

  async getAbsensiMusammi(
    tanggal: string,
    marhalahId?: string,
    waktuId?: string,
    jenisHalaqah?: string,
  ): Promise<AbsensiMusammi[]> {
    let filtered = this.absensiMusammi.filter((a) => a.Tanggal === tanggal);
    if (marhalahId)
      filtered = filtered.filter((a) => a.MarhalahID === marhalahId);
    if (waktuId) filtered = filtered.filter((a) => a.WaktuID === waktuId);
    if (jenisHalaqah)
      filtered = filtered.filter((a) => a.JenisHalaqah === jenisHalaqah);
    return filtered;
  }

  async getAbsensiReport(
    tanggalDari?: string,
    tanggalSampai?: string,
    marhalahId?: string,
    kelas?: string,
    peran?: string,
    jenisHalaqah?: string,
  ): Promise<AbsensiReportResponse> {
    let reportData: any[] = [];

    if (!peran || peran === "santri" || peran === "all") {
      let santriAbsensi = this.absensiSantri;

      if (tanggalDari && tanggalSampai) {
        santriAbsensi = santriAbsensi.filter(
          (a) => a.Tanggal >= tanggalDari && a.Tanggal <= tanggalSampai,
        );
      } else if (tanggalDari) {
        santriAbsensi = santriAbsensi.filter((a) => a.Tanggal >= tanggalDari);
      } else if (tanggalSampai) {
        santriAbsensi = santriAbsensi.filter((a) => a.Tanggal <= tanggalSampai);
      }

      if (marhalahId) {
        santriAbsensi = santriAbsensi.filter(
          (a) => a.MarhalahID === marhalahId,
        );
      }

      if (jenisHalaqah) {
        santriAbsensi = santriAbsensi.filter(
          (a) => a.JenisHalaqah === jenisHalaqah,
        );
      }

      santriAbsensi.forEach((absen) => {
        const santri = this.santri.get(absen.SantriID);
        if (santri) {
          if (kelas && santri.Kelas !== kelas) return;
          reportData.push({
            id: absen.AbsensiSantriID,
            tanggal: absen.Tanggal,
            marhalahId: absen.MarhalahID,
            waktuId: absen.WaktuID,
            halaqahId: absen.HalaqahID,
            personId: absen.SantriID,
            statusId: absen.StatusID,
            keterangan: absen.Keterangan || "",
            peran: "Santri",
            nama: santri.NamaSantri,
            kelas: santri.Kelas,
          });
        }
      });
    }

    if (!peran || peran === "musammi" || peran === "all") {
      let musammiAbsensi = this.absensiMusammi;

      if (tanggalDari && tanggalSampai) {
        musammiAbsensi = musammiAbsensi.filter(
          (a) => a.Tanggal >= tanggalDari && a.Tanggal <= tanggalSampai,
        );
      } else if (tanggalDari) {
        musammiAbsensi = musammiAbsensi.filter((a) => a.Tanggal >= tanggalDari);
      } else if (tanggalSampai) {
        musammiAbsensi = musammiAbsensi.filter(
          (a) => a.Tanggal <= tanggalSampai,
        );
      }

      if (marhalahId) {
        musammiAbsensi = musammiAbsensi.filter(
          (a) => a.MarhalahID === marhalahId,
        );
      }

      if (jenisHalaqah) {
        musammiAbsensi = musammiAbsensi.filter(
          (a) => a.JenisHalaqah === jenisHalaqah,
        );
      }

      musammiAbsensi.forEach((absen) => {
        const musammi = this.musammi.get(absen.MusammiID);
        if (musammi) {
          if (kelas && musammi.KelasMusammi !== kelas) return;
          reportData.push({
            id: absen.AbsensiMusammiID,
            tanggal: absen.Tanggal,
            marhalahId: absen.MarhalahID,
            waktuId: absen.WaktuID,
            halaqahId: absen.HalaqahID,
            personId: absen.MusammiID,
            statusId: absen.StatusID,
            keterangan: absen.Keterangan || "",
            peran: "Musammi",
            nama: musammi.NamaMusammi,
            kelas: musammi.KelasMusammi,
          });
        }
      });
    }

    const stats = {
      hadir: reportData.filter((a) => a.statusId === "HADIR").length,
      sakit: reportData.filter((a) => a.statusId === "SAKIT").length,
      izin: reportData.filter((a) => a.statusId === "IZIN").length,
      alpa: reportData.filter((a) => a.statusId === "ALPA").length,
      terlambat: reportData.filter((a) => a.statusId === "TERLAMBAT").length,
    };

    return {
      data: reportData,
      stats,
      total: reportData.length,
    };
  }

  async getHafalanBulanan(
    bulan: string,
    marhalahId?: string,
    jenisHalaqah?: string,
  ): Promise<HafalanBulanan[]> {
    let all = Array.from(this.hafalanBulanan.values()).filter(
      (h) => h.Bulan === bulan,
    );
    if (marhalahId) {
      all = all.filter((h) => h.MarhalahID === marhalahId);
    }
    if (jenisHalaqah) {
      all = all.filter((h) => h.JenisHalaqah === jenisHalaqah);
    }
    return all;
  }

  async createHafalanBulanan(
    hafalan: InsertHafalanBulanan,
  ): Promise<HafalanBulanan> {
    const id = this.generateId();
    const newHafalan: HafalanBulanan = { ...hafalan, RekapID: id };
    this.hafalanBulanan.set(id, newHafalan);
    return newHafalan;
  }

  async batchCreateHafalanBulanan(
    hafalan: InsertHafalanBulanan[],
  ): Promise<HafalanBulanan[]> {
    const results: HafalanBulanan[] = [];
    for (const item of hafalan) {
      const created = await this.createHafalanBulanan(item);
      results.push(created);
    }
    return results;
  }

  async updateHafalanBulanan(
    id: string,
    hafalan: Partial<InsertHafalanBulanan>,
  ): Promise<HafalanBulanan> {
    const existing = this.hafalanBulanan.get(id);
    if (!existing) throw new Error("Hafalan not found");
    const updated = { ...existing, ...hafalan };
    this.hafalanBulanan.set(id, updated);
    return updated;
  }

  async deleteHafalanBulanan(id: string): Promise<void> {
    if (!this.hafalanBulanan.has(id)) throw new Error("Hafalan not found");
    this.hafalanBulanan.delete(id);
  }

  async getMurojaahBulanan(
    bulan: string,
    marhalahId?: string,
    jenisHalaqah?: string,
  ): Promise<MurojaahBulanan[]> {
    let all = Array.from(this.murojaahBulanan.values()).filter(
      (m) => m.Bulan === bulan,
    );
    if (marhalahId) {
      all = all.filter((m) => m.MarhalahID === marhalahId);
    }
    if (jenisHalaqah) {
      all = all.filter((m) => m.JenisHalaqah === jenisHalaqah);
    }
    return all;
  }

  async createMurojaahBulanan(
    murojaah: InsertMurojaahBulanan,
  ): Promise<MurojaahBulanan> {
    const id = this.generateId();
    const newMurojaah: MurojaahBulanan = { ...murojaah, MurojaahID: id };
    this.murojaahBulanan.set(id, newMurojaah);
    return newMurojaah;
  }

  async batchCreateMurojaahBulanan(
    murojaah: InsertMurojaahBulanan[],
  ): Promise<MurojaahBulanan[]> {
    const results: MurojaahBulanan[] = [];
    for (const item of murojaah) {
      const created = await this.createMurojaahBulanan(item);
      results.push(created);
    }
    return results;
  }

  async updateMurojaahBulanan(
    id: string,
    murojaah: Partial<InsertMurojaahBulanan>,
  ): Promise<MurojaahBulanan> {
    const existing = this.murojaahBulanan.get(id);
    if (!existing) throw new Error("Murojaah not found");
    const updated = { ...existing, ...murojaah };
    this.murojaahBulanan.set(id, updated);
    return updated;
  }

  async deleteMurojaahBulanan(id: string): Promise<void> {
    if (!this.murojaahBulanan.has(id)) throw new Error("Murojaah not found");
    this.murojaahBulanan.delete(id);
  }

  async getPenambahanHafalan(
    bulan?: string,
    marhalahId?: string,
    jenisHalaqah?: string,
  ): Promise<PenambahanHafalan[]> {
    let result = [...this.penambahanHafalan];

    if (bulan) {
      result = result.filter((p) => p.Bulan === bulan);
    }

    if (marhalahId) {
      result = result.filter((p) => p.MarhalahID === marhalahId);
    }

    if (jenisHalaqah) {
      result = result.filter((p) => p.JenisHalaqah === jenisHalaqah);
    }

    return result;
  }

  async createPenambahanHafalan(
    penambahan: InsertPenambahanHafalan,
  ): Promise<PenambahanHafalan> {
    const newPenambahan: PenambahanHafalan = {
      ...penambahan,
      PenambahanID: this.generateId(),
    };
    this.penambahanHafalan.push(newPenambahan);
    return newPenambahan;
  }

  async batchCreatePenambahanHafalan(
    penambahan: InsertPenambahanHafalan[],
  ): Promise<PenambahanHafalan[]> {
    const results: PenambahanHafalan[] = [];
    for (const item of penambahan) {
      const created = await this.createPenambahanHafalan(item);
      results.push(created);
    }
    return results;
  }

  async getTasks(status?: string): Promise<Tasks[]> {
    let all = Array.from(this.tasks.values());
    if (status) {
      all = all.filter((t) => t.Status === status);
    }
    return all;
  }

  async createTask(task: InsertTasks): Promise<Tasks> {
    const id = this.generateId();
    const newTask: Tasks = { ...task, TaskID: id };
    this.tasks.set(id, newTask);
    return newTask;
  }

  async updateTask(id: string, task: Partial<InsertTasks>): Promise<Tasks> {
    const existing = this.tasks.get(id);
    if (!existing) throw new Error("Task not found");
    const updated = { ...existing, ...task };
    this.tasks.set(id, updated);
    return updated;
  }

  async deleteTask(id: string): Promise<void> {
    if (!this.tasks.has(id)) throw new Error("Task not found");
    this.tasks.delete(id);
  }

  async getDashboardStats(): Promise<DashboardStats> {
    // Get today's date in local timezone (Indonesia)
    const now = new Date();
    const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    const today = localDate.toISOString().split("T")[0];

    // Log for debugging
    console.log("[getDashboardStats] Today date:", today);
    console.log(
      "[getDashboardStats] Total absensi records:",
      this.absensiSantri.length,
    );
    if (this.absensiSantri.length > 0) {
      console.log(
        "[getDashboardStats] Sample absensi dates:",
        this.absensiSantri.slice(0, 3).map((a) => a.Tanggal),
      );
    }
    const totalSantri = Array.from(this.santri.values()).filter(
      (s) => s.Aktif,
    ).length;
    const santriMutawassitoh = Array.from(this.santri.values()).filter(
      (s) => s.Aktif && s.MarhalahID === "MUT",
    ).length;
    const santriAliyah = Array.from(this.santri.values()).filter(
      (s) => s.Aktif && s.MarhalahID === "ALI",
    ).length;

    const totalMusammi = this.musammi.size;
    const musammiAliyah = Array.from(this.musammi.values()).filter(
      (m) => m.MarhalahID === "ALI",
    ).length;
    const musammiJamii = Array.from(this.musammi.values()).filter(
      (m) => m.MarhalahID === "JAM",
    ).length;

    const musammiHalaqahAliyah = Array.from(this.halaqah.values()).filter(
      (h) => h.MarhalahID === "ALI",
    ).length;
    const musammiHalaqahMutawassitoh = Array.from(this.halaqah.values()).filter(
      (h) => h.MarhalahID === "MUT",
    ).length;

    const todayAbsensi = this.absensiSantri.filter((a) => a.Tanggal === today);
    const absensiHariIni = {
      hadir: todayAbsensi.filter((a) => a.StatusID === "HADIR").length,
      sakit: todayAbsensi.filter((a) => a.StatusID === "SAKIT").length,
      izin: todayAbsensi.filter((a) => a.StatusID === "IZIN").length,
      alpa: todayAbsensi.filter((a) => a.StatusID === "ALPA").length,
      terlambat: todayAbsensi.filter((a) => a.StatusID === "TERLAMBAT").length,
    };

    // Calculate attendance for last 7 days
    const absensi7Hari: Array<{
      tanggal: string;
      hadir: number;
      sakit: number;
      izin: number;
      alpa: number;
      terlambat: number;
    }> = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(localDate);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const dayAbsensi = this.absensiSantri.filter(
        (a) => a.Tanggal === dateStr,
      );

      absensi7Hari.push({
        tanggal: dateStr,
        hadir: dayAbsensi.filter((a) => a.StatusID === "HADIR").length,
        sakit: dayAbsensi.filter((a) => a.StatusID === "SAKIT").length,
        izin: dayAbsensi.filter((a) => a.StatusID === "IZIN").length,
        alpa: dayAbsensi.filter((a) => a.StatusID === "ALPA").length,
        terlambat: dayAbsensi.filter((a) => a.StatusID === "TERLAMBAT").length,
      });
    }

    // Calculate hafalan per bulan (last 6 months)
    const currentDate = new Date();
    const hafalanBulanIni: Array<{
      bulan: string;
      rataMutawassitoh: number;
      rataAliyah: number;
    }> = [];
    const allHafalan = Array.from(this.hafalanBulanan.values());

    for (let i = 5; i >= 0; i--) {
      const date = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - i,
        1,
      );
      const bulan = date.toISOString().substring(0, 7); // YYYY-MM format
      const bulanName = date.toLocaleDateString("id-ID", {
        month: "short",
        year: "numeric",
      });

      // Get hafalan for this month
      const hafalanMut = allHafalan.filter(
        (h) => h.Bulan === bulan && h.MarhalahID === "MUT",
      );
      const hafalanAli = allHafalan.filter(
        (h) => h.Bulan === bulan && h.MarhalahID === "ALI",
      );

      // Calculate average
      const rataMutawassitoh =
        hafalanMut.length > 0
          ? hafalanMut.reduce((sum, h) => sum + h.JumlahHafalan, 0) /
            hafalanMut.length
          : 0;
      const rataAliyah =
        hafalanAli.length > 0
          ? hafalanAli.reduce((sum, h) => sum + h.JumlahHafalan, 0) /
            hafalanAli.length
          : 0;

      hafalanBulanIni.push({
        bulan: bulanName,
        rataMutawassitoh: Math.round(rataMutawassitoh * 10) / 10, // Round to 1 decimal
        rataAliyah: Math.round(rataAliyah * 10) / 10, // Round to 1 decimal
      });
    }

    return {
      totalSantri,
      santriMutawassitoh,
      santriAliyah,
      totalMusammi,
      musammiAliyah,
      musammiJamii,
      musammiHalaqahAliyah,
      musammiHalaqahMutawassitoh,
      absensiHariIni,
      absensi7Hari,
      hafalanBulanIni,
    };
  }
}

// Create storage instance based on environment
function createStorage(): IStorage {
  try {
    return new GoogleSheetsStorage();
  } catch (error) {
    console.error("Failed to initialize Google Sheets Storage:", error);
    console.log("Falling back to in-memory storage for development...");
    return new MemStorage();
  }
}

export const storage = createStorage();
