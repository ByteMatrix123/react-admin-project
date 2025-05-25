/**
 * 前端API集成测试
 * 用于验证Week 4前端集成工作是否完成
 */

import apiClient from './api';
import { AuthService } from '../services/authService';
import { UserService } from '../services/userService';

interface TestResult {
  name: string;
  success: boolean;
  message: string;
  duration: number;
}

class IntegrationTester {
  private results: TestResult[] = [];

  private async runTest(name: string, testFn: () => Promise<void>): Promise<void> {
    const startTime = Date.now();
    try {
      await testFn();
      const duration = Date.now() - startTime;
      this.results.push({
        name,
        success: true,
        message: '测试通过',
        duration,
      });
      console.log(`✅ ${name} - 通过 (${duration}ms)`);
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.results.push({
        name,
        success: false,
        message: error.message || '测试失败',
        duration,
      });
      console.log(`❌ ${name} - 失败: ${error.message} (${duration}ms)`);
    }
  }

  async testApiConnection(): Promise<void> {
    await this.runTest('API连接测试', async () => {
      const response = await apiClient.get('/health');
      if (!response) {
        throw new Error('API连接失败');
      }
    });
  }

  async testAuthFlow(): Promise<void> {
    await this.runTest('认证流程测试', async () => {
      // 测试用户名可用性检查
      const usernameAvailable = await AuthService.checkUsernameAvailable('test_user_' + Date.now());
      if (!usernameAvailable) {
        throw new Error('用户名可用性检查失败');
      }

      // 测试邮箱可用性检查
      const emailAvailable = await AuthService.checkEmailAvailable('test_' + Date.now() + '@example.com');
      if (!emailAvailable) {
        throw new Error('邮箱可用性检查失败');
      }
    });
  }

  async testUserOperations(): Promise<void> {
    await this.runTest('用户操作测试', async () => {
      // 测试获取用户列表
      const users = await UserService.getUsers({
        page: 1,
        page_size: 10,
      });
      
      if (!users || !users.items) {
        throw new Error('获取用户列表失败');
      }
    });
  }

  async testRoleOperations(): Promise<void> {
    await this.runTest('角色操作测试', async () => {
      // 测试获取角色列表
      const roles = await apiClient.get('/roles/');
      
      if (!Array.isArray(roles)) {
        throw new Error('获取角色列表失败');
      }
    });
  }

  async runAllTests(): Promise<TestResult[]> {
    console.log('🚀 开始运行前端API集成测试...\n');
    
    this.results = [];
    
    await this.testApiConnection();
    await this.testAuthFlow();
    await this.testUserOperations();
    await this.testRoleOperations();
    
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    
    console.log('\n📊 测试结果汇总:');
    console.log(`总测试数: ${totalTests}`);
    console.log(`通过: ${passedTests}`);
    console.log(`失败: ${failedTests}`);
    console.log(`成功率: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    if (failedTests === 0) {
      console.log('\n🎉 所有测试通过！Week 4前端集成工作完成！');
    } else {
      console.log('\n⚠️  部分测试失败，请检查相关功能');
    }
    
    return this.results;
  }
}

// 导出测试函数
export const runIntegrationTests = async (): Promise<TestResult[]> => {
  const tester = new IntegrationTester();
  return await tester.runAllTests();
};

// 在浏览器控制台中运行测试
if (typeof window !== 'undefined') {
  (window as any).runIntegrationTests = runIntegrationTests;
  console.log('💡 在浏览器控制台中运行 runIntegrationTests() 来执行集成测试');
} 
