import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { MoreHorizontal, Search, RefreshCw, Mail, X } from 'lucide-react';
import { toast } from 'sonner';
import { driverInvitationService } from '../../services/driver-invitation.service';
import { DriverInvitation, InvitationStats } from '../../types';

interface DriverInvitationsListProps {
  onRefresh?: () => void;
}

export function DriverInvitationsList({ onRefresh }: DriverInvitationsListProps) {
  const [invitations, setInvitations] = useState<DriverInvitation[]>([]);
  const [stats, setStats] = useState<InvitationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedInvitation, setSelectedInvitation] = useState<DriverInvitation | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadInvitations = async () => {
    try {
      setLoading(true);
      const [invitationsData, statsData] = await Promise.all([
        driverInvitationService.getInvitations({
          search: searchTerm || undefined,
          status: statusFilter === 'all' ? undefined : statusFilter,
        }),
        driverInvitationService.getInvitationStats(),
      ]);
      
      // Ensure invitations is always an array, even if API returns unexpected data
      const invitations = Array.isArray(invitationsData?.data) ? invitationsData.data : [];
      setInvitations(invitations);
      setStats(statsData || null);
    } catch (error: any) {
      console.error('Failed to load invitations:', error);
      // Reset to empty array on error to prevent undefined access
      setInvitations([]);
      setStats(null);
      toast.error('Failed to load invitations', {
        description: error.message || 'An unexpected error occurred',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvitations();
  }, [searchTerm, statusFilter]);

  const handleResendInvitation = async (invitation: DriverInvitation) => {
    setActionLoading(invitation.id);
    try {
      await driverInvitationService.resendInvitation(invitation.id);
      toast.success('Invitation resent successfully');
      loadInvitations();
    } catch (error: any) {
      toast.error('Failed to resend invitation', {
        description: error.message,
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelInvitation = async () => {
    if (!selectedInvitation) return;
    
    setActionLoading(selectedInvitation.id);
    try {
      await driverInvitationService.cancelInvitation(selectedInvitation.id);
      toast.success('Invitation cancelled successfully');
      setShowCancelDialog(false);
      setSelectedInvitation(null);
      loadInvitations();
      onRefresh?.();
    } catch (error: any) {
      toast.error('Failed to cancel invitation', {
        description: error.message,
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'default',
      accepted: 'success',
      expired: 'destructive',
      cancelled: 'secondary',
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'default'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const canResend = (invitation: DriverInvitation) => {
    return invitation.status === 'pending' || invitation.status === 'expired';
  };

  const canCancel = (invitation: DriverInvitation) => {
    return invitation.status === 'pending';
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Accepted</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.accepted}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expired</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{stats.cancelled}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          onClick={loadInvitations}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Invitations Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Invited By</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Loading invitations...
                </TableCell>
              </TableRow>
            ) : !invitations || invitations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  No invitations found
                </TableCell>
              </TableRow>
            ) : (
              (invitations || []).map((invitation) => (
                <TableRow key={invitation.id}>
                  <TableCell className="font-medium">{invitation.email}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{invitation.name || 'N/A'}</span>
                      {invitation.vehicleType && (
                        <span className="text-sm text-gray-500">{invitation.vehicleType}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(invitation.status)}</TableCell>
                  <TableCell>{invitation.invitedByName || invitation.invitedBy}</TableCell>
                  <TableCell>{format(new Date(invitation.createdAt), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>{format(new Date(invitation.expiresAt), 'MMM dd, yyyy')}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {canResend(invitation) && (
                          <DropdownMenuItem
                            onClick={() => handleResendInvitation(invitation)}
                            disabled={actionLoading === invitation.id}
                          >
                            <Mail className="mr-2 h-4 w-4" />
                            Resend
                          </DropdownMenuItem>
                        )}
                        {canCancel(invitation) && (
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedInvitation(invitation);
                              setShowCancelDialog(true);
                            }}
                            disabled={actionLoading === invitation.id}
                            className="text-red-600"
                          >
                            <X className="mr-2 h-4 w-4" />
                            Cancel
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Invitation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel the invitation for{' '}
              <strong>{selectedInvitation?.email}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelInvitation}
              disabled={actionLoading !== null}
              className="bg-red-600 hover:bg-red-700"
            >
              {actionLoading ? 'Cancelling...' : 'Cancel Invitation'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}