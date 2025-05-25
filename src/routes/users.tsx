import { createFileRoute } from '@tanstack/react-router';
import MainLayout from '../layouts/MainLayout';
import UserManagement from '../pages/UserManagement';

export const Route = createFileRoute('/users')({
  component: () => (
    <MainLayout>
      <UserManagement />
    </MainLayout>
  ),
}); 
