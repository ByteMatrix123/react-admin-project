import { createFileRoute, Navigate } from '@tanstack/react-router';
import { useAuthStore } from '../stores/authStore';

export const Route = createFileRoute('/')({
  component: () => {
    const { checkAuthenticated } = useAuthStore();
    
    if (checkAuthenticated()) {
      return <Navigate to="/dashboard" replace />;
    } else {
      return <Navigate to="/login" replace />;
    }
  },
}); 
