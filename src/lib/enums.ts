import type {
  ActivityType,
  ApplicationStatus,
  ConnectionStatus,
  FollowUpChannel,
  InterviewStatus,
  InterviewType,
  JobType,
  MessageStatus,
  Priority,
  TaskStatus,
  TaskType,
  Workplace,
} from './types';

export type Tone = 'neutral' | 'info' | 'accent' | 'violet' | 'good' | 'warn' | 'serious' | 'critical';
export type Hue = 'indigo' | 'blue' | 'violet' | 'teal' | 'emerald' | 'amber' | 'orange' | 'rose' | 'slate';
export interface Option<T extends string = string> {
  value: T;
  label: string;
}

const opts = <T extends string>(map: Record<T, string>): Option<T>[] => (Object.entries(map) as [T, string][]).map(([value, label]) => ({ value, label }));

export const STATUS_LABEL: Record<ApplicationStatus, string> = {
  APPLIED: 'Applied',
  SCREENING: 'Screening',
  IN_REVIEW: 'In Review',
  ASSESSMENT: 'Assessment',
  INTERVIEW: 'Interview',
  OFFER: 'Offer',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn',
  GHOSTED: 'Ghosted',
};
export const STATUS_TONE: Record<ApplicationStatus, Tone> = {
  APPLIED: 'info',
  SCREENING: 'violet',
  IN_REVIEW: 'violet',
  ASSESSMENT: 'warn',
  INTERVIEW: 'accent',
  OFFER: 'good',
  ACCEPTED: 'good',
  REJECTED: 'critical',
  WITHDRAWN: 'neutral',
  GHOSTED: 'neutral',
};
export const STATUS_OPTIONS = opts(STATUS_LABEL);

export const PLATFORM_LABEL: Record<string, string> = {
  LINKEDIN: 'LinkedIn',
  INDEED: 'Indeed',
  GLASSDOOR: 'Glassdoor',
  COMPANY_WEBSITE: 'Company Website',
  WELLFOUND: 'Wellfound',
  BDJOBS: 'Bdjobs',
  ZIPRECRUITER: 'ZipRecruiter',
  REFERRAL: 'Referral',
  OTHER: 'Other',
};
export const PLATFORM_OPTIONS = opts(PLATFORM_LABEL);
/** Label for a built-in platform key, or the custom text itself. */
export const platformLabel = (v?: string | null) => (v ? (PLATFORM_LABEL[v] ?? v) : '—');

export const APPLIED_VIA_LABEL: Record<string, string> = {
  EASY_APPLY: 'Easy Apply',
  WEBSITE: 'Website',
  EMAIL: 'Email',
  REFERRAL: 'Referral',
  RECRUITER: 'Recruiter',
  JOB_PORTAL: 'Job Portal',
  OTHER: 'Other',
};
export const APPLIED_VIA_OPTIONS = opts(APPLIED_VIA_LABEL);
/** Label for a built-in applied-via key, or the custom text itself. */
export const appliedViaLabel = (v?: string | null) => (v ? (APPLIED_VIA_LABEL[v] ?? v) : '—');

export const JOB_TYPE_LABEL: Record<JobType, string> = {
  FULL_TIME: 'Full-time',
  PART_TIME: 'Part-time',
  CONTRACT: 'Contract',
  INTERNSHIP: 'Internship',
  FREELANCE: 'Freelance',
  TEMPORARY: 'Temporary',
};
export const JOB_TYPE_OPTIONS = opts(JOB_TYPE_LABEL);

export const WORKPLACE_LABEL: Record<Workplace, string> = { REMOTE: 'Remote', HYBRID: 'Hybrid', ONSITE: 'Onsite' };
export const WORKPLACE_OPTIONS = opts(WORKPLACE_LABEL);

export const PRIORITY_LABEL: Record<Priority, string> = { HIGH: 'High', MEDIUM: 'Medium', LOW: 'Low' };
export const PRIORITY_TONE: Record<Priority, Tone> = { HIGH: 'critical', MEDIUM: 'warn', LOW: 'neutral' };
export const PRIORITY_OPTIONS = opts(PRIORITY_LABEL);

