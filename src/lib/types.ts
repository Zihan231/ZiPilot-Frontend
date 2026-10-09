export type ApplicationStatus =
  | 'APPLIED'
  | 'SCREENING'
  | 'IN_REVIEW'
  | 'ASSESSMENT'
  | 'INTERVIEW'
  | 'OFFER'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'WITHDRAWN'
  | 'GHOSTED';
/** Built-in key (LINKEDIN, INDEED, …) or a user's custom option text. */
export type Platform = string;
/** Built-in key (EASY_APPLY, WEBSITE, …) or a user's custom option text. */
export type AppliedVia = string;
export type JobType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP' | 'FREELANCE' | 'TEMPORARY';
export type Workplace = 'REMOTE' | 'HYBRID' | 'ONSITE';
export type Priority = 'HIGH' | 'MEDIUM' | 'LOW';
export type ConnectionStatus = 'NOT_SENT' | 'SENT' | 'ACCEPTED' | 'DECLINED';
export type MessageStatus = 'NOT_SENT' | 'SENT' | 'SEEN' | 'REPLIED';
export type InterviewType = 'PHONE_SCREEN' | 'HR' | 'TECHNICAL' | 'BEHAVIORAL' | 'SYSTEM_DESIGN' | 'ONSITE' | 'FINAL' | 'OTHER';
export type InterviewStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
export type TaskType = 'CODING_ASSESSMENT' | 'TAKE_HOME' | 'PRESENTATION' | 'QUESTIONNAIRE' | 'OTHER';
export type TaskStatus = 'PENDING' | 'SUBMITTED' | 'COMPLETED';
export type FollowUpChannel = 'EMAIL' | 'LINKEDIN' | 'PHONE' | 'OTHER';
export type ActivityType =
  | 'APPLICATION_CREATED'
  | 'APPLICATION_UPDATED'
  | 'STATUS_CHANGED'
  | 'WISHLIST_ADDED'
  | 'WISHLIST_APPLIED'
  | 'RECRUITER_MESSAGE'
  | 'RECRUITER_REPLY'
  | 'INTERVIEW_SCHEDULED'
  | 'INTERVIEW_UPDATED'
  | 'FOLLOWUP_SCHEDULED'
  | 'FOLLOWUP_COMPLETED'
  | 'TASK_ADDED'
  | 'TASK_SUBMITTED'
  | 'TASK_COMPLETED'
  | 'REMINDER_SENT';

export interface FollowUp {
  id: string;
  applicationId: string;
  dueAt: string;
  channel: FollowUpChannel;
  note: string | null;
  completedAt: string | null;
  application?: AppRef;
}

export interface Interview {
  id: string;
  applicationId: string;
  type: InterviewType;
  status: InterviewStatus;
  scheduledAt: string;
  durationMinutes: number | null;
  location: string | null;
  interviewer: string | null;
  notes: string | null;
  application?: AppRef;
}

export interface Task {
  id: string;
  applicationId: string;
  title: string;
  type: TaskType;
  status: TaskStatus;
  dueAt: string | null;
  link: string | null;
  notes: string | null;
  submittedAt: string | null;
  completedAt: string | null;
  application?: AppRef;
}

export interface Activity {
  id: string;
  type: ActivityType;
  message: string;
  createdAt: string;
  applicationId: string | null;
  wishlistJobId: string | null;
  meta: Record<string, unknown> | null;
  application?: { id: string; company: string; position: string } | null;
  wishlistJob?: { id: string; company: string; position: string } | null;
}

export interface AppRef {
  id: string;
  company: string;
  position: string;
  status: ApplicationStatus;
  jobUrl: string | null;
  recruiterName: string | null;
  recruiterEmail: string | null;
  recruiterLinkedin: string | null;
  appliedAt?: string;
  lastActivityAt?: string;
  recruiterRepliedAt?: string | null;
}

export interface Application {
  id: string;
  company: string;
  position: string;
  jobUrl: string | null;
  platform: Platform;
  appliedVia: AppliedVia;
  jobType: JobType;
  workplace: Workplace;
  location: string | null;
  country: string | null;
  city: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string | null;
  status: ApplicationStatus;
  priority: Priority;
  appliedAt: string;
  deadline: string | null;
  companyWebsite: string | null;
  jobReference: string | null;
  notes: string | null;
  recruiterName: string | null;
  recruiterEmail: string | null;
  recruiterLinkedin: string | null;
  connectionStatus: ConnectionStatus;
  msg1Status: MessageStatus;
  msg1SentAt: string | null;
  msg2Status: MessageStatus;
  msg2SentAt: string | null;
  msg3Status: MessageStatus;
  msg3SentAt: string | null;
  recruiterReplied: boolean;
  recruiterRepliedAt: string | null;
  needsReply: boolean;
  respondedAt: string | null;
  interviewedAt: string | null;
  offeredAt: string | null;
  lastActivityAt: string;
  createdAt: string;
  updatedAt: string;
  wishlistJobId: string | null;
}

