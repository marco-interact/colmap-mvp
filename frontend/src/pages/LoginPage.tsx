import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';
import { LoadingSpinner } from '../components/LoadingSpinner.tsx';
import { Box, Eye, EyeOff } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = location.state?.from?.pathname || '/';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await login(formData);
      navigate(from, { replace: true });
    } catch (error) {
      // Error is handled by the auth context
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen md-flex md-align-center md-justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 md-padding-md">
      <div className="md-container">
        <div className="md-grid md-justify-center">
          <div className="md-grid-item md-col-xs-12 md-col-sm-8 md-col-md-6 md-col-lg-4">
            <div className="md-spacing-lg">
              {/* Header */}
              <div className="text-center md-spacing-lg">
                <div className="md-flex md-justify-center md-spacing-md">
                  <div className="w-16 h-16 md-surface rounded-2xl md-flex md-align-center md-justify-center shadow-lg">
                    <Box className="w-8 h-8 md-primary" style={{color: '#6750a4'}} />
                  </div>
                </div>
                <h2 className="md-headline-medium text-white md-spacing-sm">
                  Welcome Back
                </h2>
                <p className="md-body-large text-blue-100">
                  Sign in to your 3D Visualization Platform account
                </p>
              </div>

              {/* Login Form */}
              <div className="md-card md-card-elevated md-padding-lg">
                <form className="md-spacing-md" onSubmit={handleSubmit}>
                  <div className="md-text-field">
                    <input
                      id="username"
                      name="username"
                      type="text"
                      required
                      placeholder=" "
                      value={formData.username}
                      onChange={handleChange}
                      disabled={isLoading}
                    />
                    <label htmlFor="username">Username</label>
                  </div>

                  <div className="md-text-field">
                    <div className="relative">
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder=" "
                        value={formData.password}
                        onChange={handleChange}
                        disabled={isLoading}
                      />
                      <label htmlFor="password">Password</label>
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 md-flex md-align-center"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="md-flex md-justify-between md-align-center md-spacing-md">
                    <div className="md-flex md-align-center">
                      <input
                        id="remember-me"
                        name="remember-me"
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="remember-me" className="ml-2 md-body-medium">
                        Remember me
                      </label>
                    </div>

                    <div>
                      <a href="#" className="md-body-small font-medium text-blue-600 hover:text-blue-500">
                        Forgot password?
                      </a>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="md-button md-button-filled w-full md-flex md-align-center md-justify-center"
                  >
                    {isLoading ? (
                      <LoadingSpinner size="small" text="" />
                    ) : (
                      'Sign In'
                    )}
                  </button>
                </form>

                <div className="md-spacing-md">
                  <div className="relative">
                    <div className="absolute inset-0 md-flex md-align-center">
                      <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative md-flex md-justify-center">
                      <span className="px-2 md-surface md-body-small text-gray-500">Or</span>
                    </div>
                  </div>

                  <div className="md-spacing-md text-center">
                    <p className="md-body-medium text-gray-600">
                      Don't have an account?{' '}
                      <Link
                        to="/register"
                        className="font-medium text-blue-600 hover:text-blue-500"
                      >
                        Sign up here
                      </Link>
                    </p>
                  </div>
                </div>
              </div>

              {/* Demo Credentials */}
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl md-padding-md md-spacing-md">
                <p className="text-blue-100 md-body-medium text-center font-medium md-spacing-sm">🚀 Demo Credentials Available:</p>
                <div className="md-spacing-sm">
                  <div className="md-flex md-justify-between md-align-center bg-white bg-opacity-10 rounded-lg md-padding-sm md-spacing-xs">
                    <span className="text-blue-100 md-body-small">Demo User:</span>
                    <span className="text-white font-mono md-body-small">demo / demo123</span>
                  </div>
                  <div className="md-flex md-justify-between md-align-center bg-white bg-opacity-10 rounded-lg md-padding-sm md-spacing-xs">
                    <span className="text-blue-100 md-body-small">Admin User:</span>
                    <span className="text-white font-mono md-body-small">admin / admin123</span>
                  </div>
                  <div className="md-flex md-justify-between md-align-center bg-white bg-opacity-10 rounded-lg md-padding-sm md-spacing-xs">
                    <span className="text-blue-100 md-body-small">Test User:</span>
                    <span className="text-white font-mono md-body-small">testuser / test123</span>
                  </div>
                </div>
                <div className="md-spacing-sm text-center">
                  <button 
                    type="button"
                    onClick={() => setFormData({ username: 'demo', password: 'demo123' })}
                    className="md-button-text text-blue-200 hover:text-white underline md-body-small"
                  >
                    Click to use demo credentials
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


