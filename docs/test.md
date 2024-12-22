本系统的大致功能范围
1）客户端要求：
a.自助查询：用户可以通过输入文字或语音提问，系统自动识别问题意图，并让AI从知识库中查找相关信息，返回答案
b.智能推荐：根据用户的查询历史和个人偏好，系统主动推送相关的信息或解决方案
c.人工客服：当AI无法解答某些特定问题时，用户可以直接转接到人工客服，进行进一步的沟通
d.满意度反馈：用户可以对每次服务进行评价，帮助系统不断改进服务质量
2）人工客服端要求：
a.用户登录，客服通过管理员提供的账号进行登录。
b.互动交流，客服与客户可进行基本的交流
c.AI辅助回答，AI读取客服与客户的沟通记录并根据知识库实时生成可能的解决方案
d. AI生成图谱，AI实时生成相关的知识关系图，方便客服进行进一步的手动查询
e.对话历史查看，客服可以管理查看与客户的对话历史。
3）后台管理要求：
a.管理员登录，管理员可以通过特定权限登录后台管理系统。
b.用户管理，添加删除并设置不同级别的账户权限
b.编辑知识库，管理员可以为系统添加背景知识、产品文档等
c.数据分析，通过分析用户的查询记录，发现高频问题，优化知识图谱结构，提高系统性能

相关技术：
前端：HTML + CSS + TypeScript + Vue.js + TailwindCSS + DaisyUI
后端：Node.JS + TypeScript + PostgreSQL + Prisma + MinIO
AI/知识图谱：Ollama + Qwen2.5 + LangChain + Weaviate
CI/CD：Git + GitHub Actions + Docker

注：
知识图谱将以mermaid格式存储在PostgreSQL里
Weaviate是向量数据库 用于存储向量化的文档 
Ollama是AI组件 
向Ollama请求前需要向Weaviate请求

```json
{
  "theme": "base",
  "themeVariables":{
    "primaryColor":"#FFFFFF",
    "primaryBorderColor":"#000000"
  }
}
```

```mermaid
sequenceDiagram
    participant Admin
    participant KnowledgeBase
    participant User
    participant AI
    participant CustomerService

    %% 核心功能1: 管理员上传文档到知识库
    title 管理员上传文档到知识库
    Admin->>KnowledgeBase: 上传文档
    KnowledgeBase-->>Admin: 上传成功确认
    KnowledgeBase->>AI: 更新知识图谱
    AI-->>KnowledgeBase: 图谱更新完成

    %% 核心功能2: 用户提问
    title 用户提问
    User->>AI: 提交问题
    AI->>KnowledgeBase: 查询相关信息
    KnowledgeBase-->>AI: 返回信息
    alt 如果AI可以解答
        AI-->>User: 提供答案
    else 如果AI无法解答
        AI-->>User: 转接到人工客服
        User->>CustomerService: 请求人工服务
    end

    %% 核心功能3: 客服回答
    title 客服回答
    CustomerService->>AI: 获取辅助信息
    AI->>KnowledgeBase: 查询解决方案
    KnowledgeBase-->>AI: 返回可能的解决方案
    AI-->>CustomerService: 显示解决方案
    CustomerService->>User: 回答问题
```

```mermaid
sequenceDiagram
    participant Admin as 前端
    participant Backend as 后端
    participant PostgreSQL as PostgreSQL<br/>关系数据库
    participant MinIO as MinIO<br/>对象存储
    participant Ollama as Ollama<br/>AI模型
    participant Weaviate as Weaviate<br/>向量数据库

    title 管理员上传文档到知识库
    Admin->>Backend: 上传文档请求
    Backend->>MinIO: 存储文件
    MinIO-->>Backend: 文件存储确认
    Backend->>Ollama: 生成知识图谱
    Ollama-->>Backend: 返回mermaid格式图谱
    Backend->>Weaviate: 向量化并索引文档
    Weaviate-->>Backend: 向量化完成确认
    Backend->>PostgreSQL: 记录文件元数据
    PostgreSQL-->>Backend: 元数据记录确认
    Backend-->>Admin: 上传成功确认
```

```mermaid
sequenceDiagram
    participant User as Frontend
    participant Backend
    participant Ollama
    participant Weaviate
    participant CustomerService

    title 用户提问（结合AI回答和人工客服回复）
    User->>Backend: 提交问题
    Backend->>Weaviate: 搜索相关向量
    Weaviate-->>Backend: 返回匹配向量
    Backend->>Ollama: 请求解析与生成答案
    Ollama-->>Backend: 返回AI生成的答案
    alt AI可以直接回答
        Backend-->>User: 提供AI答案
    else 需要人工客服介入
        Backend-->>User: 通知转接人工客服
        User->>CustomerService: 请求人工服务
        CustomerService->>Backend: 获取对话上下文
        Backend->>Ollama: 请求辅助信息
        Ollama-->>Backend: 返回可能的解决方案
        Backend-->>CustomerService: 显示解决方案
        CustomerService->>User: 客服人员回复
    end
```

