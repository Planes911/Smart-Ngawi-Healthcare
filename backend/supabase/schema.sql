-- ==============================================================================
-- PuskesmasPintar Database Schema (Supabase / PostgreSQL)
-- Hackathon JOINTS UGM 2026 - Subtema Healthcare
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ENUMS
CREATE TYPE urgency_level_enum AS ENUM ('MERAH', 'KUNING', 'HIJAU');
CREATE TYPE queue_status_enum AS ENUM ('WAITING', 'CALLED', 'EXAMINING', 'COMPLETED', 'CANCELLED', 'REROUTED');
CREATE TYPE queue_type_enum AS ENUM ('ONLINE', 'WALK_IN');

-- 2. TABEL PUSKESMAS / FASILITAS KESEHATAN (Kabupaten Ngawi)
CREATE TABLE IF NOT EXISTS puskesmas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    district VARCHAR(100) NOT NULL, -- Kecamatan (e.g., Ngawi Kota, Geneng, Kendal)
    address TEXT NOT NULL,
    phone VARCHAR(30),
    active_counters INT DEFAULT 2,
    avg_service_time_mins NUMERIC(4,1) DEFAULT 8.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABEL PASIEN
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nik VARCHAR(16) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    bpjs_number VARCHAR(30),
    gender VARCHAR(10), -- 'L' / 'P'
    birth_date DATE,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup by NIK or Phone
CREATE INDEX IF NOT EXISTS idx_patients_nik ON patients(nik);
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone);

