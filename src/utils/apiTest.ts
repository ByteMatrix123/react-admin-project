/**
 * API集成测试工具
 * 用于验证前后端API集成是否正常
 */
import { AuthService } from '../services/authService';
import { UserService } from '../services/userService';
import type { LoginRequest, RegisterRequest } from '../types/auth';
import type { UserListParams } from '../types/user';

export class ApiTestUtils {
  // 测试认证API
  static async testAuthAPI() {
    console.group('🔐 认证API测试');
    
    try {
      // 测试用户名可用性检查
      console.log('测试用户名可用性检查...');
      const usernameAvailable = await AuthService.checkUsernameAvailable('test_user_' + Date.now());
      console.log('用户名可用性:', usernameAvailable);
      
      // 测试邮箱可用性检查
      console.log('测试邮箱可用性检查...');
      const emailAvailable = await AuthService.checkEmailAvailable(`test_${Date.now()}@example.com`);
      console.log('邮箱可用性:', emailAvailable);
      
      console.log('✅ 认证API测试通过');
    } catch (error) {
      console.error('❌ 认证API测试失败:', error);
    }
    
    console.groupEnd();
  }
  
  // 测试用户API
  static async testUserAPI() {
    console.group('👥 用户API测试');
    
    try {
      // 测试获取用户列表
      console.log('测试获取用户列表...');
      const userListParams: UserListParams = {
        page: 1,
        page_size: 10,
        search: '',
      };
      
      const userList = await UserService.getUsers(userListParams);
      console.log('用户列表:', userList);
      
      console.log('✅ 用户API测试通过');
    } catch (error) {
      console.error('❌ 用户API测试失败:', error);
    }
    
    console.groupEnd();
  }
  
  // 测试完整的用户注册流程
  static async testUserRegistrationFlow() {
    console.group('📝 用户注册流程测试');
    
    const timestamp = Date.now();
    const testUser: RegisterRequest = {
      username: `test_user_${timestamp}`,
      email: `test_${timestamp}@example.com`,
      password: 'Test123456!',
      full_name: '测试用户',
      department: '技术部',
      position: '开发工程师',
    };
    
    try {
      // 1. 检查用户名可用性
      console.log('1. 检查用户名可用性...');
      const usernameAvailable = await AuthService.checkUsernameAvailable(testUser.username);
      if (!usernameAvailable) {
        throw new Error('用户名不可用');
      }
      
      // 2. 检查邮箱可用性
      console.log('2. 检查邮箱可用性...');
      const emailAvailable = await AuthService.checkEmailAvailable(testUser.email);
      if (!emailAvailable) {
        throw new Error('邮箱不可用');
      }
      
      // 3. 注册用户
      console.log('3. 注册用户...');
      const registerResult = await AuthService.register(testUser);
      console.log('注册结果:', registerResult);
      
      console.log('✅ 用户注册流程测试通过');
    } catch (error) {
      console.error('❌ 用户注册流程测试失败:', error);
    }
    
    console.groupEnd();
  }
  
  // 测试完整的用户登录流程
  static async testUserLoginFlow(credentials: LoginRequest) {
    console.group('🔑 用户登录流程测试');
    
    try {
      // 1. 用户登录
      console.log('1. 用户登录...');
      const loginResult = await AuthService.login(credentials);
      console.log('登录结果:', loginResult);
      
      // 2. 获取当前用户信息
      console.log('2. 获取当前用户信息...');
      const currentUser = await AuthService.getCurrentUser();
      console.log('当前用户:', currentUser);
      
      // 3. 测试Token刷新
      console.log('3. 测试Token刷新...');
      const refreshResult = await AuthService.refreshToken(loginResult.refresh_token);
      console.log('Token刷新结果:', refreshResult);
      
      // 4. 用户登出
      console.log('4. 用户登出...');
      await AuthService.logout();
      console.log('登出成功');
      
      console.log('✅ 用户登录流程测试通过');
    } catch (error) {
      console.error('❌ 用户登录流程测试失败:', error);
    }
    
    console.groupEnd();
  }
  
  // 运行所有API测试
  static async runAllTests() {
    console.group('🧪 API集成测试');
    console.log('开始运行API集成测试...');
    
    await this.testAuthAPI();
    await this.testUserAPI();
    await this.testUserRegistrationFlow();
    
    console.log('API集成测试完成');
    console.groupEnd();
  }
  
  // 测试API连接性
  static async testAPIConnectivity() {
    console.group('🌐 API连接性测试');
    
    try {
      // 测试基础连接
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/health`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ API服务器连接正常:', data);
      } else {
        console.warn('⚠️ API服务器响应异常:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('❌ API服务器连接失败:', error);
    }
    
    console.groupEnd();
  }
}

// 在开发环境下自动运行连接性测试
if (import.meta.env.DEV) {
  ApiTestUtils.testAPIConnectivity();
} 
