import { createFileRoute } from '@tanstack/react-router';
import ApiTest from '../pages/ApiTest';

export const Route = createFileRoute('/api-test')({
  component: ApiTest,
}); 
