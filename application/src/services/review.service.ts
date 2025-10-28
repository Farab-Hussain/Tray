import { api } from '../lib/fetcher';

export const ReviewService = {
  // Submit a review for a consultant
  async submitReview(reviewData: {
    consultantId: string;
    rating: number;
    comment: string;
    recommend?: boolean;
  }) {
    const response = await api.post('/reviews', reviewData);
    return response.data;
  },

  // Get reviews for a consultant
  async getConsultantReviews(consultantId: string) {
    const response = await api.get(`/reviews/consultant/${consultantId}`);
    return response.data;
  },

  // Get my reviews (as a student)
  async getMyReviews() {
    const response = await api.get('/reviews/my-reviews');
    return response.data;
  },

  // Update a review
  async updateReview(reviewId: string, reviewData: {
    rating?: number;
    comment?: string;
    recommend?: boolean;
  }) {
    const response = await api.put(`/reviews/${reviewId}`, reviewData);
    return response.data;
  },

  // Delete a review
  async deleteReview(reviewId: string) {
    const response = await api.delete(`/reviews/${reviewId}`);
    return response.data;
  },
};

