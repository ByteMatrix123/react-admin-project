import { createFileRoute } from '@tanstack/react-router';
import MainLayout from '../layouts/MainLayout';
import Profile from '../pages/Profile';
import ProtectedRoute from '../components/ProtectedRoute';

export const Route = createFileRoute('/profile')({
  component: () => (
    <ProtectedRoute requiredPermissions={['profile:update']}>
      <MainLayout>
        <Profile />
      </MainLayout>
    </ProtectedRoute>
  ),
}); 
