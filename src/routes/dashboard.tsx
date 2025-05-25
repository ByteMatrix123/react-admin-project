import { createFileRoute } from '@tanstack/react-router';
import MainLayout from '../layouts/MainLayout';
import Dashboard from '../pages/Dashboard';
import ProtectedRoute from '../components/ProtectedRoute';

export const Route = createFileRoute('/dashboard')({
  component: () => (
    <ProtectedRoute>
      <MainLayout>
        <Dashboard />
      </MainLayout>
    </ProtectedRoute>
  ),
}); 
