"use client"

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Zap, Loader2, ArrowRight, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/firebase';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const forgotSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const forgotForm = useForm<z.infer<typeof forgotSchema>>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: z.infer<typeof loginSchema>) => {
    if (!auth) return;
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      toast({ title: 'Welcome Back!', description: 'Redirecting to your dashboard...' });
      router.push('/');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Authentication Failed',
        description: error.message || 'Invalid credentials. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const onResetSubmit = async (data: z.infer<typeof forgotSchema>) => {
    if (!auth) return;
    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, data.email);
      toast({ 
        title: 'Reset Link Sent', 
        description: `Check your inbox at ${data.email} to reset your password.` 
      });
      setIsResetOpen(false);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Could not send reset email.',
      });
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md border-white/5 bg-card/50 backdrop-blur-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <Zap className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl font-headline font-bold uppercase tracking-tight">
            AMRESH <span className="text-primary">AUTOMOBILES</span>
          </CardTitle>
          <CardDescription>
            Enter your credentials to access your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="name@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Password</FormLabel>
                      <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
                        <DialogTrigger asChild>
                          <button type="button" className="text-xs text-primary hover:underline font-medium">
                            Forgot password?
                          </button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <KeyRound className="h-5 w-5 text-primary" />
                              Reset Password
                            </DialogTitle>
                            <DialogDescription>
                              Enter your email address and we'll send you a link to reset your password.
                            </DialogDescription>
                          </DialogHeader>
                          <Form {...forgotForm}>
                            <form onSubmit={forgotForm.handleSubmit(onResetSubmit)} className="space-y-4 pt-4">
                              <FormField
                                control={forgotForm.control}
                                name="email"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Registered Email</FormLabel>
                                    <FormControl>
                                      <Input placeholder="you@example.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <Button type="submit" className="w-full" disabled={resetLoading}>
                                {resetLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Reset Link'}
                              </Button>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full gap-2" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                Sign In
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <div className="text-sm text-center text-muted-foreground">
            Don't have an account?{' '}
            <Link href="/register" className="text-primary hover:underline font-medium">
              Register now
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
