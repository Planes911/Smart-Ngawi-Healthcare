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
