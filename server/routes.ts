import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertMusammiSchema,
  insertHalaqahSchema,
  insertSantriSchema,
  halaqahMembersSchema,
  batchAbsensiSchema,
  batchHalaqahRequestSchema,
  insertHafalanBulananSchema,
  insertMurojaahBulananSchema,
  insertPenambahanHafalanSchema,
  insertTasksSchema,
} from "@shared/schema";
import type { Halaqah, Musammi, Santri, HalaqahMembers } from "@shared/schema";
import { ZodError } from "zod";

// Create partial schemas for updates
const updateHalaqahSchema = insertHalaqahSchema.partial();
const updateMusammiSchema = insertMusammiSchema.partial();
const updateSantriSchema = insertSantriSchema.partial();
const updateHalaqahMembersSchema = halaqahMembersSchema.partial();
const updateHafalanBulananSchema = insertHafalanBulananSchema.partial();
const updateMurojaahBulananSchema = insertMurojaahBulananSchema.partial();
const updateTasksSchema = insertTasksSchema.partial();

export async function registerRoutes(app: Express): Promise<Server> {
  // ========== LOOKUPS ==========
  app.get("/api/lookups", async (req, res) => {
    try {
      const lookups = await storage.getLookups();
      res.json(lookups);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ========== HALAQAH CRUD ==========
  app.get("/api/halaqah", async (req, res) => {
    try {
      const { marhalah, jenis } = req.query;
      const halaqah = await storage.getAllHalaqah(marhalah as string, jenis as string);
      res.json(halaqah);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/halaqah/:id", async (req, res) => {
    try {
      const halaqah = await storage.getHalaqah(req.params.id);
      if (!halaqah) {
        return res.status(404).json({ error: "Halaqah not found" });
      }
      res.json(halaqah);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/halaqah", async (req, res) => {
    try {
      const validated = insertHalaqahSchema.parse(req.body);
      const halaqah = await storage.createHalaqah(validated);
      res.status(201).json(halaqah);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/halaqah/:id", async (req, res) => {
    try {
      const validated = updateHalaqahSchema.parse(req.body);
      const halaqah = await storage.updateHalaqah(req.params.id, validated);
      res.json(halaqah);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.message });
      }
      if (error.message.toLowerCase().includes('not found')) {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/halaqah/:id", async (req, res) => {
    try {
      await storage.deleteHalaqah(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      if (error.message.toLowerCase().includes('not found')) {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // ========== BATCH HALAQAH ==========
  app.post("/api/halaqah/batch", async (req, res) => {
    try {
      const validated = batchHalaqahRequestSchema.parse(req.body);
      const { rows, jenisHalaqah } = validated;

      // Fetch semua data yang diperlukan sekali di awal
      const [allMusammi, allHalaqah, allSantri] = await Promise.all([
        storage.getAllMusammi(),
        storage.getAllHalaqah(),
        storage.getAllSantri(),
      ]);

      // Group rows by halaqah
      const halaqahGroups: Record<string, typeof rows> = {};
      rows.forEach(row => {
        const key = `${row.nomorUrutHalaqah}-${row.marhalahSantri}`;
        if (!halaqahGroups[key]) {
          halaqahGroups[key] = [];
        }
        halaqahGroups[key].push(row);
      });

      // Cache untuk halaqah members
      const halaqahMembersCache = new Map<string, Set<string>>();
      const createdEntities = {
        musammi: [] as Musammi[],
        halaqah: [] as Halaqah[],
        santri: [] as Santri[],
        members: [] as HalaqahMembers[],
      };

      // Process each halaqah group
      for (const [key, groupRows] of Object.entries(halaqahGroups)) {
        const firstRow = groupRows[0];

        // 1. Create or find Musammi
        let musammi = allMusammi.find(
          m => m.NamaMusammi === firstRow.namaMusammi && m.MarhalahID === firstRow.marhalahMusammi
        );

        if (!musammi) {
          musammi = await storage.createMusammi({
            NamaMusammi: firstRow.namaMusammi,
            MarhalahID: firstRow.marhalahMusammi,
            KelasMusammi: firstRow.kelasMusammi,
          });
          allMusammi.push(musammi);
          createdEntities.musammi.push(musammi);
        }

        // 2. Create or find Halaqah
        let halaqah = allHalaqah.find(
          h => h.NomorUrutHalaqah === firstRow.nomorUrutHalaqah && 
               h.MarhalahID === firstRow.marhalahSantri &&
               h.JenisHalaqah === jenisHalaqah
        );

        if (!halaqah) {
          halaqah = await storage.createHalaqah({
            NomorUrutHalaqah: firstRow.nomorUrutHalaqah,
            MarhalahID: firstRow.marhalahSantri,
            MusammiID: musammi.MusammiID,
            KelasMusammi: firstRow.kelasMusammi,
            JenisHalaqah: jenisHalaqah,
          });
          allHalaqah.push(halaqah);
          createdEntities.halaqah.push(halaqah);
        }

        // 3. Fetch members untuk halaqah ini (sekali saja)
        if (!halaqahMembersCache.has(halaqah.HalaqahID)) {
          const members = await storage.getHalaqahMembers(halaqah.HalaqahID);
          halaqahMembersCache.set(halaqah.HalaqahID, new Set(members.map(m => m.SantriID)));
        }

        const existingMemberIds = halaqahMembersCache.get(halaqah.HalaqahID)!;

        // 4. Process santri untuk halaqah ini
        for (const row of groupRows) {
          // Create or find Santri
          let santri = allSantri.find(
            s => s.NamaSantri === row.namaSantri && s.MarhalahID === row.marhalahSantri
          );

          if (!santri) {
            santri = await storage.createSantri({
              NamaSantri: row.namaSantri,
              MarhalahID: row.marhalahSantri,
              Kelas: row.kelasSantri,
              Aktif: true,
            });
            allSantri.push(santri);
            createdEntities.santri.push(santri);
          }

          // Link Santri to Halaqah
          if (!existingMemberIds.has(santri.SantriID)) {
            const member = await storage.createHalaqahMember({
              HalaqahID: halaqah.HalaqahID,
              SantriID: santri.SantriID,
              TanggalMulai: new Date().toISOString().split('T')[0],
              JenisHalaqah: jenisHalaqah,
            });
            existingMemberIds.add(santri.SantriID);
            createdEntities.members.push(member);
          }
        }
      }

      res.status(201).json({
        success: true,
        created: {
          musammi: createdEntities.musammi.length,
          halaqah: createdEntities.halaqah.length,
          santri: createdEntities.santri.length,
          members: createdEntities.members.length,
        },
      });
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // ========== MUSAMMI CRUD ==========
  app.get("/api/musammi", async (req, res) => {
    try {
      const { marhalah } = req.query;
      const musammi = await storage.getAllMusammi(marhalah as string);
      res.json(musammi);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/musammi/:id", async (req, res) => {
    try {
      const musammi = await storage.getMusammi(req.params.id);
      if (!musammi) {
        return res.status(404).json({ error: "Musammi not found" });
      }
      res.json(musammi);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/musammi", async (req, res) => {
    try {
      const validated = insertMusammiSchema.parse(req.body);
      const musammi = await storage.createMusammi(validated);
      res.status(201).json(musammi);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/musammi/:id", async (req, res) => {
    try {
      const validated = updateMusammiSchema.parse(req.body);
      const musammi = await storage.updateMusammi(req.params.id, validated);
      res.json(musammi);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.message });
      }
      if (error.message.toLowerCase().includes('not found')) {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/musammi/:id", async (req, res) => {
    try {
      await storage.deleteMusammi(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      if (error.message.toLowerCase().includes('not found')) {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // ========== SANTRI CRUD ==========
  app.get("/api/santri", async (req, res) => {
    try {
      const { marhalah, aktif } = req.query;
      const aktifBool = aktif === 'true' ? true : aktif === 'false' ? false : undefined;
      const santri = await storage.getAllSantri(marhalah as string, aktifBool);
      res.json(santri);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/santri/:id", async (req, res) => {
    try {
      const santri = await storage.getSantri(req.params.id);
      if (!santri) {
        return res.status(404).json({ error: "Santri not found" });
      }
      res.json(santri);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/santri", async (req, res) => {
    try {
      const validated = insertSantriSchema.parse(req.body);
      const santri = await storage.createSantri(validated);
      res.status(201).json(santri);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/santri/:id", async (req, res) => {
    try {
      const validated = updateSantriSchema.parse(req.body);
      const santri = await storage.updateSantri(req.params.id, validated);
      res.json(santri);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.message });
      }
      if (error.message.toLowerCase().includes('not found')) {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/santri/:id", async (req, res) => {
    try {
      await storage.deleteSantri(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      if (error.message.toLowerCase().includes('not found')) {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // ========== HALAQAH MEMBERS CRUD ==========
  app.get("/api/halaqah-members", async (req, res) => {
    try {
      const { halaqahId } = req.query;
      if (!halaqahId) {
        return res.status(400).json({ error: "halaqahId is required" });
      }
      const members = await storage.getHalaqahMembers(halaqahId as string);
      res.json(members);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/halaqah-members", async (req, res) => {
    try {
      const validated = halaqahMembersSchema.parse(req.body);
      const member = await storage.createHalaqahMember(validated);
      res.status(201).json(member);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/halaqah-members/:halaqahId/:santriId", async (req, res) => {
    try {
      const validated = updateHalaqahMembersSchema.parse(req.body);
      const member = await storage.updateHalaqahMember(
        req.params.halaqahId,
        req.params.santriId,
        validated
      );
      res.json(member);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.message });
      }
      if (error.message.toLowerCase().includes('not found')) {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/halaqah-members/:halaqahId/:santriId", async (req, res) => {
    try {
      await storage.deleteHalaqahMember(req.params.halaqahId, req.params.santriId);
      res.status(204).send();
    } catch (error: any) {
      if (error.message.toLowerCase().includes('not found')) {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // ========== ABSENSI ==========
  app.post("/api/absensi/batch", async (req, res) => {
    try {
      const validated = batchAbsensiSchema.parse(req.body);
      const result = await storage.batchCreateAbsensi(validated);
      res.status(201).json(result);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/absensi/santri", async (req, res) => {
    try {
      const { tanggal, marhalah, waktu, jenis } = req.query;
      if (!tanggal) {
        return res.status(400).json({ error: "tanggal is required" });
      }
      const absensi = await storage.getAbsensiSantri(
        tanggal as string,
        marhalah as string,
        waktu as string,
        jenis as string
      );
      res.json(absensi);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/absensi/musammi", async (req, res) => {
    try {
      const { tanggal, marhalah, waktu, jenis } = req.query;
      if (!tanggal) {
        return res.status(400).json({ error: "tanggal is required" });
      }
      const absensi = await storage.getAbsensiMusammi(
        tanggal as string,
        marhalah as string,
        waktu as string,
        jenis as string
      );
      res.json(absensi);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/absensi/report", async (req, res) => {
    try {
      const { tanggalDari, tanggalSampai, marhalah, kelas, peran, jenis } = req.query;
      const report = await storage.getAbsensiReport(
        tanggalDari as string,
        tanggalSampai as string,
        marhalah as string,
        kelas as string,
        peran as string,
        jenis as string
      );
      res.json(report);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ========== HAFALAN ==========
  app.get("/api/hafalan", async (req, res) => {
    try {
      const { bulan, marhalah, jenis } = req.query;
      if (!bulan) {
        return res.status(400).json({ error: "bulan is required" });
      }
      const hafalan = await storage.getHafalanBulanan(
        bulan as string,
        marhalah as string,
        jenis as string
      );
      res.json(hafalan);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/hafalan", async (req, res) => {
    try {
      const validated = insertHafalanBulananSchema.parse(req.body);
      const hafalan = await storage.createHafalanBulanan(validated);
      res.status(201).json(hafalan);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/hafalan/:id", async (req, res) => {
    try {
      const validated = updateHafalanBulananSchema.parse(req.body);
      const hafalan = await storage.updateHafalanBulanan(req.params.id, validated);
      res.json(hafalan);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.message });
      }
      if (error.message.toLowerCase().includes('not found')) {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/hafalan/:id", async (req, res) => {
    try {
      await storage.deleteHafalanBulanan(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      if (error.message.toLowerCase().includes('not found')) {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // ========== MUROJAAH ==========
  app.get("/api/murojaah", async (req, res) => {
    try {
      const { bulan, marhalah, jenis } = req.query;
      if (!bulan) {
        return res.status(400).json({ error: "bulan is required" });
      }
      const murojaah = await storage.getMurojaahBulanan(
        bulan as string,
        marhalah as string,
        jenis as string
      );
      res.json(murojaah);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/murojaah", async (req, res) => {
    try {
      const validated = insertMurojaahBulananSchema.parse(req.body);
      const murojaah = await storage.createMurojaahBulanan(validated);
      res.status(201).json(murojaah);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/murojaah/:id", async (req, res) => {
    try {
      const validated = updateMurojaahBulananSchema.parse(req.body);
      const murojaah = await storage.updateMurojaahBulanan(req.params.id, validated);
      res.json(murojaah);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.message });
      }
      if (error.message.toLowerCase().includes('not found')) {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/murojaah/:id", async (req, res) => {
    try {
      await storage.deleteMurojaahBulanan(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      if (error.message.toLowerCase().includes('not found')) {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // ========== PENAMBAHAN HAFALAN ==========
  app.get("/api/penambahan", async (req, res) => {
    try {
      const bulan = req.query.bulan as string | undefined;
      const marhalahId = req.query.marhalah as string | undefined;
      const jenisHalaqah = req.query.jenis as string | undefined;
      const penambahan = await storage.getPenambahanHafalan(bulan, marhalahId, jenisHalaqah);
      res.json(penambahan);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/penambahan", async (req, res) => {
    try {
      const validated = insertPenambahanHafalanSchema.parse(req.body);
      const penambahan = await storage.createPenambahanHafalan(validated);
      res.status(201).json(penambahan);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // ========== BATCH IMPORTS ==========
  app.post("/api/hafalan/batch", async (req, res) => {
    try {
      const { data } = req.body;
      if (!Array.isArray(data)) {
        return res.status(400).json({ error: "Expected array of records" });
      }
      
      const validatedData = [];
      const errors = [];
      
      for (let i = 0; i < data.length; i++) {
        try {
          const validated = insertHafalanBulananSchema.parse(data[i]);
          validatedData.push(validated);
        } catch (err: any) {
          if (err instanceof ZodError) {
            errors.push({ row: i + 1, error: err.errors[0].message });
          } else {
            errors.push({ row: i + 1, error: err.message });
          }
        }
      }
      
      if (errors.length > 0) {
        return res.status(400).json({ error: "Validation errors", details: errors });
      }
      
      const results = await storage.batchCreateHafalanBulanan(validatedData);
      res.status(201).json({ success: true, count: results.length, results });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/murojaah/batch", async (req, res) => {
    try {
      const { data } = req.body;
      if (!Array.isArray(data)) {
        return res.status(400).json({ error: "Expected array of records" });
      }
      
      const validatedData = [];
      const errors = [];
      
      for (let i = 0; i < data.length; i++) {
        try {
          const validated = insertMurojaahBulananSchema.parse(data[i]);
          validatedData.push(validated);
        } catch (err: any) {
          if (err instanceof ZodError) {
            errors.push({ row: i + 1, error: err.errors[0].message });
          } else {
            errors.push({ row: i + 1, error: err.message });
          }
        }
      }
      
      if (errors.length > 0) {
        return res.status(400).json({ error: "Validation errors", details: errors });
      }
      
      const results = await storage.batchCreateMurojaahBulanan(validatedData);
      res.status(201).json({ success: true, count: results.length, results });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/penambahan/batch", async (req, res) => {
    try {
      const { data } = req.body;
      if (!Array.isArray(data)) {
        return res.status(400).json({ error: "Expected array of records" });
      }
      
      const validatedData = [];
      const errors = [];
      
      for (let i = 0; i < data.length; i++) {
        try {
          const validated = insertPenambahanHafalanSchema.parse(data[i]);
          validatedData.push(validated);
        } catch (err: any) {
          if (err instanceof ZodError) {
            errors.push({ row: i + 1, error: err.errors[0].message });
          } else {
            errors.push({ row: i + 1, error: err.message });
          }
        }
      }
      
      if (errors.length > 0) {
        return res.status(400).json({ error: "Validation errors", details: errors });
      }
      
      const results = await storage.batchCreatePenambahanHafalan(validatedData);
      res.status(201).json({ success: true, count: results.length, results });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ========== TASKS ==========
  app.get("/api/tasks", async (req, res) => {
    try {
      const { status } = req.query;
      const tasks = await storage.getTasks(status as string);
      res.json(tasks);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/tasks", async (req, res) => {
    try {
      const validated = insertTasksSchema.parse(req.body);
      const task = await storage.createTask(validated);
      res.status(201).json(task);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/tasks/:id", async (req, res) => {
    try {
      const validated = updateTasksSchema.parse(req.body);
      const task = await storage.updateTask(req.params.id, validated);
      res.json(task);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.message });
      }
      if (error.message.toLowerCase().includes('not found')) {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/tasks/:id", async (req, res) => {
    try {
      await storage.deleteTask(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      if (error.message.toLowerCase().includes('not found')) {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // ========== DASHBOARD ==========
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
