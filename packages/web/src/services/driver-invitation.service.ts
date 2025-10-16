import { apiService } from './api';
import {
  DriverInvitation,
  CreateDriverInvitationRequest,
  AcceptInvitationRequest,
  InvitationStats,
  PaginatedResponse
} from '../types';

export class DriverInvitationService {
  // Create a new driver invitation
  async createInvitation(data: CreateDriverInvitationRequest): Promise<DriverInvitation> {
    return apiService.post<DriverInvitation>('drivers/invitations', data);
  }

  // Get all driver invitations with pagination
  async getInvitations(params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<PaginatedResponse<DriverInvitation>> {
    return apiService.get<PaginatedResponse<DriverInvitation>>('drivers/invitations', params);
  }

  // Get a specific invitation by ID
  async getInvitation(id: string): Promise<DriverInvitation> {
    return apiService.get<DriverInvitation>(`drivers/invitations/${id}`);
  }

  // Update invitation status
  async updateInvitation(id: string, data: { status: string; message?: string }): Promise<DriverInvitation> {
    return apiService.put<DriverInvitation>(`drivers/invitations/${id}`, data);
  }

  // Resend invitation
  async resendInvitation(id: string): Promise<DriverInvitation> {
    return apiService.post<DriverInvitation>(`drivers/invitations/${id}/resend`);
  }

  // Cancel invitation
  async cancelInvitation(id: string): Promise<void> {
    return apiService.delete<void>(`drivers/invitations/${id}`);
  }

  // Accept invitation (public endpoint)
  async acceptInvitation(data: AcceptInvitationRequest): Promise<{ user: any; driver: any }> {
    return apiService.publicPost<{ user: any; driver: any }>('drivers/accept-invitation', data);
  }

  // Get invitation by token (public endpoint)
  async getInvitationByToken(token: string): Promise<DriverInvitation> {
    return apiService.publicGet<DriverInvitation>(`drivers/invitations/token/${token}`);
  }

  // Get invitation statistics
  async getInvitationStats(): Promise<InvitationStats> {
    return apiService.get<InvitationStats>('drivers/invitations/stats');
  }

  // Bulk cancel invitations
  async bulkCancelInvitations(ids: string[]): Promise<{ cancelled: number; errors: any[] }> {
    return apiService.post<{ cancelled: number; errors: any[] }>('drivers/invitations/bulk-cancel', { ids });
  }
}

export const driverInvitationService = new DriverInvitationService();