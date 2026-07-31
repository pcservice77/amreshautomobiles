'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handlePermissionError = (error: FirestorePermissionError) => {
      // Surface the error to the console for the developer overlay to catch
      // In the agentive loop, this surfaces as a rich contextual error.
      toast({
        variant: 'destructive',
        title: 'Permission Denied',
        description: `Access denied for ${error.context.operation} at ${error.context.path}.`,
      });
      
      // Throwing the error ensures it hits the Next.js development overlay
      // providing the specific JSON context required for the AI to fix rules.
      throw error;
    };

    errorEmitter.on('permission-error', handlePermissionError);
    return () => {
      errorEmitter.off('permission-error', handlePermissionError);
    };
  }, [toast]);

  return null;
}
