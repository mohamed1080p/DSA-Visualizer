# Architecture Improvement Action Items
**Priority-Based Implementation Guide**

---

## 🔴 CRITICAL (Do First)

### 1. Frontend Service Layer Abstraction
**File to create:** `client/src/services/api.ts`

**Purpose:** Abstract all HTTP calls from components

```typescript
// client/src/services/api.ts
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

// Abstract away API calls
export const authService = {
  login: (credentials: LoginDTO) => apiClient.post('/auth/login', credentials),
  register: (data: RegisterDTO) => apiClient.post('/auth/register', data),
  logout: () => apiClient.post('/auth/logout'),
};

export const problemService = {
  getAll: (params: any) => apiClient.get('/problems', { params }),
  getBySlug: (slug: string) => apiClient.get(`/problems/${slug}`),
};
```

**Impact:** Components won't import axios directly, making API changes centralized

---

### 2. Frontend Component Organization
**Current:** Components scattered  
**Target:** Feature-based organization

```
client/src/components/
├── Auth/              (Login, Register, Profile)
├── Problems/          (ProblemList, ProblemDetail)
├── Battle/            (BattleArena, BattleLobby)
├── Learning/          (TopicExplorer, PathProgress)
├── Common/            (Header, Footer, Sidebar)
└── UI/                (Button, Card, Modal - design system)
```

---

## 🟠 HIGH (Next Phase)

### 3. Create Frontend Test Structure
**Location:** `client/tests/`

```
client/tests/
├── unit/
│   ├── services/     (API service tests)
│   ├── hooks/        (Custom hook tests)
│   └── utils/        (Utility tests)
├── integration/
│   ├── pages/        (Page component tests)
│   └── features/     (Feature tests)
└── e2e/              (Playwright tests)
```

---

### 4. Backend Test Expansion
**Location:** `tests/DSA.Visualizer.Tests/`

```
tests/DSA.Visualizer.Tests/
├── Unit/
│   ├── Services/
│   │   ├── AuthServiceTests.cs
│   │   ├── ProblemServiceTests.cs
│   │   └── BattleServiceTests.cs
│   └── Domain/
│       ├── ModelValidationTests.cs
│       └── EntityTests.cs
├── Integration/
│   ├── Repositories/
│   │   ├── ProblemRepositoryTests.cs
│   │   └── SubmissionRepositoryTests.cs
│   └── API/
│       ├── AuthControllerTests.cs
│       └── ProblemsControllerTests.cs
└── E2E/
    └── (Existing Playwright tests)
```

---

## 🟡 MEDIUM (Polish Phase)

### 5. API Versioning Structure
**Add to Program.cs:**

```csharp
builder.Services.AddApiVersioning(options =>
{
    options.DefaultApiVersion = new ApiVersion(1, 0);
    options.AssumeDefaultVersionWhenUnspecified = true;
});

builder.Services.AddVersionedApiExplorer(options =>
{
    options.GroupNameFormat = "'v'VVV";
    options.SubstituteApiVersionInUrl = true;
});
```

**Controller structure:**
```
Infrastructure/Presentation/Controllers/
├── V1/
│   ├── AuthController.cs
│   ├── ProblemsController.cs
│   └── ...
└── V2/
    └── (New API versions here)
```

---

### 6. Feature Flags System
**Purpose:** Gradual rollout of features

```
Infrastructure/Presentation/
└── FeatureFlags/
    ├── IFeatureFlagService.cs
    └── FeatureFlagService.cs
```

---

## ✅ VERIFICATION CHECKLIST

### Backend Verification
- [ ] All services implement their interfaces from `ServicesAbstraction`
- [ ] All services depend on `IUnitOfWork`, not `DbContext`
- [ ] No `DbContext` imports in service implementations
- [ ] Controllers depend on service interfaces, not implementations
- [ ] All DTOs in `Shared/DTOs/`
- [ ] Domain models have no infrastructure dependencies
- [ ] Repository implementations in `Infrastructure/Persistence`
- [ ] No circular project references

### Frontend Verification
- [ ] API calls abstracted in `services/` folder
- [ ] Components organized by feature
- [ ] No direct axios imports outside `services/`
- [ ] Custom hooks isolated in `hooks/`
- [ ] Shared types in `types/`
- [ ] No business logic in components

