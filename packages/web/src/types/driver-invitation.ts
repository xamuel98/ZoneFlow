// Driver Invitation Types
export interface DriverInvitation {
  id: string;
  email: string;
  name: string;
  phone?: string;
  vehicleType?: string;
  licensePlate?: string;
  message?: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  invitedBy: string;
  invitedByName?: string;
  businessId: string;
  token: string;
  createdAt: string;
  expiresAt: string;
  acceptedAt?: string;
}

export interface CreateDriverInvitationRequest {
  email: string;
  name: string;
  phone?: string;
  vehicleType?: string;
  licensePlate?: string;
  message?: string;
  expiresInDays?: number;
}

export interface AcceptInvitationRequest {
  token: string;
  password: string;
}

export interface InvitationStats {
  total: number;
  pending: number;
  accepted: number;
  expired: number;
  cancelled: number;
}

export type InvitationStatus = DriverInvitation['status'];