from sqlalchemy.orm import Session
from app.models import User, Category, Product, UserRole, ProductStatus, ProductType, LicenseType
from app.auth import get_password_hash


def seed_database(db: Session):
    existing_user = db.query(User).first()
    if existing_user:
        return
    
    admin = User(
        email="admin@softmarket.com",
        password_hash=get_password_hash("admin123"),
        name="Admin User",
        role=UserRole.ADMIN,
        company_name="SoftMarket Inc."
    )
    db.add(admin)
    
    sellers = [
        User(
            email="seller1@techcorp.com",
            password_hash=get_password_hash("seller123"),
            name="John Smith",
            role=UserRole.SELLER,
            company_name="TechCorp Solutions",
            company_description="Leading provider of enterprise software solutions"
        ),
        User(
            email="seller2@devtools.io",
            password_hash=get_password_hash("seller123"),
            name="Sarah Johnson",
            role=UserRole.SELLER,
            company_name="DevTools.io",
            company_description="Modern development tools for modern developers"
        ),
        User(
            email="seller3@cloudsoft.com",
            password_hash=get_password_hash("seller123"),
            name="Mike Chen",
            role=UserRole.SELLER,
            company_name="CloudSoft",
            company_description="Cloud-native software solutions"
        ),
    ]
    for seller in sellers:
        db.add(seller)
    
    buyer = User(
        email="buyer@example.com",
        password_hash=get_password_hash("buyer123"),
        name="Demo Buyer",
        role=UserRole.BUYER
    )
    db.add(buyer)
    
    db.flush()
    
    categories = [
        Category(name="Development Tools", slug="development-tools", description="IDEs, code editors, and development utilities", image_url="https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400"),
        Category(name="Business Software", slug="business-software", description="CRM, ERP, and business management tools", image_url="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400"),
        Category(name="Security & Privacy", slug="security-privacy", description="Antivirus, VPN, and security tools", image_url="https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400"),
        Category(name="Design & Creative", slug="design-creative", description="Graphic design, video editing, and creative tools", image_url="https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400"),
        Category(name="Cloud Services", slug="cloud-services", description="Cloud hosting, storage, and infrastructure", image_url="https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400"),
        Category(name="AI & Machine Learning", slug="ai-machine-learning", description="AI tools, ML frameworks, and data science", image_url="https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400"),
        Category(name="Marketing Tools", slug="marketing-tools", description="SEO, analytics, and marketing automation", image_url="https://images.unsplash.com/photo-1533750349088-cd871a92f312?w=400"),
        Category(name="Productivity", slug="productivity", description="Task management, collaboration, and productivity apps", image_url="https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=400"),
    ]
    for cat in categories:
        db.add(cat)
    
    db.flush()
    
    products = [
        Product(
            seller_id=sellers[0].id,
            category_id=categories[0].id,
            name="CodeMaster Pro IDE",
            slug="codemaster-pro-ide",
            description="A powerful integrated development environment with advanced code completion, debugging tools, and support for 50+ programming languages. Features include real-time collaboration, Git integration, and AI-powered code suggestions.",
            short_description="Professional IDE with AI-powered code completion",
            price=199.99,
            original_price=299.99,
            product_type=ProductType.SOFTWARE,
            license_type=LicenseType.PERPETUAL,
            status=ProductStatus.ACTIVE,
            image_url="https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600",
            version="3.5.0",
            features="AI Code Completion,Multi-language Support,Git Integration,Real-time Collaboration,Dark Mode,Plugin System",
            requirements="Windows 10+, macOS 10.15+, or Linux. 8GB RAM, 2GB disk space",
            is_featured=True,
            download_count=15420
        ),
        Product(
            seller_id=sellers[0].id,
            category_id=categories[0].id,
            name="Database Manager Ultimate",
            slug="database-manager-ultimate",
            description="Comprehensive database management tool supporting MySQL, PostgreSQL, MongoDB, Redis, and more. Visual query builder, schema designer, and performance monitoring included.",
            short_description="All-in-one database management solution",
            price=149.99,
            product_type=ProductType.SOFTWARE,
            license_type=LicenseType.SUBSCRIPTION,
            status=ProductStatus.ACTIVE,
            image_url="https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=600",
            version="2.1.0",
            features="Visual Query Builder,Schema Designer,Performance Monitoring,Data Export/Import,SSH Tunneling",
            is_featured=True,
            download_count=8930
        ),
        Product(
            seller_id=sellers[1].id,
            category_id=categories[0].id,
            name="API Testing Suite",
            slug="api-testing-suite",
            description="Complete API testing solution with automated testing, mock servers, and comprehensive documentation generation. Perfect for REST, GraphQL, and WebSocket APIs.",
            short_description="Automated API testing and documentation",
            price=79.99,
            original_price=99.99,
            product_type=ProductType.TOOL,
            license_type=LicenseType.SUBSCRIPTION,
            status=ProductStatus.ACTIVE,
            image_url="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600",
            version="4.0.2",
            features="Automated Testing,Mock Servers,Documentation Generation,CI/CD Integration,Team Collaboration",
            is_featured=True,
            download_count=12350
        ),
        Product(
            seller_id=sellers[1].id,
            category_id=categories[1].id,
            name="CRM Enterprise",
            slug="crm-enterprise",
            description="Enterprise-grade customer relationship management system with sales automation, marketing tools, and advanced analytics. Integrates with 100+ business applications.",
            short_description="Complete CRM solution for growing businesses",
            price=299.99,
            product_type=ProductType.SOFTWARE,
            license_type=LicenseType.SUBSCRIPTION,
            status=ProductStatus.ACTIVE,
            image_url="https://images.unsplash.com/photo-1552664730-d307ca884978?w=600",
            version="5.2.1",
            features="Sales Automation,Marketing Tools,Analytics Dashboard,Email Integration,Mobile App,API Access",
            is_featured=True,
            download_count=5670
        ),
        Product(
            seller_id=sellers[2].id,
            category_id=categories[2].id,
            name="SecureVault Pro",
            slug="securevault-pro",
            description="Military-grade password manager with zero-knowledge encryption, secure sharing, and breach monitoring. Supports all platforms with browser extensions.",
            short_description="Enterprise password management solution",
            price=49.99,
            product_type=ProductType.SOFTWARE,
            license_type=LicenseType.SUBSCRIPTION,
            status=ProductStatus.ACTIVE,
            image_url="https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=600",
            version="2.8.0",
            features="Zero-Knowledge Encryption,Secure Sharing,Breach Monitoring,2FA Support,Browser Extensions,Mobile Apps",
            is_featured=True,
            download_count=23450
        ),
        Product(
            seller_id=sellers[2].id,
            category_id=categories[4].id,
            name="CloudDeploy Pro",
            slug="clouddeploy-pro",
            description="Streamline your cloud deployments with automated CI/CD pipelines, infrastructure as code, and multi-cloud support. Deploy to AWS, Azure, GCP, and more.",
            short_description="Automated cloud deployment platform",
            price=199.99,
            product_type=ProductType.SERVICE,
            license_type=LicenseType.SUBSCRIPTION,
            status=ProductStatus.ACTIVE,
            image_url="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600",
            version="3.1.0",
            features="CI/CD Pipelines,Infrastructure as Code,Multi-Cloud Support,Rollback Protection,Monitoring,Slack Integration",
            is_featured=True,
            download_count=7890
        ),
        Product(
            seller_id=sellers[0].id,
            category_id=categories[5].id,
            name="ML Studio",
            slug="ml-studio",
            description="Visual machine learning platform for building, training, and deploying ML models without writing code. Includes pre-built models and AutoML capabilities.",
            short_description="No-code machine learning platform",
            price=399.99,
            product_type=ProductType.SOFTWARE,
            license_type=LicenseType.SUBSCRIPTION,
            status=ProductStatus.ACTIVE,
            image_url="https://images.unsplash.com/photo-1555255707-c07966088b7b?w=600",
            version="1.5.0",
            features="Visual Model Builder,AutoML,Pre-built Models,GPU Training,Model Deployment,API Generation",
            is_featured=True,
            download_count=4560
        ),
        Product(
            seller_id=sellers[1].id,
            category_id=categories[3].id,
            name="DesignFlow Pro",
            slug="designflow-pro",
            description="Professional UI/UX design tool with real-time collaboration, prototyping, and developer handoff. Create stunning designs with an intuitive interface.",
            short_description="Collaborative UI/UX design platform",
            price=149.99,
            product_type=ProductType.SOFTWARE,
            license_type=LicenseType.SUBSCRIPTION,
            status=ProductStatus.ACTIVE,
            image_url="https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600",
            version="4.2.0",
            features="Real-time Collaboration,Prototyping,Developer Handoff,Design Systems,Version Control,Plugins",
            download_count=18920
        ),
        Product(
            seller_id=sellers[2].id,
            category_id=categories[6].id,
            name="SEO Analyzer Pro",
            slug="seo-analyzer-pro",
            description="Comprehensive SEO toolkit with keyword research, rank tracking, site audits, and competitor analysis. Improve your search rankings with data-driven insights.",
            short_description="Complete SEO analysis and optimization",
            price=89.99,
            product_type=ProductType.TOOL,
            license_type=LicenseType.SUBSCRIPTION,
            status=ProductStatus.ACTIVE,
            image_url="https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=600",
            version="3.0.1",
            features="Keyword Research,Rank Tracking,Site Audits,Competitor Analysis,Backlink Monitor,Reports",
            download_count=9870
        ),
        Product(
            seller_id=sellers[0].id,
            category_id=categories[7].id,
            name="TaskFlow",
            slug="taskflow",
            description="Modern project management and team collaboration tool with Kanban boards, Gantt charts, time tracking, and resource management. Perfect for agile teams.",
            short_description="Agile project management for teams",
            price=12.99,
            product_type=ProductType.SOFTWARE,
            license_type=LicenseType.SUBSCRIPTION,
            status=ProductStatus.ACTIVE,
            image_url="https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=600",
            version="2.4.0",
            features="Kanban Boards,Gantt Charts,Time Tracking,Resource Management,Integrations,Mobile App",
            download_count=34560
        ),
        Product(
            seller_id=sellers[1].id,
            category_id=categories[5].id,
            name="DataPipeline",
            slug="datapipeline",
            description="ETL and data integration platform for building robust data pipelines. Connect to 200+ data sources and transform data with visual workflows.",
            short_description="Visual ETL and data integration",
            price=249.99,
            product_type=ProductType.SOFTWARE,
            license_type=LicenseType.SUBSCRIPTION,
            status=ProductStatus.ACTIVE,
            image_url="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600",
            version="2.0.0",
            features="200+ Connectors,Visual Workflows,Data Transformation,Scheduling,Monitoring,API Access",
            download_count=6780
        ),
        Product(
            seller_id=sellers[2].id,
            category_id=categories[2].id,
            name="CodeGuard",
            slug="codeguard",
            description="Static code analysis and security scanning tool. Find vulnerabilities, code smells, and security issues before they reach production.",
            short_description="Code security and quality analysis",
            price=129.99,
            original_price=179.99,
            product_type=ProductType.TOOL,
            license_type=LicenseType.SUBSCRIPTION,
            status=ProductStatus.ACTIVE,
            image_url="https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600",
            version="1.8.0",
            features="Static Analysis,Security Scanning,Code Quality,CI/CD Integration,Custom Rules,Reports",
            download_count=11230
        ),
    ]
    
    for product in products:
        db.add(product)
    
    db.commit()
    print("Database seeded successfully!")
