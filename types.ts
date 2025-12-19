
export enum ComplaintStatus {
  NEW = 'NEW',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  WAITING_CITIZEN = 'WAITING_CITIZEN',
  SOLVED = 'SOLVED',
  CLOSED = 'CLOSED',
  ESCALATED = 'ESCALATED'
}

export type UserRole = 'user' | 'agent' | 'supervisor' | 'admin';

export interface TicketUpdate {
  id?: string;
  timestamp: string;
  author: string;
  message: string;
  isInternal: boolean;
  type?: 'status_change' | 'assignment' | 'message' | 'escalation' | 'sla_breach' | 'internal_note' | 'ai_insight';
}

export interface Feedback {
  rating: number;
  comment: string;
  timestamp: string;
}

export interface PriorityBreakdown {
  keywordSeverity: number; // 0-100
  sentimentImpact: number; // 0-100
  categoryWeight: number; // 0-100
  explanation: string;
}

export interface CitizenProfileSummary {
  loyaltyLevel: 'New' | 'Regular' | 'Frequent';
  previousResolutionSatisfaction: string;
  historicalSentimentTrend: 'Improving' | 'Declining' | 'Stable';
}

export interface StaffIntelligence {
  suggestedRegulations: string[];
  riskAssessment: 'Low' | 'Medium' | 'High' | 'Severe';
  investigationStrategy: string[];
  logisticsAudit?: string;
  previousPrecedents?: string;
  escalationProbability: number; // 0-100
  recommendedTone: 'Empathetic' | 'Direct' | 'Conciliatory' | 'Formal';
  priorityBreakdown: PriorityBreakdown;
  citizenProfile: CitizenProfileSummary;
}

export interface ComplaintAnalysis {
  category: 'Delivery Delay' | 'Lost Parcel' | 'Damaged Item' | 'Wrong Delivery' | 'Staff Misconduct' | 'Refund/Payment Issue' | 'Other';
  sentiment: 'Positive' | 'Neutral' | 'Frustrated' | 'Angry' | 'Desperate';
  emotionalToneScore: number; // 0-100 (Stress Index)
  urgencyScore: number; // 0-100
  priorityScore: number; // Final Calculated Weight (1-100)
  priorityLabel: 'Routine' | 'Priority' | 'Urgent' | 'Critical' | 'Emergency';
  suggestedResponse: string;
  summary: string;
  tags: string[];
  translatedText: string;
  routingOffice?: string;
  slaDeadline: string; 
  predictedResolutionHours: number;
  intelligenceBriefing: StaffIntelligence;
}

export interface ConsignmentScan {
  date: string;
  time: string;
  office: string;
  event: string;
}

export interface Complaint {
  id: string;
  userId: string;
  userName: string;
  description: string;
  trackingNumber?: string;
  imageUrl?: string;
  postOffice: string;
  date: string;
  status: ComplaintStatus;
  analysis?: ComplaintAnalysis;
  assignedAgentId?: string;
  assignedAgentName?: string;
  updates: TicketUpdate[];
  feedback?: Feedback;
  escalationLevel: number; 
  lastActivityAt: string;
  slaPaused: boolean;
  scans?: ConsignmentScan[]; // Mock tracking history
}

export interface User {
  id: string;
  phone: string;
  name: string;
  email: string;
  role: UserRole;
  region?: string;
  employeeId?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

export interface GroundingLink {
  title: string;
  uri: string;
}
