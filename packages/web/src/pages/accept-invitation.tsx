import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Loader2, CheckCircle, XCircle, Mail, User, Phone, Car } from 'lucide-react';
import { toast } from 'sonner';
import { driverInvitationService } from '../services/driver-invitation.service';
import { authService } from '../services/auth.service';
import { DriverInvitation } from '../types';

const acceptInvitationSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type AcceptInvitationForm = z.infer<typeof acceptInvitationSchema>;

export function AcceptInvitationPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  const [invitation, setInvitation] = useState<DriverInvitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AcceptInvitationForm>({
    resolver: zodResolver(acceptInvitationSchema),
  });

  useEffect(() => {
    const loadInvitation = async () => {
      if (!token) {
        setError('Invalid invitation link');
        setLoading(false);
        return;
      }

      try {
        const invitationData = await driverInvitationService.getInvitationByToken(token);
        
        // Check if invitation is still valid
        if (invitationData.status !== 'pending') {
          if (invitationData.status === 'accepted') {
            setError('This invitation has already been accepted');
          } else if (invitationData.status === 'expired') {
            setError('This invitation has expired');
          } else if (invitationData.status === 'cancelled') {
            setError('This invitation has been cancelled');
          }
          setLoading(false);
          return;
        }

        // Check if invitation has expired
        const expiresAt = new Date(invitationData.expiresAt);
        if (expiresAt < new Date()) {
          setError('This invitation has expired');
          setLoading(false);
          return;
        }

        setInvitation(invitationData);
      } catch (error: any) {
        console.error('Load invitation error:', error);
        setError(error.message || 'Failed to load invitation details');
      } finally {
        setLoading(false);
      }
    };

    loadInvitation();
  }, [token]);

  const onSubmit = async (data: AcceptInvitationForm) => {
    if (!token || !invitation) return;

    setSubmitting(true);
    setError(null);

    try {
      const result = await driverInvitationService.acceptInvitation({
        token,
        password: data.password,
      });

      setSuccess(true);
      toast.success('Account created successfully!');
      
      // Auto-login after successful registration
      setTimeout(async () => {
        try {
          await authService.login(invitation.email, data.password);
          navigate('/dashboard');
        } catch (loginError) {
          navigate('/login', { 
            state: { 
              message: 'Account created successfully. Please log in.',
              email: invitation.email 
            }
          });
        }
      }, 2000);

    } catch (error: any) {
      console.error('Accept invitation error:', error);
      setError(error.message || 'Failed to accept invitation');
      toast.error('Failed to create account', {
        description: error.message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading invitation...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle>Invalid Invitation</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate('/login')} 
              className="w-full"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <CardTitle>Welcome to ZoneFlow!</CardTitle>
            <CardDescription>
              Your account has been created successfully. You will be redirected to the dashboard shortly.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Mail className="h-12 w-12 text-blue-500 mx-auto mb-4" />
          <CardTitle>Accept Invitation</CardTitle>
          <CardDescription>
            You've been invited to join ZoneFlow as a driver
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Invitation Details */}
          <div className="mb-6 p-4 bg-primary-foreground border border-border rounded-lg space-y-3">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">Name:</span>
              <span className="text-sm">{invitation?.name}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">Email:</span>
              <span className="text-sm">{invitation?.email}</span>
            </div>
            {invitation?.phone && (
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Phone:</span>
                <span className="text-sm">{invitation.phone}</span>
              </div>
            )}
            {invitation?.vehicleType && (
              <div className="flex items-center space-x-2">
                <Car className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Vehicle Type:</span>
                <span className="text-sm capitalize">{invitation.vehicleType}</span>
              </div>
            )}
          </div>

          {invitation?.message && (
            <Alert className="mb-6">
              <AlertDescription>{invitation.message}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Create Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                {...register('password')}
                className={errors.password ? 'border-red-500' : ''}
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                {...register('confirmPassword')}
                className={errors.confirmPassword ? 'border-red-500' : ''}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
              )}
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                Sign in
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}