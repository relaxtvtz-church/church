export interface PublicSettings {
  church_name: string;
  logo_url: string | null;
  location: string;
  phone: string;
  email: string;
  welcome_message: string;
  feedback_intro: string;
  footer_text: string;
  service_info: string;
  map_lat: string;
  map_lng: string;
  instagram_url: string;
  tiktok_url: string;
  facebook_url: string;
  youtube_url: string;
}

export interface AdminSettings extends PublicSettings {
  id: number;
  updated_at: string;
}

export interface StaffMember {
  id: number;
  full_name: string;
  position: string;
  ministry: string;
  bio: string;
  photo_url: string | null;
  status: 'active' | 'inactive';
  total_reviews?: number;
  average_rating?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface PublicStaff {
  id: number;
  full_name: string;
  position: string;
  ministry: string;
  bio: string;
  photo_url: string | null;
}

export interface Review {
  id: number;
  reviewer_name: string | null;
  phone: string | null;
  staff_id: number | null;
  staff_name: string | null;
  category: string;
  rating: number;
  message: string;
  status: 'new' | 'reviewed' | 'archived';
  created_at: string;
  position?: string | null;
}

export interface StaffRating {
  id: number;
  full_name: string;
  position: string;
  photo_url: string | null;
  status: string;
  total_reviews: number;
  average_rating: number | null;
}

export interface OverviewStats {
  totalReviews: number;
  averageRating: number;
  reviewsThisMonth: number;
  activeStaff: number;
  distribution: { rating: number; count: number }[];
  submissions: { month: string; count: number }[];
  staffRatings: StaffRating[];
  generalFeedback: { total_reviews: number; average_rating: number | null };
  recentReviews: Review[];
}

export interface ReviewFilters {
  search?: string;
  staffId?: number | string;
  category?: string;
  rating?: number | string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
}

export interface ReviewListResponse {
  reviews: Review[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface PublicAdvertisement {
  title: string;
  description: string;
  university: string;
  image_url: string | null;
  cta_label: string;
  is_active: boolean;
}

export interface Advertisement extends Omit<PublicAdvertisement, 'is_active'> {
  id: number;
  is_active: number;
  updated_at: string;
}

export interface Registration {
  id: number;
  full_name: string;
  parent_name: string;
  email: string;
  phone: string;
  guardian_phone: string;
  location: string;
  status: string;
  studying_at: string;
  university: string;
  comments: string;
  created_at: string;
}

export interface RegistrationListResponse {
  registrations: Registration[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}