```mermaid
sequenceDiagram
    participant CustomerService as Frontend
    participant Backend
    participant Ollama
    participant Weaviate

    title 客服回答（结合AI辅助和手动回复）
    CustomerService->>Backend: 获取辅助信息请求
    Backend->>Weaviate: 搜索相关向量
    Weaviate-->>Backend: 返回匹配向量
    Backend->>Ollama: 请求解析与生成解决方案
    Ollama-->>Backend: 返回可能的解决方案
    Backend-->>CustomerService: 显示解决方案
    alt 客服采用AI建议
        CustomerService->>User: 使用AI提供的答案回复
    else 客服手动编辑答案
        CustomerService->>User: 手动编写并发送答案
    end
```


```mermaid
%% 接口组件图
graph TD;
    A[客户端] -->|文字/语音提问| B(AI处理模块)
    A -->|满意度反馈| B
    A -->|转接请求| C(人工客服端)
    B -->|查询知识库| D(知识库)
    B -->|智能推荐| A
    B -->|辅助回答| C
    C -->|交流记录| E(对话历史存储)
    C -->|生成图谱| F(知识图谱服务)
    G[后台管理] -->|用户管理| H(用户数据库)
    G -->|编辑知识库| D
    G -->|数据分析| I(数据统计与分析)
    H -->|权限验证| C
```

```mermaid
%% 部署图
graph LR;
    subgraph 客户端
        A1[Web/Mobile App]
    end
    subgraph 云服务器-Docker环境
        B1[Vue.js<br/>前端服务]
        C1[Node.JS<br/>后端服务]
        D1[PostgreSQL<br/>关系数据库]
        E1[MinIO<br/>文件存储]
        G1[Weaviate<br/>向量数据库]
        H1[Ollama + Qwen2.5<br/>AI模型服务]
    end
    A1 --> B1
    A1 --> C1
    C1 --> D1
    C1 --> E1
    C1 --> G1
    C1 --> H1
```

```mermaid
%% 源程序包目录图
graph LR;
    A[project-root] --> B[src]
    B --> C[client]
    C --> D[assets]
    C --> E[components]
    C --> F[views]
    C --> G[router]
    C --> H[store]
    B --> I[server]
    I --> J[controllers]
    I --> K[services]
    I --> L[models]
    I --> M[middleware]
    I --> N[utils]
    B --> O[database]
    O --> P[migrations]
    O --> Q[seeds]
    B --> R[config]
    B --> S[tests]
    B --> T[public]
    T --> U[images]
    T --> V[fonts]
```

```mermaid
%% 组件图
graph TB;
    A[前端应用] --> B[后端API]
    B --> C[数据库层]
    B --> D[文件存储]
    B --> E[消息队列]
    B --> F[知识图谱服务]
    B --> G[AI处理模块]
    C --> H[用户数据]
    C --> I[知识库数据]
    C --> J[对话历史数据]
    G --> K[意图识别]
    G --> L[语义理解]
    G --> M[解决方案生成]
    F --> N[图谱生成]
    F --> O[图谱查询]
```

```mermaid
erDiagram
  Auth {
    int id PK
    String passwd
    String salt
    int userId FK
  }
  Session {
    int id PK
    String token UK
    DateTime expire
    int userId FK
  }
  User {
    int id PK
    String name UK
    UserRole role
  }
  Conversation {
    int id PK
    String title
    int userId FK
    int supportUserId FK
  }
  Message {
    int messageId PK
    String content
    MessageType type
    DateTime createdAt
    int conversationId FK
    int userId FK
  }
  Document {
      String uuid PK
      String name
      String[] textSplitsId
      String graph
  }

  User ||--o{ Auth : has
  User ||--o{ Session : has
  User ||--o{ Conversation : participates
  User ||--o{ Conversation : supports
  User ||--o{ Message : sent
  Conversation ||--o{ Message : has
  Auth }o--|| User : "userId"
  Session }o--|| User : "userId"
  Conversation }o--|| User : "userId"
  Conversation }o--o| User : "supportUserId"
  Message }o--|| Conversation : "conversationId"
  Message }o--o| User : "userId"
```

