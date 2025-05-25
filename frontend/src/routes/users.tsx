import { createFileRoute } from '@tanstack/react-router';
import MainLayout from '../layouts/MainLayout';
import UserManagement from '../pages/UserManagement';
import ProtectedRoute from '../components/ProtectedRoute';

export const Route = createFileRoute('/users')({
  component: () => (
    <ProtectedRoute requiredPermissions={['user:read']}>
      <MainLayout>
        <UserManagement />
      </MainLayout>
    </ProtectedRoute>
  ),
}); 