---

## CONSISTENCY RULES TO MAINTAIN

### Naming Conventions
```
✅ Services:           [Feature]Service.cs          (ProblemService)
✅ Service Interface:  I[Feature]Service.cs         (IProblemService)
✅ Repository:         [Feature]Repository.cs       (ProblemRepository)
✅ Controller:         [Feature]Controller.cs       (ProblemsController)
✅ DTO:                [Feature]DTO.cs              (ProblemDTO)
✅ Domain Model:       [Feature].cs                 (Problem)
```

### Folder Organization
```
✅ Each feature gets a folder at each layer level
✅ Namespaces match folder structure
✅ Related tests mirror feature structure
✅ DTOs organized by feature in Shared
```

### Dependency Direction
```
✅ Presentation → Services (abstractions)
✅ Services → Domain (abstractions)
✅ Infrastructure → Domain (implements interfaces)
✅ Infrastructure (Persistence) → Infrastructure (External) - NO
✅ Frontend Services → API Client (single point)
✅ Frontend Components → Services/Hooks only
```

---

## MONITORING GOING FORWARD

### Prevent Regressions
1. **Code Review Checklist:**
   - Are new services implementing their interfaces?
   - Do services depend on abstractions?
   - Are DTOs in Shared?
   - Are controllers using service interfaces?

2. **Build-Time Validation:**
   - Enable compiler warnings for unused references
   - Use static analyzers (SonarQube, Roslyn)

3. **Architecture Tests:**
   - Consider using ArchUnitNET for enforcing architecture rules
   - Add tests that verify dependency direction

---

## SAMPLE ARCHUNIT TESTS (Future)

```csharp
// Architecture.Tests/LayerTests.cs
[TestClass]
public class ArchitectureTests
{
    [TestMethod]
    public void DomainShouldNotDependOnInfrastructure()
    {
        var domainAssembly = typeof(Problem).Assembly;
        var infrastructureNamespace = "Infrastructure";
        
        var rule = Types()
            .InNamespace("Domain")
            .Should()
            .NotDependOnAny(infrastructureNamespace);
            
        rule.Check(Architecture.GetModules());
    }
    
    [TestMethod]
    public void ServicesShouldDependOnDomainContracts()
    {
        var servicesAssembly = typeof(ProblemService).Assembly;
        
        var rule = Types()
            .InNamespace("Services")
            .Should()
            .DependOnAny(typeof(IUnitOfWork));
            
        rule.Check(Architecture.GetModules());
    }
}
```

---

## FOLDER STRUCTURE SUMMARY

```
✅ CURRENT STATE (CORRECT):
├── Core/
│   ├── Domain/           (Entities, Contracts, Exceptions)
│   ├── Services/         (Implementations, DI setup)
│   └── ServicesAbstraction/ (Interfaces)
├── Infrastructure/
│   ├── Persistence/      (Repositories, DbContext, UnitOfWork)
│   ├── Presentation/     (Controllers, Hubs)
│   └── External/         (Docker, Redis, External Services)
├── Shared/
│   └── DTOs/             (Request/Response models)
├── DSA-Visualizer/       (Host project, Program.cs)
└── tests/
    └── DSA.Visualizer.Tests/ (Unit, Integration, E2E)

⚠️ NEEDS IMPROVEMENT:
client/
├── src/
│   ├── api/              (NOT being used as abstraction layer)
│   ├── components/       (Should be organized by feature)
│   └── pages/            (Good, but needs more structure)
```

---

## SUCCESS METRICS

| Metric | Current | Target |
|--------|---------|--------|
| Service abstraction coverage | 100% | 100% ✅ |
| Circular dependencies | 0 | 0 ✅ |
| Domain infrastructure deps | 0 | 0 ✅ |
| Test coverage | ~40% | >80% |
| Frontend service abstraction | 0% | 100% |
| Frontend feature organization | 50% | 100% |

---

## TIMELINE

**Week 1:** Frontend service abstraction  
**Week 2:** Frontend test structure  
**Week 3:** Backend test expansion  
**Week 4:** API versioning  
**Week 5+:** Monitoring & continuous improvement