```mermaid
%% 业务流程图
graph TD

    subgraph 登录
        A[用户登录]
        B(判断用户角色)
    end
    
    subgraph 管理员功能
        C[管理员登录]
        D{需要执行的操作}
        E[编辑知识库]
        F[数据分析]
        G[用户管理]

        B -->|是（管理员）| C
        C --> D
        D -->|编辑知识库| E
        D -->|数据分析| F
        D -->|用户管理| G
    end

    subgraph 客服功能
        H{需要执行的操作}
        I[互动交流]
        J[AI辅助回答]
        K[查看对话历史]

        B -->|是（客服）| H
        H -->|互动交流| I
        H -->|AI辅助回答| J
        H -->|查看对话记录| K
    end

    subgraph 客户端功能
        L{是否需要人工介入}
        M[自助查询]
        N[智能推荐]
        O(满意度反馈)
        
        B -->|否（普通用户）| L
        L -->|否| M
        M -->|否| N
        N --> O
        M -->|是| H
    end

    A --> B
```

```mermaid
%% 功能结构图
graph TD
    A[客服问答辅助系统] --> B(注册/登录)
    B --> C{用户}
    B --> D{人工客服}
    B --> E{管理员}

    C --> F1(转接人工客服)
    C --> G1(满意度反馈)
    C --> H1(智能推荐)
    C --> I1(自助查询)

    D --> J1(查看对话历史)
    D --> K1(AI辅助)
    D --> L1(互动交流)

    E --> M1(编辑知识库)
    E --> N1(用户管理)
    E --> O1(数据分析)
```

```mermaid
%% 系统类图
classDiagram
    class Hono {
        +get(path: string, handler: function)
        +post(path: string, handler: function)
        +delete(path: string, handler: function)
        +put(path: string, handler: function)
        +use(middleware: function)
    }

    class User {
        +id: number
        +name: string
        +role: UserRole
    }

    class Conversation {
        +id: number
        +title: string
        +userId: number
        +supportUserId: number
    }

    class Message {
        +id: number
        +conversationId: number
        +content: string
        +type: MessageType
        +userId: number
    }

    class Document {
        +uuid: string
        +name: string
        +textSplitsId: string[]
        +graph: string
    }

    class PrismaClient {
        +document: Document
        +conversation: Conversation
        +message: Message
        +user: User
    }

    class WeaviateClient {
        +collections: Collection
    }

    class Collection {
        +listAll(): Promise
        +delete(name: string): Promise
        +get(name: string): Collection
        +iterator(): AsyncIterator
    }

    class Langchain {
        +splitDocuments(docs: Document[]): Promise
        +stream(input: string, options: object): AsyncIterator
    }

    class CallbackHandler {
        +publicKey: string
        +secretKey: string
        +baseUrl: string
    }

    class PDFLoader {
        +load(): Promise
    }

    class RecursiveCharacterTextSplitter {
        +splitDocuments(docs: Document[]): Promise
    }

    class ChineseRecursiveTextSplitter {
        +splitDocuments(docs: Document[]): Promise
    }

    class ChatOpenAI {
        +model: string
    }

    class ChatOllama {
        +model: string
    }

    class ChatPromptTemplate {
        +fromMessages(messages: string[]): ChatPromptTemplate
    }

    class EnsembleRetriever {
        +retrievers: Retriever[]
        +weights: number[]
    }

    class WeaviateStore {
        +addDocuments(docs: Document[]): Promise
        +asRetriever(options: object): Retriever
    }

    class Retriever {
        +retrieve(query: string): Promise
    }

    class SSEStreamingApi {
        +writeSSE(event: object)
        +close(): Promise
    }

    class WSContext {
        +send(data: string)
        +readyState: number
    }

    class WebSocketResponseEvent {
        +type: string
        +data: object
    }

    Hono --> PrismaClient
    Hono --> WeaviateClient
    Hono --> Langchain
    Hono --> CallbackHandler
    Hono --> SSEStreamingApi
    Hono --> WSContext

    PrismaClient --> User
    PrismaClient --> Conversation
    PrismaClient --> Message
    PrismaClient --> Document

    WeaviateClient --> Collection

    Collection --> Document

    Langchain --> RecursiveCharacterTextSplitter
    Langchain --> ChineseRecursiveTextSplitter
    Langchain --> ChatOpenAI
    Langchain --> ChatOllama
    Langchain --> ChatPromptTemplate
    Langchain --> EnsembleRetriever
    Langchain --> WeaviateStore

    RecursiveCharacterTextSplitter --> Document
    ChineseRecursiveTextSplitter --> Document

    ChatPromptTemplate --> Retriever

    EnsembleRetriever --> Retriever

    WeaviateStore --> Document
    WeaviateStore --> Retriever

    SSEStreamingApi --> WebSocketResponseEvent
    WSContext --> WebSocketResponseEvent
```