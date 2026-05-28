# Zuri LMS - Tire Inspection and Fleet Management System

A modern, full-stack tire inspection and fleet management system built with Next.js 16, Supabase, and Tailwind CSS.

## Features

### Core Functionality
- **User Authentication**: Secure login/register with role-based access (Admin, Inspector, Manager)
- **Dashboard**: Real-time statistics and activity monitoring
- **Tire Inspections**: Comprehensive vehicle inspection forms with tire grid tracking
- **Scrap Management**: Track and manage scrap tire entries with damage codes
- **Reports**: Generate and export inspection and scrap reports to CSV
- **Admin Panel**: Full management of users, companies, depots, vehicle configurations, and suggestions
- **Settings**: User profile management and password changes

### Advanced Features
- **Offline Sync**: Connection status indicator (red/orange/green), offline data capture, auto-sync when connection restored
- **Bluetooth Integration**: Connect to tire sensors for automatic pressure, temperature, and tread depth readings
- **Analytics Dashboard**: Fleet health monitoring, trend charts, tire condition distribution, data export

### Technical Highlights
- **Next.js 16 App Router**: Modern React framework with server components
- **Supabase**: Backend-as-a-service with PostgreSQL database, authentication, and RLS
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **TypeScript**: Type-safe development
- **Row Level Security (RLS)**: Database-level security policies

## Project Structure

```
client-new/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── admin/             # Admin panel pages
│   │   │   ├── companies/     # Company management
│   │   │   ├── depots/        # Depot management
│   │   │   ├── suggestions/   # User suggestions
│   │   │   ├── tyre-configs/  # Vehicle configurations
│   │   │   ├── tyres/         # Tyre inventory
│   │   │   └── users/         # User management
│   │   ├── dashboard/         # Main dashboard
│   │   │   ├── inspections/   # Inspection management
│   │   │   ├── reports/       # Report generation
│   │   │   ├── scraps/        # Scrap management
│   │   │   └── settings/      # User settings
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Login page
│   │   └── register/          # Registration page
│   ├── contexts/              # React contexts
│   │   ├── AuthContext.tsx    # Authentication context
│   │   ├── ConnectionContext.tsx  # Offline sync context
│   │   └── BluetoothContext.tsx   # Bluetooth sensor context
│   ├── components/            # Reusable components
│   │   ├── ConnectionStatus.tsx   # Connection status indicator
│   │   └── BluetoothPanel.tsx     # Bluetooth sensor panel
│   ├── lib/                   # Utility libraries
│   │   ├── supabase.ts        # Supabase client configuration
│   │   ├── offlineSync.ts     # Offline sync utilities
│   │   ├── bluetooth.ts       # Bluetooth sensor service
│   │   └── utils.ts           # Utility functions
│   └── middleware.ts          # Next.js middleware for auth
├── supabase/                  # Supabase configuration
│   ├── migrations/            # Database migrations
│   │   └── 001_initial_schema.sql
│   └── seed.sql               # Seed data
├── .env                       # Environment variables (create from .env.example)
├── .env.example              # Environment variables template
├── package.json               # Dependencies
├── next.config.ts            # Next.js configuration
└── tsconfig.json             # TypeScript configuration
```

## Database Schema

The application uses Supabase PostgreSQL with the following main tables:

- **users**: User accounts and roles
- **inspections**: Tire inspection records
- **scraps**: Scrap tire entries
- **companies**: Company information
- **depots**: Depot locations
- **vehicle_configs**: Vehicle configurations
- **tyres**: Tyre inventory
- **activity_logs**: Activity tracking
- **user_suggestions**: User feedback system
- **countries, provinces, regions, stores**: Geographic data

See `supabase/migrations/001_initial_schema.sql` for the complete schema.

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun
- Supabase account (free tier works)

### Installation

1. **Clone the repository and navigate to the client folder:**
   ```bash
   cd Zuri/client-new
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Supabase:**
   - Create a new project at [supabase.com](https://supabase.com)
   - Go to Project Settings > API to get your credentials
   - Run the migration from `supabase/migrations/001_initial_schema.sql` in the Supabase SQL editor
   - Run the seed data from `supabase/seed.sql` (optional)

4. **Configure environment variables:**
   Copy `.env.example` to `.env` and fill in your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NEXT_PUBLIC_APP_NAME=Zuri LMS
   JWT_SECRET=your_jwt_secret_key_here
   SESSION_SECRET=your_session_secret_here
   ```