-- 4. TABEL BOOKING TIME-SLOT
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    puskesmas_id UUID NOT NULL REFERENCES puskesmas(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    booking_date DATE NOT NULL,
    time_slot VARCHAR(30) NOT NULL, -- e.g. "08:00 - 09:00", "09:00 - 10:00"
    poly_type VARCHAR(50) DEFAULT 'Poli Umum', -- Poli Umum, Poli Gigi, Poli KIA
    status VARCHAR(30) DEFAULT 'CONFIRMED', -- CONFIRMED, CANCELLED, ATTENDED
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_date_slot ON bookings(puskesmas_id, booking_date, time_slot);

-- 5. TABEL GEJALA MANDIRI (SELF-REPORTED SYMPTOMS)
CREATE TABLE IF NOT EXISTS symptoms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    symptoms_list JSONB NOT NULL, -- Array of selected symptom IDs
    duration_days INT DEFAULT 1,
    severity_self_rating INT DEFAULT 1, -- 1 (ringan) - 5 (sangat berat)
    has_comorbidities BOOLEAN DEFAULT FALSE,
    comorbidities_notes TEXT,
    free_text_complaint TEXT,
    has_emergency_red_flag BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABEL HASIL PRE-TRIASE
CREATE TABLE IF NOT EXISTS triage_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    urgency_level urgency_level_enum NOT NULL, -- MERAH (Gawat Darurat Segera), KUNING (Mendesak), HIJAU (Standar)
    urgency_score INT NOT NULL, -- Scale 0 - 100
    rule_flags JSONB DEFAULT '[]'::jsonb, -- Rules triggered
    ai_summary TEXT, -- Penjelasan ringkas untuk tenaga medis / pasien
    ai_soap_draft JSONB, -- Draft SOAP notes (Subjective, Objective, Assessment, Plan)
    is_disclaimer_accepted BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABEL ANTREAN REAL-TIME (QUEUE TICKETS)
CREATE TABLE IF NOT EXISTS queue_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    puskesmas_id UUID NOT NULL REFERENCES puskesmas(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    ticket_number VARCHAR(20) NOT NULL, -- e.g. A-001, W-005
    queue_type queue_type_enum DEFAULT 'ONLINE',
    status queue_status_enum DEFAULT 'WAITING',
    urgency_level urgency_level_enum DEFAULT 'HIJAU',
    urgency_score INT DEFAULT 10,
    
    -- Estimasi Waktu Tunggu Hasil Monte Carlo (Rentang Jujur)
    est_wait_min_p50 INT, -- Menit tipikal (Median 50th percentile)
    est_wait_min_p90 INT, -- Menit skenario terburuk (90th percentile)
    recommended_departure_time TIMESTAMPTZ, -- Anti-Gravity: Kapan pasien harus berangkat dari rumah
    
    -- Timestamps Alur Pelayanan
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    called_at TIMESTAMPTZ,
    service_started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    assigned_counter VARCHAR(20),
    doctor_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_queue_active ON queue_tickets(puskesmas_id, status, urgency_level, registered_at);

-- 8. TABEL SIMULASI SKENARIO (UNTUK KEPALA PUSKESMAS)
CREATE TABLE IF NOT EXISTS simulation_scenarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    puskesmas_id UUID NOT NULL REFERENCES puskesmas(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    num_counters INT NOT NULL,
    avg_service_time_mins NUMERIC(4,1) NOT NULL,
    variance_mins NUMERIC(4,1) NOT NULL,
    incoming_patients_per_hour INT NOT NULL,
    simulated_runs INT DEFAULT 1000,
    result_avg_wait_mins NUMERIC(5,1),
    result_p90_wait_mins NUMERIC(5,1),
    bottleneck_risk_percentage NUMERIC(5,1),
    recommendation TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SEED DATA AWAL: PUSKESMAS DI KABUPATEN NGAWI
INSERT INTO puskesmas (code, name, district, address, phone, active_counters, avg_service_time_mins)
VALUES 
    ('NGW-001', 'Puskesmas Ngawi Purba', 'Ngawi Kota', 'Jl. PB. Sudirman No. 12, Ngawi', '0351-749123', 3, 7.5),
    ('NGW-002', 'Puskesmas Geneng', 'Geneng', 'Jl. Raya Geneng-Ngawi Km. 6', '0351-748456', 2, 8.0),
    ('NGW-003', 'Puskesmas Kendal', 'Kendal', 'Jl. Raya Kendal No. 45', '0351-747789', 2, 9.0),
    ('NGW-004', 'Puskesmas Ngrambe', 'Ngrambe', 'Jl. Lawu No. 10, Ngrambe', '0351-746321', 2, 8.5)
ON CONFLICT (code) DO NOTHING;

-- ENABLE REALTIME ON SUPABASE FOR QUEUE TICKETS
ALTER PUBLICATION supabase_realtime ADD TABLE queue_tickets;

-- ==============================================================================
-- 9. SEED DATA DUMMY 4 SKENARIO KLINIS UNTUK PENGUJIAN JURI
-- Menyiapkan 4 pasien dengan variasi triase (Merah, Kuning, Hijau periksa, Hijau kontrol)
-- ==============================================================================
DO $$
DECLARE
    pusk_id UUID;
    pat1 UUID;
    pat2 UUID;
    pat3 UUID;
    pat4 UUID;
    bk1 UUID;
    bk2 UUID;
    bk3 UUID;
    bk4 UUID;
BEGIN
    SELECT id INTO pusk_id FROM puskesmas WHERE code = 'NGW-001' LIMIT 1;
    IF pusk_id IS NOT NULL THEN
        -- Pasien 1: Bambang Supriyanto (Sedang Diperiksa, Hijau)
        INSERT INTO patients (nik, full_name, phone, bpjs_number, gender)
        VALUES ('3521011508910001', 'Bambang Supriyanto', '081234567890', '0001234567891', 'L')
        ON CONFLICT DO NOTHING;
        SELECT id INTO pat1 FROM patients WHERE nik = '3521011508910001' LIMIT 1;

        -- Pasien 2: Siti Rahmawati (Kuning, Dehidrasi Akut)
        INSERT INTO patients (nik, full_name, phone, bpjs_number, gender)
        VALUES ('3521015204820002', 'Siti Rahmawati', '081298765432', '0001234567892', 'P')
        ON CONFLICT DO NOTHING;
        SELECT id INTO pat2 FROM patients WHERE nik = '3521015204820002' LIMIT 1;

        -- Pasien 3: Pak Djoyo (Merah, Suspek ACS, Walk-In)
        INSERT INTO patients (nik, full_name, phone, bpjs_number, gender)
        VALUES ('3521010107600003', 'Pak Djoyo (Lansia - 64 th)', '081345678912', '0001234567893', 'L')
        ON CONFLICT DO NOTHING;
        SELECT id INTO pat3 FROM patients WHERE nik = '3521010107600003' LIMIT 1;

        -- Pasien 4: Indah Kusuma (Hijau, Kontrol Rutin Hipertensi)
        INSERT INTO patients (nik, full_name, phone, bpjs_number, gender)
        VALUES ('3521014509720004', 'Indah Kusuma (52 th)', '081567890123', '0001234567894', 'P')
        ON CONFLICT DO NOTHING;
        SELECT id INTO pat4 FROM patients WHERE nik = '3521014509720004' LIMIT 1;

        -- Bookings
        INSERT INTO bookings (puskesmas_id, patient_id, booking_date, time_slot, poly_type)
        VALUES (pusk_id, pat1, CURRENT_DATE, '08:00 - 09:00', 'Poli Umum') RETURNING id INTO bk1;
        INSERT INTO bookings (puskesmas_id, patient_id, booking_date, time_slot, poly_type)
        VALUES (pusk_id, pat2, CURRENT_DATE, '08:00 - 09:00', 'Poli Umum') RETURNING id INTO bk2;
        INSERT INTO bookings (puskesmas_id, patient_id, booking_date, time_slot, poly_type)
        VALUES (pusk_id, pat3, CURRENT_DATE, 'WALK-IN', 'Poli Umum') RETURNING id INTO bk3;
        INSERT INTO bookings (puskesmas_id, patient_id, booking_date, time_slot, poly_type)
        VALUES (pusk_id, pat4, CURRENT_DATE, '08:00 - 09:00', 'Poli Umum') RETURNING id INTO bk4;

        -- Symptoms
        INSERT INTO symptoms (booking_id, patient_id, symptoms_list, duration_days, severity_self_rating)
        VALUES (bk1, pat1, '["cough_mild", "runny_nose"]'::jsonb, 3, 2);
        INSERT INTO symptoms (booking_id, patient_id, symptoms_list, duration_days, severity_self_rating)
        VALUES (bk2, pat2, '["acute_abdominal_pain", "severe_vomiting_diarrhea"]'::jsonb, 1, 4);
        INSERT INTO symptoms (booking_id, patient_id, symptoms_list, duration_days, severity_self_rating, has_emergency_red_flag)
        VALUES (bk3, pat3, '["chest_pain_severe", "shortness_breath_severe"]'::jsonb, 1, 5, true);
        INSERT INTO symptoms (booking_id, patient_id, symptoms_list, duration_days, severity_self_rating)
        VALUES (bk4, pat4, '["routine_bpjs_check"]'::jsonb, 30, 1);

        -- Triage Results
        INSERT INTO triage_results (booking_id, patient_id, urgency_level, urgency_score, ai_soap_draft)
        VALUES (bk1, pat1, 'HIJAU', 18, '{"subjective": "Batuk berdahak 3 hari, pilek, demam sumer.", "objectiveNeeded": "Auskultasi paru dan suhu aksila.", "preliminaryAssessment": "ISPA Akut Ringan.", "suggestedPlan": "Guaifenesin oral, parasetamol prn."}'::jsonb);
        INSERT INTO triage_results (booking_id, patient_id, urgency_level, urgency_score, ai_soap_draft)
        VALUES (bk2, pat2, 'KUNING', 55, '{"subjective": "BAB cair > 6x, muntah, badan lemas, rasa haus.", "objectiveNeeded": "Cek turgor kulit, tensi dan nadi postural.", "preliminaryAssessment": "GEA dengan Dehidrasi Sedang.", "suggestedPlan": "Oralit ad libitum, Zinc 20mg, observasi 1 jam."}'::jsonb);
        INSERT INTO triage_results (booking_id, patient_id, urgency_level, urgency_score, ai_soap_draft)
        VALUES (bk3, pat3, 'MERAH', 92, '{"subjective": "Nyeri dada substernal tembus punggung, napas tersengal, keringat dingin.", "objectiveNeeded": "ABC, SpO2, EKG 12-lead segera.", "preliminaryAssessment": "Suspek Sindroma Koroner Akut (UAP/NSTEMI).", "suggestedPlan": "Bed IGD segera, O2 nasal kanul, Aspilet 160mg kunyah."}'::jsonb);
        INSERT INTO triage_results (booking_id, patient_id, urgency_level, urgency_score, ai_soap_draft)
        VALUES (bk4, pat4, 'HIJAU', 12, '{"subjective": "Kontrol rutin tensi Prolanis, obat habis.", "objectiveNeeded": "Tensi darah dan cek nadi.", "preliminaryAssessment": "Hipertensi Primer Derajat 1 Terkontrol.", "suggestedPlan": "Lanjutkan Amlodipine 5mg, edukasi rendah garam."}'::jsonb);

        -- Queue Tickets
        INSERT INTO queue_tickets (puskesmas_id, booking_id, patient_id, ticket_number, queue_type, status, urgency_level, urgency_score, est_wait_min_p50, est_wait_min_p90, assigned_counter, registered_at, service_started_at)
        VALUES (pusk_id, bk1, pat1, 'A-001', 'ONLINE', 'EXAMINING', 'HIJAU', 18, 0, 5, 'Poli Umum 1', NOW() - INTERVAL '25 minutes', NOW() - INTERVAL '6 minutes');
        INSERT INTO queue_tickets (puskesmas_id, booking_id, patient_id, ticket_number, queue_type, status, urgency_level, urgency_score, est_wait_min_p50, est_wait_min_p90, registered_at)
        VALUES (pusk_id, bk2, pat2, 'A-002', 'ONLINE', 'WAITING', 'KUNING', 55, 12, 18, NOW() - INTERVAL '16 minutes');
        INSERT INTO queue_tickets (puskesmas_id, booking_id, patient_id, ticket_number, queue_type, status, urgency_level, urgency_score, est_wait_min_p50, est_wait_min_p90, registered_at)
        VALUES (pusk_id, bk3, pat3, 'W-001', 'WALK_IN', 'WAITING', 'MERAH', 92, 2, 5, NOW() - INTERVAL '7 minutes');
        INSERT INTO queue_tickets (puskesmas_id, booking_id, patient_id, ticket_number, queue_type, status, urgency_level, urgency_score, est_wait_min_p50, est_wait_min_p90, registered_at)
        VALUES (pusk_id, bk4, pat4, 'A-003', 'ONLINE', 'WAITING', 'HIJAU', 12, 25, 38, NOW() - INTERVAL '12 minutes');
    END IF;
END $$;

