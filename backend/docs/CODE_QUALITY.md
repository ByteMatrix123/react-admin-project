# 🔧 代码质量指南

## 概述

本项目使用 **Ruff** 作为主要的代码检查和格式化工具，以确保代码质量和一致性。Ruff 是一个极快的 Python linter 和代码格式化工具，可以替代 flake8、black、isort 等多个工具。

## 🛠️ 工具配置

### Ruff 配置

项目在 `pyproject.toml` 中配置了 Ruff，包括：

- **代码检查规则**: 启用了多种检查规则，包括 Pyflakes、pycodestyle、isort、pep8-naming 等
- **代码格式化**: 使用类似 Black 的格式化风格
- **导入排序**: 自动排序和组织导入语句
- **自动修复**: 支持自动修复大部分代码问题

### 其他工具

- **MyPy**: 静态类型检查
- **Bandit**: 安全漏洞检查
- **pre-commit**: Git 提交前自动检查

## 📋 代码规范

### 基本规范

1. **行长度**: 最大 88 字符
2. **缩进**: 使用 4 个空格
3. **引号**: 优先使用双引号
4. **导入**: 按照 isort 规则排序
5. **类型注解**: 使用现代 Python 类型注解语法 (`str | None` 而不是 `Optional[str]`)

### 命名规范

- **变量和函数**: `snake_case`
- **类名**: `PascalCase`
- **常量**: `UPPER_SNAKE_CASE`
- **私有成员**: 以单下划线开头 `_private`
- **特殊方法**: 双下划线包围 `__special__`

### 文档字符串

```python
def example_function(param1: str, param2: int) -> bool:
    """
    简短的函数描述。
    
    Args:
        param1: 参数1的描述
        param2: 参数2的描述
        
    Returns:
        返回值的描述
        
    Raises:
        ValueError: 异常情况的描述
    """
    pass
```

## 🚀 使用方法

### 命令行工具

```bash
# 安装开发依赖
make dev-install

# 运行代码检查
make lint

# 自动修复代码问题
make lint-fix

# 格式化代码
make format

# 运行所有检查
make check

# 类型检查
make type-check

# 安全检查
make security
```

### VS Code 集成

项目已配置 VS Code 设置文件，安装推荐扩展后可以：

1. **保存时自动格式化**: 文件保存时自动运行 Ruff 格式化
2. **实时错误提示**: 编辑时显示 Ruff 检查结果
3. **自动修复**: 使用快捷键或右键菜单自动修复问题
4. **导入排序**: 自动排序和组织导入语句

### Pre-commit Hooks

```bash
# 安装 pre-commit hooks
make pre-commit-install

# 手动运行所有 hooks
make pre-commit
```

## 📊 检查规则

### 启用的规则类别

- **E4, E7, E9**: pycodestyle 错误
- **F**: Pyflakes 错误
- **W**: pycodestyle 警告
- **I**: isort 导入排序
- **N**: pep8-naming 命名规范
- **UP**: pyupgrade 现代化语法
- **B**: flake8-bugbear 常见错误
- **A**: flake8-builtins 内置函数冲突
- **C4**: flake8-comprehensions 列表推导式
- **DTZ**: flake8-datetimez 时区处理
- **T20**: flake8-print 打印语句
- **SIM**: flake8-simplify 代码简化
- **ARG**: flake8-unused-arguments 未使用参数
- **PTH**: flake8-use-pathlib 路径处理
- **ERA**: eradicate 注释代码
- **PL**: Pylint 规则
- **TRY**: tryceratops 异常处理
- **RUF**: Ruff 特定规则

### 忽略的规则

- **E501**: 行长度（由格式化工具处理）
- **B008**: 函数参数默认值
- **C901**: 复杂度检查
- **PLR0913**: 参数过多
- **PLR0915**: 语句过多
- **PLR2004**: 魔法数字
- **TRY003**: 异常消息长度
- **ARG001/ARG002**: 未使用参数

## 🔍 常见问题和解决方案

### 1. 时区相关警告 (DTZ003)

**问题**: 使用 `datetime.utcnow()` 会触发警告

**解决方案**: 使用带时区的 datetime
```python
# 不推荐
from datetime import datetime
now = datetime.utcnow()

# 推荐
from datetime import datetime, timezone
now = datetime.now(timezone.utc)
```

### 2. 异常处理 (B904)

**问题**: 在 except 块中抛出异常时缺少 from 子句

**解决方案**: 使用 `raise ... from err` 或 `raise ... from None`
```python
# 不推荐
try:
    risky_operation()
except ValueError:
    raise CustomError("Something went wrong")

# 推荐
try:
    risky_operation()
except ValueError as e:
    raise CustomError("Something went wrong") from e
```

### 3. 全局变量 (PLW0603)

**问题**: 使用 global 语句更新变量

**解决方案**: 考虑使用类或模块级别的状态管理
```python
# 不推荐
redis_client = None

def init_redis():
    global redis_client
    redis_client = Redis()

# 推荐
class RedisManager:
    def __init__(self):
        self.client = None
    
    def init(self):
        self.client = Redis()
```

### 4. 打印语句 (T201)

**问题**: 在生产代码中使用 print 语句

**解决方案**: 使用 logging 模块
```python
# 不推荐
print("Debug message")

# 推荐
import logging
logger = logging.getLogger(__name__)
logger.info("Debug message")
```

## 📈 CI/CD 集成

项目配置了 GitHub Actions 工作流，在每次提交和 PR 时自动运行：

1. **Ruff 检查**: 代码风格和错误检查
2. **Ruff 格式化检查**: 确保代码已正确格式化
3. **MyPy 类型检查**: 静态类型验证
4. **Bandit 安全检查**: 安全漏洞扫描
5. **测试覆盖率**: 单元测试和覆盖率报告

## 🎯 最佳实践

### 1. 开发流程

1. 编写代码时遵循项目规范
2. 使用 VS Code 扩展实时检查
3. 提交前运行 `make check` 确保通过所有检查
4. 使用 pre-commit hooks 自动化检查

### 2. 代码审查

1. 确保所有 Ruff 检查通过
2. 检查类型注解的正确性
3. 验证文档字符串的完整性
4. 确保测试覆盖率达标

### 3. 持续改进

1. 定期更新 Ruff 版本
2. 根据项目需要调整规则配置
3. 关注新的代码质量工具和最佳实践
4. 团队内分享代码质量经验

## 📚 参考资源

- [Ruff 官方文档](https://docs.astral.sh/ruff/)
- [Python 代码风格指南 (PEP 8)](https://peps.python.org/pep-0008/)
- [Python 类型提示 (PEP 484)](https://peps.python.org/pep-0484/)
- [Google Python 风格指南](https://google.github.io/styleguide/pyguide.html)

---

通过遵循这些代码质量标准，我们可以确保项目代码的一致性、可读性和可维护性。 
