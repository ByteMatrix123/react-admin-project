import { createFileRoute } from '@tanstack/react-router';
import MainLayout from '../layouts/MainLayout';
import Settings from '../pages/Settings';
import ProtectedRoute from '../components/ProtectedRoute';

export const Route = createFileRoute('/settings')({
  component: () => (
    <ProtectedRoute requiredRoles={['admin', 'manager']}>
      <MainLayout>
        <Settings />
      </MainLayout>
    </ProtectedRoute>
  ),
}); 
