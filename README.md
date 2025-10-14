# ZoneFlow 🚚

A modern, real-time delivery management system with intelligent geofencing capabilities. Built with cutting-edge technologies for optimal performance and scalability.

## 🌟 Features

### Core Functionality
- **Real-time Order Tracking**: Live location updates and delivery status monitoring
- **Intelligent Geofencing**: Automated zone-based notifications and actions
- **Driver Management**: Comprehensive driver assignment and performance tracking
- **Interactive Dashboard**: Real-time analytics and operational insights
- **Public Tracking**: Customer-facing order tracking with live maps

### Technical Highlights
- **Real-time Updates**: Server-Sent Events for live data streaming
- **Geospatial Intelligence**: SQLite with SpatiaLite for advanced location queries
- **Modern UI**: React with Tailwind CSS and interactive maps
- **Type Safety**: Full TypeScript implementation across the stack
- **Zero API Costs**: OpenStreetMap integration with Leaflet

## 🏗️ Architecture

### Monorepo Structure
```
ZoneFlow/
├── packages/
│   ├── api/          # Hono.js backend API
│   ├── web/          # React frontend dashboard
│   └── shared/       # Shared types and utilities
├── docs/             # Documentation
└── scripts/          # Build and deployment scripts
```

### Tech Stack

#### Backend
- **Framework**: [Hono.js](https://hono.dev/) - Ultra-fast web framework
- **Runtime**: Node.js with TypeScript
- **Database**: SQLite with SpatiaLite for geospatial functions
- **Authentication**: JWT-based with bcrypt password hashing
- **Real-time**: Server-Sent Events (SSE)

#### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for lightning-fast development
- **Styling**: Tailwind CSS with custom components
- **Maps**: Leaflet with OpenStreetMap (no API costs)
- **State Management**: Zustand for efficient state handling
- **UI Components**: Custom components with shadcn/ui patterns

#### Shared
- **Type Safety**: Shared TypeScript interfaces and utilities
- **Validation**: Zod schemas for runtime type checking
- **Package Management**: pnpm workspaces

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ZoneFlow
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   # Backend
   cp packages/api/.env.example packages/api/.env
   
   # Frontend
   cp packages/web/.env.example packages/web/.env
   ```

4. **Initialize the database**
   ```bash
   pnpm run db:setup
   ```

5. **Start development servers**
   ```bash
   pnpm run dev
   ```

This will start:
- Backend API at `http://localhost:3000`
- Frontend dashboard at `http://localhost:5173`

## 📖 Usage

### Development Commands

```bash
# Start all services in development mode
pnpm run dev

# Start individual services
pnpm run dev:api      # Backend only
pnpm run dev:web      # Frontend only

# Build for production
pnpm run build

# Run tests
pnpm run test

# Lint and format code
pnpm run lint
pnpm run format

# Database operations
pnpm run db:setup     # Initialize database
pnpm run db:migrate   # Run migrations
pnpm run db:seed      # Seed with sample data
```

### API Endpoints

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/refresh` - Refresh JWT token

#### Orders
- `GET /api/orders` - List orders with filtering
- `POST /api/orders` - Create new order
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id/status` - Update order status
- `PUT /api/orders/:id/assign` - Assign driver
- `GET /api/track/:code` - Public order tracking

#### Geofences
- `GET /api/geofences` - List geofences
- `POST /api/geofences` - Create geofence
- `GET /api/geofences/:id` - Get geofence details
- `PUT /api/geofences/:id` - Update geofence
- `DELETE /api/geofences/:id` - Delete geofence
- `POST /api/geofences/check` - Check location against geofences

#### Dashboard
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/dashboard/activity` - Recent activity feed
- `GET /api/dashboard/map-data` - Map visualization data

### User Roles

#### Business Owner
- Full access to all features
- Order management and analytics
- Driver and geofence management
- System configuration

#### Driver
- View assigned orders
- Update order status and location
- Access to delivery routes
- Performance metrics

## 🗄️ Database Schema

### Core Tables
- **users**: User accounts and authentication
- **orders**: Delivery orders with status tracking
- **geofences**: Geographic zones with automated triggers
- **locations**: GPS coordinates and tracking history
- **order_events**: Order status change history

### Geospatial Features
- Point-in-polygon queries for geofence detection
- Distance calculations for route optimization
- Spatial indexing for performance

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=./data/zoneflow.db

# Authentication
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173
```

#### Frontend (.env)
```env
# API Configuration
VITE_API_URL=http://localhost:3000

# Application
VITE_APP_NAME=ZoneFlow
VITE_APP_VERSION=1.0.0

# Map Configuration
VITE_DEFAULT_MAP_CENTER_LAT=40.7128
VITE_DEFAULT_MAP_CENTER_LNG=-74.0060
VITE_DEFAULT_MAP_ZOOM=13
```

## 🧪 Testing

### Running Tests
```bash
# Run all tests
pnpm run test

# Run tests with coverage
pnpm run test:coverage

# Run tests in watch mode
pnpm run test:watch
```

### Test Structure
- **Unit Tests**: Individual component and function testing
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Full user workflow testing

## 📦 Deployment

### Production Build
```bash
# Build all packages
pnpm run build

# Build specific package
pnpm run build:api
pnpm run build:web
```

### Docker Deployment
```bash
# Build Docker image
docker build -t zoneflow .

# Run container
docker run -p 3000:3000 -p 5173:5173 zoneflow
```

### Environment Setup
1. Set production environment variables
2. Configure database with proper permissions
3. Set up reverse proxy (nginx recommended)
4. Configure SSL certificates
5. Set up monitoring and logging

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and linting (`pnpm run test && pnpm run lint`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Code Standards
- **TypeScript**: Strict mode enabled
- **ESLint**: Airbnb configuration with custom rules
- **Prettier**: Automatic code formatting
- **Conventional Commits**: Standardized commit messages

### Project Structure Guidelines
- Keep components under 300 lines
- Use TypeScript for all new code
- Follow established naming conventions
- Write tests for new features
- Update documentation for API changes

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Hono.js](https://hono.dev/) for the blazing-fast backend framework
- [OpenStreetMap](https://www.openstreetmap.org/) for free map data
- [Leaflet](https://leafletjs.com/) for interactive maps
- [SQLite](https://www.sqlite.org/) and [SpatiaLite](https://www.gaia-gis.it/fossil/libspatialite/) for geospatial database capabilities

## 📞 Support

For support, email support@zoneflow.com or join our [Discord community](https://discord.gg/zoneflow).

---

**ZoneFlow** - Revolutionizing delivery management with intelligent geofencing 🚀