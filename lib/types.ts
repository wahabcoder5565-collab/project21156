export type MemberRole = "member" | "researcher" | "admin";
export type PollStatus = "draft" | "fielding" | "closed" | "archived";
export type QuestionType =
  | "single_choice"
  | "multiple_choice"
  | "scale"
  | "text";

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: MemberRole;
  country: string | null;
  region: string | null;
  city: string | null;
  age_band: string | null;
  gender: string | null;
  employment: string | null;
  education: string | null;
  political_view: string | null;
  is_demo: boolean;
  survey_weight: number | null;
  reputation_points: number;
  polls_completed: number;
  current_streak: number;
  longest_streak: number;
  last_active_on: string | null;
  created_at: string;
  updated_at: string;
};

export type Poll = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  category: string;
  sponsor: string | null;
  cover_image: string | null;
  geography: string | null;
  audience: string | null;
  status: PollStatus;
  opens_at: string | null;
  closes_at: string | null;
  target_responses: number | null;
  fielding_days: number | null;
  show_results_live: boolean;
  hide_results_until_complete: boolean;
  allow_text_answers: boolean;
  incentive_points: number;
  is_featured: boolean;
  is_anonymous: boolean;
  created_by: string | null;
  published_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PollOption = {
  id: string;
  label: string;
  color: string | null;
};

export type PollQuestion = {
  id: string;
  prompt: string;
  help_text: string | null;
  position: number;
  question_type: QuestionType;
  is_required: boolean;
  min_selections: number | null;
  max_selections: number | null;
  scale_min: number | null;
  scale_max: number | null;
  scale_min_label: string | null;
  scale_max_label: string | null;
  options: PollOption[];
};

export type PollDetail = {
  poll: Poll;
  creator: { id: string; role: MemberRole; full_name: string | null } | null;
  is_saved: boolean;
  questions: PollQuestion[];
  can_manage: boolean;
  has_completed: boolean;
  question_count: number;
  results_visible: boolean;
  total_responses: number;
  estimated_minutes: number;
};

export type FeedPoll = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  category: string;
  sponsor: string | null;
  geography: string | null;
  audience: string | null;
  status: PollStatus;
  closes_at: string | null;
  published_at: string | null;
  target_responses: number | null;
  incentive_points: number;
  is_featured: boolean;
  question_count: number;
  response_count: number;
  is_saved: boolean;
  has_completed: boolean;
};

export type PollCategory = { category: string; poll_count: number };

export type ResultOption = {
  id: string;
  label: string;
  color: string | null;
  votes: number;
  pct: number;
};

export type ScaleBucket = { value: number; votes: number };

export type ResultQuestion = {
  id: string;
  position: number;
  prompt: string;
  help_text: string | null;
  question_type: QuestionType;
  is_required: boolean;
  min_selections: number | null;
  max_selections: number | null;
  scale_min: number | null;
  scale_max: number | null;
  scale_min_label: string | null;
  scale_max_label: string | null;
  responses: number;
  mean: number | null;
  options: ResultOption[];
  scale_distribution: ScaleBucket[];
};

export type TextResponse = {
  body: string;
  created_at: string;
  age_band: string | null;
  country: string | null;
};

export type TrendPoint = {
  day: string;
  value: number;
  votes?: number;
  answers: number;
};

export type TrendSeries = {
  id: string | null;
  label: string;
  color: string | null;
  kind: "option" | "scale";
  points: TrendPoint[];
};

export type TrendQuestion = {
  question_id: string;
  prompt: string;
  question_type: QuestionType;
  scale_max: number | null;
  series: TrendSeries[];
};

export type PollTrend = {
  visible: boolean;
  days: { day: string; responses: number }[];
  questions: TrendQuestion[];
};

export type PollResults = {
  visible: boolean;
  poll: {
    id: string;
    slug: string;
    title: string;
    subtitle?: string | null;
    status?: PollStatus;
    category?: string;
    geography?: string | null;
    target_responses?: number | null;
    show_results_live?: boolean;
    published_at?: string | null;
    closes_at?: string | null;
  };
  total_responses: number;
  completion_rate: number | null;
  questions: ResultQuestion[];
  text_responses: TextResponse[];
};

export type LeaderboardRow = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  country: string | null;
  reputation_points: number;
  polls_completed: number;
  current_streak: number;
};

export type PlatformStats = {
  total_polls: number;
  total_responses: number;
  total_members: number;
  live_polls: number;
  countries: number;
  avg_points: number;
};

export type MyActivity = {
  profile: Profile | null;
  completed: {
    poll_id: string;
    slug: string;
    title: string;
    category: string;
    status: PollStatus;
    completed_at: string;
    points_awarded: number;
    duration_seconds: number | null;
  }[];
  saved: {
    id: string;
    slug: string;
    title: string;
    category: string;
    status: PollStatus;
    created_at: string;
  }[];
  rank: number;
};

export type SubmitResult = {
  poll_slug: string;
  points_awarded: number;
  total_points: number;
  streak: number;
  results_visible: boolean;
};

export type StudioPoll = {
  id: string;
  slug: string;
  title: string;
  category: string;
  status: PollStatus;
  published_at: string | null;
  closes_at: string | null;
  target_responses: number | null;
  incentive_points: number;
  is_featured: boolean;
  question_count: number;
  response_count: number;
  avg_seconds: number | null;
};

export type StudioDashboard = {
  polls: StudioPoll[];
  totals: {
    polls: number;
    live: number;
    drafts: number;
    responses: number;
    points_paid: number;
  };
};

export type AdminMember = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: MemberRole;
  country: string | null;
  age_band: string | null;
  gender: string | null;
  reputation_points: number;
  polls_completed: number;
  is_demo: boolean;
  created_at: string;
};

export type AdminPoll = {
  id: string;
  slug: string;
  title: string;
  category: string;
  status: PollStatus;
  created_by: string | null;
  created_at: string;
  published_at: string | null;
  response_count: number;
};

export type AdminOverview = {
  stats: PlatformStats;
  members: AdminMember[];
  polls: AdminPoll[];
};

export type CrosstabRow = {
  question_id: string;
  group: string;
  group_size: number;
  options: { option_id: string; label: string; votes: number; pct: number }[];
};

export type Crosstab = { dimension: string; rows: CrosstabRow[] };

export type PollComment = {
  id: string;
  body: string;
  created_at: string;
  parent_id: string | null;
  author_id: string | null;
  author_name: string | null;
  author_avatar: string | null;
  author_points: number;
  reply_count: number;
};

export type SurveyAnswer = {
  questionId: string;
  optionIds?: string[];
  numericValue?: number | null;
  textValue?: string | null;
};
