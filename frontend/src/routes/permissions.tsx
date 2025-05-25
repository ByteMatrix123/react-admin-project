import { createFileRoute } from '@tanstack/react-router';
import MainLayout from '../layouts/MainLayout';
import PermissionManagement from '../pages/PermissionManagement';
import ProtectedRoute from '../components/ProtectedRoute';

export const Route = createFileRoute('/permissions')({
  component: () => (
    <ProtectedRoute requiredPermissions={['permission:manage']}>
      <MainLayout>
        <PermissionManagement />
      </MainLayout>
    </ProtectedRoute>
  ),
});
