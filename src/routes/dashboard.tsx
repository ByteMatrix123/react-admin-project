import { createFileRoute } from '@tanstack/react-router';
import MainLayout from '../layouts/MainLayout';
import Dashboard from '../pages/Dashboard';

export const Route = createFileRoute('/dashboard')({
  component: () => (
    <MainLayout>
      <Dashboard />
    </MainLayout>
  ),
}); 
