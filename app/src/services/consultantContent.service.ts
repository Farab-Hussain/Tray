import { api } from '../lib/fetcher';

export interface ConsultantContentInput {
  title: string;
  description: string;
  contentType: 'video' | 'pdf' | 'article' | 'tip' | 'guide' | 'resource';
  contentUrl?: string;
  thumbnailUrl?: string;
  tags: string[];
  category: string;
  isFree: boolean;
  price?: number;
}

export interface ConsultantContent {
  id: string;
  consultantId: string;
  title: string;
  description: string;
  contentType: 'video' | 'pdf' | 'article' | 'tip' | 'guide' | 'resource';
  contentUrl?: string;
  contentData?: {
    text?: string;
    duration?: number;
    fileSize?: number;
    pageCount?: number;
  };
  thumbnailUrl?: string;
  tags: string[];
  category: string;
  isFree: boolean;
  price?: number;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'published';
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  viewCount: number;
  downloadCount: number;
  likeCount: number;
  rating: number;
  ratingCount: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface ContentRating {
  id: string;
  contentId: string;
  userId: string;
  rating: number; // 1-5
  comment?: string;
  createdAt: string;
}

class ConsultantContentService {
  /**
   * Create new content
   */
  async createContent(contentData: ConsultantContentInput): Promise<ConsultantContent> {
    try {
      const response = await api.post<ConsultantContent>('/consultant-content', contentData);
      return response.data;
    } catch (error: any) {
      if (__DEV__) {
        console.error('Error creating content:', error);
      }
      throw new Error(error.response?.data?.error || 'Failed to create content');
    }
  }

  /**
   * Get consultant's content
   */
  async getMyContent(filters?: {
    status?: string;
    contentType?: string;
    category?: string;
    page?: number;
    limit?: number;
  }): Promise<{ content: ConsultantContent[]; total: number }> {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.contentType) params.append('contentType', filters.contentType);
      if (filters?.category) params.append('category', filters.category);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await api.get<{ content: ConsultantContent[]; total: number }>(
        `/consultant-content/my?${params.toString()}`
      );
      return response.data;
    } catch (error: any) {
      if (__DEV__) {
        console.error('Error fetching consultant content:', error);
      }
      throw new Error(error.response?.data?.error || 'Failed to fetch content');
    }
  }

  /**
   * Get published content (public)
   */
  async getPublishedContent(filters?: {
    category?: string;
    contentType?: string;
    tags?: string[];
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{ content: ConsultantContent[]; total: number }> {
    try {
      const params = new URLSearchParams();
      if (filters?.category) params.append('category', filters.category);
      if (filters?.contentType) params.append('contentType', filters.contentType);
      if (filters?.tags?.length) params.append('tags', filters.tags.join(','));
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.search) params.append('search', filters.search);

      const response = await api.get<{ content: ConsultantContent[]; total: number }>(
        `/consultant-content/published?${params.toString()}`
      );
      return response.data;
    } catch (error: any) {
      if (__DEV__) {
        console.error('Error fetching published content:', error);
      }
      throw new Error(error.response?.data?.error || 'Failed to fetch content');
    }
  }

  /**
   * Get content by ID
   */
  async getContentById(contentId: string): Promise<ConsultantContent> {
    try {
      const response = await api.get<ConsultantContent>(`/consultant-content/published/${contentId}`);
      return response.data;
    } catch (error: any) {
      if (__DEV__) {
        console.error('Error fetching content:', error);
      }
      throw new Error(error.response?.data?.error || 'Failed to fetch content');
    }
  }

  /**
   * Update content
   */
  async updateContent(contentId: string, updates: Partial<ConsultantContentInput>): Promise<ConsultantContent> {
    try {
      const response = await api.put<ConsultantContent>(`/consultant-content/${contentId}`, updates);
      return response.data;
    } catch (error: any) {
      if (__DEV__) {
        console.error('Error updating content:', error);
      }
      throw new Error(error.response?.data?.error || 'Failed to update content');
    }
  }

  /**
   * Delete content
   */
  async deleteContent(contentId: string): Promise<void> {
    try {
      await api.delete(`/consultant-content/${contentId}`);
    } catch (error: any) {
      if (__DEV__) {
        console.error('Error deleting content:', error);
      }
      throw new Error(error.response?.data?.error || 'Failed to delete content');
    }
  }

  /**
   * Add rating to content
   */
  async addRating(contentId: string, rating: number, comment?: string): Promise<void> {
    try {
      await api.post(`/consultant-content/${contentId}/rating`, {
        rating,
        comment,
      });
    } catch (error: any) {
      if (__DEV__) {
        console.error('Error adding rating:', error);
      }
      throw new Error(error.response?.data?.error || 'Failed to add rating');
    }
  }

  /**
   * Get consultant stats
   */
  async getConsultantStats(): Promise<{
    totalContent: number;
    publishedContent: number;
    totalViews: number;
    totalDownloads: number;
    totalLikes: number;
    averageRating: number;
    totalRevenue: number;
  }> {
    try {
      const response = await api.get('/consultant-content/my/stats');
      return response.data;
    } catch (error: any) {
      if (__DEV__) {
        console.error('Error fetching consultant stats:', error);
      }
      throw new Error(error.response?.data?.error || 'Failed to fetch stats');
    }
  }

  /**
   * Download content (track download count)
   */
  async downloadContent(contentId: string): Promise<string> {
    try {
      const response = await api.post(`/consultant-content/${contentId}/download`);
      return response.data.downloadUrl;
    } catch (error: any) {
      if (__DEV__) {
        console.error('Error downloading content:', error);
      }
      throw new Error(error.response?.data?.error || 'Failed to download content');
    }
  }
}

export default new ConsultantContentService();