export interface ApplicationRow extends Application {
  followUps: FollowUp[];
  interviews: Interview[];
  _count: { tasks: number; interviews: number };
}

export interface ApplicationDetail extends Application {
  followUps: FollowUp[];
  interviews: Interview[];
  tasks: Task[];
  activities: Activity[];
}

export interface WishlistJob {
  id: string;
  company: string;
  position: string;
  jobUrl: string | null;
  platform: Platform;
  appliedVia: AppliedVia | null;
  companyWebsite: string | null;
  jobReference: string | null;
  recruiterName: string | null;
  recruiterEmail: string | null;
  recruiterLinkedin: string | null;
  location: string | null;
  country: string | null;
  city: string | null;
  workplace: Workplace;
  jobType: JobType;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string | null;
  priority: Priority;
  deadline: string | null;
  notes: string | null;
  reminderSent: boolean;
  reminderAt: string | null;
  appliedAt: string | null;
  createdAt: string;
  application?: { id: string; status: ApplicationStatus } | null;
}

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export interface Facets {
  companies: { value: string; count: number }[];
  countries: string[];
  cities: string[];
  currencies: string[];
  /** Platform / applied-via values currently in use (includes custom ones). */
  platforms?: string[];
  appliedVias?: string[];
}

export interface RangeInfo {
  key: string;
  label: string;
  from: string | null;
  to: string | null;
}

export interface DashboardCard {
  key: string;
  label: string;
  target: 'applications' | 'wishlist';
  query: Record<string, string>;
  live?: boolean;
  count: number;
}

export interface DashboardOverview {
  range: RangeInfo;
  cards: DashboardCard[];
  followUpsDueCount: number;
  recentApplications: ApplicationRow[];
  wishlistDeadlines: WishlistJob[];
  followUps: FollowUp[];
  upcomingInterviews: Interview[];
  pendingTasks: Task[];
}

interface Section<T> {
  items: T[];
  total: number;
}

export interface Attention {
  total: number;
  wishlistDueSoon: Section<WishlistJob>;
  wishlistOverdue: Section<WishlistJob>;
  followUpsDue: Section<FollowUp>;
  upcomingInterviews: Section<Interview>;
  pendingTasks: Section<Task>;
  staleApplications: Section<AppRef>;
  needsReply: Section<AppRef>;
}

export interface Analytics {
  range: RangeInfo;
  rangeQuery: Record<string, string>;
  granularity: 'day' | 'week' | 'month';
  total: number;
  volume: { bucket: string; from: string; to: string; count: number }[];
  statusDistribution: { status: ApplicationStatus; count: number }[];
  funnel: { stage: string; key: string; count: number }[];
  conversion: { responseRate: number; interviewRate: number; offerRate: number; interviewToOffer: number };
  byPlatform: { platform: Platform; total: number; interviews: number; offers: number; interviewRate: number }[];
  byJobType: { jobType: JobType; count: number }[];
  byWorkplace: { workplace: Workplace; count: number }[];
  recruiterResponse: { contacted: number; replied: number; rate: number };
  followUpCompletion: { due: number; completed: number; rate: number };
}

export interface SearchResults {
  query: string;
  totals: { applications: number; wishlist: number };
  applications: {
    id: string;
    company: string;
    position: string;
    status: ApplicationStatus;
    appliedAt: string;
    recruiterName: string | null;
    match: { field: string; snippet: string } | null;
  }[];
  wishlist: {
    id: string;
    company: string;
    position: string;
    deadline: string | null;
    appliedAt: string | null;
    match: { field: string; snippet: string } | null;
  }[];
}

export interface FilterPreset {
  id: string;
  scope: 'APPLICATIONS' | 'WISHLIST';
  name: string;
  query: string;
}

export interface NotificationStatus {
  configured: boolean;
  recipient: string | null;
  schedule: string;
  pendingNow: number;
  lastSentAt: string | null;
}

export interface CustomOptions {
  platform: string[];
  appliedVia: string[];
}

export interface Me {
  id: string;
  email: string | null;
  displayName: string | null;
  photoUrl: string | null;
  dashboardLayout: { id: string; visible: boolean }[] | null;
  customOptions: CustomOptions | null;
}
