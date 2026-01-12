import React from 'react';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

const LoginPage = () => {
    const navigate = useNavigate();

    const handleSuccess = (credentialResponse: CredentialResponse) => {
        if (credentialResponse.credential) {
            try {
                const decoded: any = jwtDecode(credentialResponse.credential);
                console.log('Login Success:', decoded);

                // Save user to localStorage
                const user = {
                    name: decoded.name,
                    email: decoded.email,
                    picture: decoded.picture,
                    id: decoded.sub
                };

                // Save to backend
                try {
                    fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8089'}/api/users`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(user),
                    }).then(res => res.json())
                        .then(data => console.log('User saved to DB:', data))
                        .catch(err => console.error('Error saving user to DB:', err));
                } catch (error) {
                    console.error("Backend sync failed", error);
                }

                localStorage.setItem('travel_planner_user', JSON.stringify(user));

                // Navigate to home
                navigate('/');
                // Force reload to update Navbar state if it doesn't listen to storage
                window.location.href = '/';
            } catch (error) {
                console.error("Token decoding failed:", error);
            }
        }
    };

    const handleError = () => {
        console.log('Login Failed');
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 via-background to-secondary/5 pointer-events-none" />

            {/* Back to Home */}
            <Button
                variant="ghost"
                className="absolute top-4 left-4 gap-2 z-20"
                onClick={() => navigate('/')}
            >
                <Home className="w-4 h-4" />
                Back to Home
            </Button>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md bg-card border border-border rounded-xl shadow-xl p-8 relative z-10"
            >
                <div className="flex flex-col items-center gap-6 text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                        <Lock className="w-8 h-8 text-primary" />
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                            Welcome Back
                        </h1>
                        <p className="text-muted-foreground">
                            Sign in to manage your trips and saved destinations
                        </p>
                    </div>

                    <div className="w-full flex justify-center py-4">
                        {/* The GoogleLogin component is provided by @react-oauth/google */}
                        <GoogleLogin
                            onSuccess={handleSuccess}
                            onError={handleError}
                            theme="filled_blue"
                            shape="pill"
                            text="signin_with"
                            size="large" // String type, but sometimes typed as 'large' | 'medium' | 'small'
                            width="100%"
                        />
                    </div>

                    <p className="text-xs text-muted-foreground">
                        By signing in, you agree to our Terms of Service and Privacy Policy.
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default LoginPage;
