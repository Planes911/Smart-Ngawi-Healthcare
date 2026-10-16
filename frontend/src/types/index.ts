/**
 * PuskesmasPintar - TypeScript Type Definitions
 * Hackathon JOINTS UGM 2026 - Subtema Healthcare
 */

export type UrgencyLevel = 'MERAH' | 'KUNING' | 'HIJAU';
export type QueueStatus = 'WAITING' | 'CALLED' | 'EXAMINING' | 'COMPLETED' | 'CANCELLED' | 'REROUTED';
export type QueueType = 'ONLINE' | 'WALK_IN';

export interface Puskesmas {
  id: string;
  code: string;
  name: string;
  district: string;
  address: string;
  phone: string;
  activeCounters: number;
  avgServiceTimeMins: number;
}

export interface Patient {
  id: string;
  nik: string;
  fullName: string;
  phone: string;
  bpjsNumber?: string;
  gender?: 'L' | 'P';
  birthDate?: string;
  address?: string;
}

export interface Booking {
  id: string;
  puskesmasId: string;
  patientId: string;
  bookingDate: string;
  timeSlot: string;
  polyType: string;
  status: 'CONFIRMED' | 'CANCELLED' | 'ATTENDED';
  createdAt: string;
}

export interface SymptomItem {
  id: string;
  label: string;
  category: 'red_flag' | 'urgent' | 'standard';
  baseScore: number;
}

export interface SymptomReport {
  bookingId?: string;
  patientId: string;
  symptomIds: string[];
  severityRating: number; // 1 - 5
  durationDays: number;
  hasComorbidities: boolean;
  comorbiditiesNotes?: string;
  freeTextComplaint?: string;
  hasEmergencyRedFlags: boolean;
}

export interface SoapDraft {
  subjective: string;
  objectiveNeeded: string;
  preliminaryAssessment: string;
  suggestedPlan: string;
}

export interface TriageEvaluation {
  urgencyLevel: UrgencyLevel;
  urgencyScore: number; // 0 - 100
  colorHex: string;
  title: string;
  patientExplanation: string;
  recommendedAction: 'EMERGENCY_IGD' | 'PRIORITY_POLI' | 'NORMAL_QUEUE';
  triggeredRules: string[];
  disclaimer: string;
  soapDraft: SoapDraft;
}

export interface MonteCarloSimulationResult {
  peopleAhead: number;
  activeCounters: number;
  iterations: number;
  p50Minutes: number; // Median
  p90Minutes: number; // 90th percentile
  minMinutes: number;
  maxMinutes: number;
  displayRange: string;
  honestSummary: string;
  recommendedDepartureTime: string;
  bottleneckRisk: 'RENDAH' | 'SEDANG' | 'TINGGI';
}

export interface QueueTicket {
  id: string;
  puskesmasId: string;
  bookingId?: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  ticketNumber: string;
  queueType: QueueType;
  status: QueueStatus;
  urgencyLevel: UrgencyLevel;
  urgencyScore: number;
  estWaitMinP50: number;
  estWaitMinP90: number;
  recommendedDepartureTime?: string;
  registeredAt: string;
  calledAt?: string;
  serviceStartedAt?: string;
  completedAt?: string;
  assignedCounter?: string;
  polyType: string;
  symptomsList?: string[];
  soapDraft?: SoapDraft;
}

export interface WhatIfScenarioInput {
  numCounters: number;
  avgServiceTimeMins: number;
  stdDevMins: number;
  incomingPatientsPerHour: number;
  iterations?: number;
}

export interface WhatIfScenarioResult {
  numCounters: number;
  avgServiceTimeMins: number;
  incomingPatientsPerHour: number;
  simulatedAvgWaitMins: number;
  simulatedP90WaitMins: number;
  bottleneckRiskPercentage: number;
  distributionHistogram: { bucket: string; count: number; percentage: number }[];
  recommendation: string;
  autonomousLoadSheddingTriggered: boolean;
}
