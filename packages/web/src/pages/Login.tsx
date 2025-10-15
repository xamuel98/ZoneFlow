import { useState } from 'react'
import { Link } from 'react-router-dom'
import { RiEyeLine, RiEyeOffLine, RiTruckLine, RiMailLine, RiLockLine, RiUserLine, RiBuildingLine } from '@remixicon/react'
import { toast } from 'sonner'
import { useAuthStore } from '../stores/auth.store'
import LoadingSpinner from '../components/loading-spinner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'

const Login = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'business_owner' as 'business_owner' | 'driver',
    businessName: ''
  })

  const { login, register } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (isLogin) {
        await login(formData.email, formData.password)
        toast.success('Welcome back!')
      } else {
        await register({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          role: formData.role,
          businessName: formData.role === 'business_owner' ? formData.businessName : undefined
        })
        toast.success('Account created successfully!')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Authentication failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleRoleChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      role: value as 'business_owner' | 'driver'
    }))
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo and Header */}
        <div className="text-center">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <RiTruckLine className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="mt-6 text-3xl font-bold text-gray-900">ZoneFlow</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Logistics management made simple
          </p>
        </div>

        {/* Authentication Card */}
        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-bold text-center">
              {isLogin ? 'Welcome back' : 'Create account'}
            </CardTitle>
            <CardDescription className="text-center">
              {isLogin 
                ? 'Enter your credentials to access your account' 
                : 'Fill in your information to get started'
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name field for registration */}
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <RiUserLine className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      required={!isLogin}
                      value={formData.name}
                      onChange={handleInputChange}
                      className="pl-10"
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>
              )}

              {/* Email field */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <RiMailLine className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="pl-10"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <RiLockLine className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="pl-10 pr-10"
                    placeholder="Enter your password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  >
                    {showPassword ? (
                      <RiEyeOffLine className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <RiEyeLine className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Registration-only fields */}
              {!isLogin && (
                <>
                  {/* Role selection */}
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={formData.role} onValueChange={handleRoleChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="business_owner">Business Owner</SelectItem>
                        <SelectItem value="driver">Driver</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Business name for business owners */}
                  {formData.role === 'business_owner' && (
                    <div className="space-y-2">
                      <Label htmlFor="businessName">Business Name</Label>
                      <div className="relative">
                        <RiBuildingLine className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="businessName"
                          name="businessName"
                          type="text"
                          required={formData.role === 'business_owner'}
                          value={formData.businessName}
                          onChange={handleInputChange}
                          className="pl-10"
                          placeholder="Enter your business name"
                        />
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Submit button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full mt-6"
                size="lg"
              >
                {isLoading && <LoadingSpinner size="sm" className="mr-2" />}
                {isLogin ? 'Sign in' : 'Create account'}
              </Button>
            </form>

            {/* Toggle between login/register */}
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {isLogin ? "Don't have an account? " : 'Already have an account? '}
                <Button
                  type="button"
                  variant="link"
                  onClick={() => setIsLogin(!isLogin)}
                  className="p-0 h-auto font-medium"
                >
                  {isLogin ? 'Sign up' : 'Sign in'}
                </Button>
              </p>
            </div>

            {/* Public tracking link */}
            {isLogin && (
              <div className="mt-4 text-center">
                <Link to="/track/demo">
                  <Button variant="link" className="text-sm">
                    Track a package without signing in
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login