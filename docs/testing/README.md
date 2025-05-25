# 🧪 测试文档

本目录包含项目测试相关的所有文档，包括测试策略、测试指南、测试报告等。

## 📋 文档列表

### [测试指南](./TESTING_GUIDE.md)
完整的测试框架和最佳实践指南，包括：
- 测试环境搭建
- 单元测试编写
- 集成测试策略
- API 测试方法
- 测试数据管理

### 测试报告
- **[测试修复总结](./test-fixes-summary.md)** - 测试问题修复记录
- **[最终测试总结](./test-fixes-final-summary.md)** - 最终测试状态和结果
- **[集成测试报告](./week3-integration-testing-report.md)** - 第三周集成测试详细报告

## 🎯 测试策略

### 测试金字塔
```
    /\
   /  \     10% - E2E 测试
  /____\    
 /      \   20% - 集成测试
/________\  
           70% - 单元测试
```

### 测试类型
1. **单元测试**: 测试单个函数或组件
2. **集成测试**: 测试模块间的交互
3. **API 测试**: 测试 REST API 接口
4. **端到端测试**: 测试完整的用户流程

## 🛠️ 测试工具

### 后端测试
- **pytest**: Python 测试框架
- **pytest-asyncio**: 异步测试支持
- **httpx**: HTTP 客户端测试
- **pytest-cov**: 测试覆盖率统计

### 前端测试
- **Vitest**: 现代化测试框架
- **React Testing Library**: React 组件测试
- **MSW**: API 模拟工具

### 测试数据库
- **SQLite**: 内存数据库用于测试
- **pytest fixtures**: 测试数据准备

## 📊 测试覆盖率

### 当前状态
- **后端覆盖率**: 80%+
- **前端覆盖率**: 待完善
- **API 测试**: 完整覆盖

### 覆盖率目标
- **单元测试**: 80%+
- **集成测试**: 主要业务流程 100%
- **API 测试**: 所有接口 100%

## 🚀 快速开始

### 运行后端测试
```bash
cd backend
uv run pytest
```

### 运行测试覆盖率
```bash
cd backend
uv run pytest --cov=app --cov-report=html
```

### 运行特定测试
```bash
cd backend
uv run pytest tests/test_auth.py -v
```

## 📋 测试检查清单

### 开发阶段
- [ ] 编写单元测试
- [ ] 运行本地测试
- [ ] 检查测试覆盖率
- [ ] 修复失败的测试

### 提交前
- [ ] 运行完整测试套件
- [ ] 确保所有测试通过
- [ ] 检查代码覆盖率达标
- [ ] 更新测试文档

### 发布前
- [ ] 运行集成测试
- [ ] 执行 API 测试
- [ ] 性能测试验证
- [ ] 安全测试检查

## 🔗 相关文档

- [测试策略方案](../implementation-plan/07-testing-strategy.md) - 整体测试策略
- [代码质量指南](../guides/CODE_QUALITY.md) - 代码质量标准
- [API 规范](../implementation-plan/04-api-specification.md) - API 测试参考

## 📞 测试支持

如果在测试过程中遇到问题：
1. 查看 [测试指南](./TESTING_GUIDE.md)
2. 查看测试报告了解已知问题
3. 联系测试团队获取支持 