export const CONNECTION_LABEL: Record<ConnectionStatus, string> = { NOT_SENT: 'Not Sent', SENT: 'Sent', ACCEPTED: 'Accepted', DECLINED: 'Declined' };
export const CONNECTION_OPTIONS = opts(CONNECTION_LABEL);

export const MESSAGE_LABEL: Record<MessageStatus, string> = { NOT_SENT: 'Not Sent', SENT: 'Sent', SEEN: 'Seen', REPLIED: 'Replied' };
export const MESSAGE_TONE: Record<MessageStatus, Tone> = { NOT_SENT: 'neutral', SENT: 'info', SEEN: 'violet', REPLIED: 'good' };
export const MESSAGE_OPTIONS = opts(MESSAGE_LABEL);

export const INTERVIEW_TYPE_LABEL: Record<InterviewType, string> = {
  PHONE_SCREEN: 'Phone Screen',
  HR: 'HR',
  TECHNICAL: 'Technical',
  BEHAVIORAL: 'Behavioral',
  SYSTEM_DESIGN: 'System Design',
  ONSITE: 'Onsite',
  FINAL: 'Final',
  OTHER: 'Other',
};
export const INTERVIEW_TYPE_OPTIONS = opts(INTERVIEW_TYPE_LABEL);
export const INTERVIEW_STATUS_LABEL: Record<InterviewStatus, string> = { SCHEDULED: 'Scheduled', COMPLETED: 'Completed', CANCELLED: 'Cancelled' };
export const INTERVIEW_STATUS_OPTIONS = opts(INTERVIEW_STATUS_LABEL);

export const TASK_TYPE_LABEL: Record<TaskType, string> = {
  CODING_ASSESSMENT: 'Coding Assessment',
  TAKE_HOME: 'Take-home',
  PRESENTATION: 'Presentation',
  QUESTIONNAIRE: 'Questionnaire',
  OTHER: 'Other',
};
export const TASK_TYPE_OPTIONS = opts(TASK_TYPE_LABEL);
export const TASK_STATUS_LABEL: Record<TaskStatus, string> = { PENDING: 'Pending', SUBMITTED: 'Submitted', COMPLETED: 'Completed' };
export const TASK_STATUS_TONE: Record<TaskStatus, Tone> = { PENDING: 'warn', SUBMITTED: 'info', COMPLETED: 'good' };
export const TASK_STATUS_OPTIONS = opts(TASK_STATUS_LABEL);

export const CHANNEL_LABEL: Record<FollowUpChannel, string> = { EMAIL: 'Email', LINKEDIN: 'LinkedIn', PHONE: 'Phone', OTHER: 'Other' };
export const CHANNEL_OPTIONS = opts(CHANNEL_LABEL);

export const ACTIVITY_GROUPS: { value: string; label: string; types: ActivityType[] }[] = [
  { value: 'applications', label: 'Applications', types: ['APPLICATION_CREATED'] },
  { value: 'wishlist', label: 'Wishlist', types: ['WISHLIST_ADDED', 'WISHLIST_APPLIED', 'REMINDER_SENT'] },
  { value: 'status', label: 'Status changes', types: ['STATUS_CHANGED'] },
  { value: 'recruiter', label: 'Recruiter', types: ['RECRUITER_MESSAGE', 'RECRUITER_REPLY'] },
  { value: 'interviews', label: 'Interviews', types: ['INTERVIEW_SCHEDULED', 'INTERVIEW_UPDATED'] },
  { value: 'followups', label: 'Follow-ups', types: ['FOLLOWUP_SCHEDULED', 'FOLLOWUP_COMPLETED'] },
  { value: 'tasks', label: 'Tasks', types: ['TASK_ADDED', 'TASK_SUBMITTED', 'TASK_COMPLETED'] },
];

export const CURRENCIES = ['USD', 'EUR', 'GBP', 'BDT', 'INR', 'CAD', 'AUD', 'SGD', 'AED', 'JPY'];