5. **Run the development server:**
   ```bash
   npm run dev
   ```

6. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Creating the First Admin User

1. Register a new account at `/register`
2. Select "Admin" as the role
3. The user will be created in both Supabase Auth and the users table

## Usage

### For Inspectors
- Log in with your credentials
- Navigate to Dashboard to view statistics
- Create new inspections under Inspections
- Add vehicles and tire details
- Submit scrap entries under Scraps
- View reports under Reports

### For Managers
- All inspector capabilities
- View all inspections and scraps
- Generate and export reports
- Manage user profiles

### For Admins
- All manager capabilities
- Access Admin Panel at `/admin`
- Manage users, companies, depots
- Configure vehicle settings
- Review user suggestions
- Manage tyre inventory

## Deployment

### Vercel Deployment

1. **Push your code to GitHub**

2. **Connect to Vercel:**
   - Import your repository in Vercel
   - The `vercel.json` configuration will be automatically detected
   - Configure build settings (defaults should work)

3. **Add environment variables in Vercel:**
   Go to your Vercel project settings > Environment Variables and add:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   NEXT_PUBLIC_APP_NAME=Zuri LMS
   JWT_SECRET=your_jwt_secret_key_here
   SESSION_SECRET=your_session_secret_here
   ```

4. **Deploy:**
   Vercel will automatically deploy on push to your main branch

### Supabase Production Setup

1. **Create a production Supabase project:**
   - Go to [supabase.com](https://supabase.com) and create a new project
   - Choose a region close to your users for better performance

2. **Run migrations:**
   - Copy the content of `supabase/migrations/001_initial_schema.sql`
   - Run it in the Supabase SQL editor of your production project
   - Optionally run `supabase/seed.sql` for initial data

3. **Update environment variables:**
   - Get your production Supabase credentials from Project Settings > API
   - Update the environment variables in Vercel with production values

4. **Test the deployment:**
   - Visit your Vercel deployment URL
   - Register a new admin user
   - Test all core features

### Performance Optimization

For optimal performance:
- Choose a Supabase region close to your users
- Enable Vercel Analytics
- Configure CDN for static assets
- Monitor Vercel logs for errors

### Troubleshooting Deployment

**Build fails:**
- Check Vercel build logs
- Ensure all environment variables are set
- Verify dependencies are compatible

**Authentication issues:**
- Verify Supabase URL and keys are correct
- Check RLS policies are enabled
- Ensure email confirmation is disabled if needed

**Database connection errors:**
- Verify Supabase project is active
- Check service role key is correct
- Ensure RLS policies allow access

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Adding New Features

1. **Database changes:**
   - Create a new migration file in `supabase/migrations/`
   - Run in Supabase SQL editor

2. **New pages:**
   - Add to `src/app/` following the App Router structure
   - Use the existing layout for consistency

3. **API routes:**
   - Add to `src/app/api/` if needed
   - Use Supabase client for database operations

## Security

- **Row Level Security (RLS)**: All tables have RLS policies
- **Authentication**: Supabase Auth with JWT tokens
- **Protected Routes**: Middleware enforces authentication
- **Role-Based Access**: Different features for different roles
- **Environment Variables**: Sensitive data in environment variables

## Troubleshooting

### Common Issues

**Supabase connection error:**
- Verify environment variables are set correctly
- Check Supabase project is active
- Ensure anon key and service role key are correct

**Authentication not working:**
- Check RLS policies are enabled
- Verify user exists in users table
- Check middleware configuration

**Build errors:**
- Clear `.next` folder: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check TypeScript errors

## Future Enhancements

Potential future improvements:
- Comprehensive testing suite (unit, integration, E2E)
- CI/CD pipeline with automated testing
- Advanced monitoring and alerting
- Mobile app (React Native)
- Additional sensor integrations
- Advanced reporting with PDF generation

## License

See LICENSE file for details.

## Support

For issues and questions, please refer to the project documentation or contact the development team.
