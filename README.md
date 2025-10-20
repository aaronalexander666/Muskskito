# Muskskito - Disposable AI Browser

🔒 **Browse Safe, Leave No Trace**

A cyberpunk-themed disposable browser with AI-powered threat detection, VPN protection, and complete session privacy.

![Muskskito Banner](https://img.shields.io/badge/Security-First-00ff41?style=for-the-badge) ![License](https://img.shields.io/badge/License-MIT-00ff41?style=for-the-badge)

## 🚀 Features

### Core Security
- **Disposable Sessions**: Automatically delete browsing history after set time
- **AI Threat Detection**: Real-time malware and phishing detection
- **VPN Protection**: 24 global VPN locations (8 free, 16 pro)
- **Sandboxed Browsing**: Isolated environment for maximum security
- **Tracker Blocking**: Block ads, trackers, and malicious scripts

### AI Assistant
- **Real-time Chat**: AI security advisor helps you browse safely
- **Contextual Advice**: Get security tips based on current website
- **Threat Explanations**: Understand detected threats in plain language

### Privacy Controls
- **Auto-Delete**: Configure automatic session deletion (5-1440 minutes)
- **Advanced Settings**: Customize threat sensitivity and blocking rules
- **Session History**: Track and manage all browsing sessions
- **Complete Deletion**: NUKE button for instant session termination

### Pro Features
- 🌍 **24 Global VPN Locations** (vs 8 free)
- ⚡ **Priority VPN Servers** for faster connections
- 🛡️ **Enhanced Threat Detection** with higher accuracy
- 🚫 **Advanced Ad & Tracker Blocking**
- ♾️ **Unlimited Browsing Sessions**
- 👑 **Priority Support**

## 🎨 Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: Express + tRPC 11
- **Database**: MySQL/TiDB with Drizzle ORM
- **Styling**: TailwindCSS 4 + shadcn/ui
- **AI**: OpenAI GPT-4 integration
- **Auth**: Manus OAuth
- **3D Graphics**: Canvas API for globe visualization

## 📦 Installation

### Prerequisites
- Node.js 22+
- pnpm 10+
- MySQL/TiDB database

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/aaronalexander666/muskskito.git
   cd muskskito
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file with:
   ```env
   DATABASE_URL=mysql://user:password@host:port/database
   JWT_SECRET=your-secret-key
   VITE_APP_ID=your-manus-app-id
   OAUTH_SERVER_URL=https://api.manus.im
   VITE_OAUTH_PORTAL_URL=https://portal.manus.im
   BUILT_IN_FORGE_API_URL=https://api.manus.im
   BUILT_IN_FORGE_API_KEY=your-api-key
   VITE_APP_TITLE=Muskskito - Disposable AI Browser
   VITE_APP_LOGO=/logo.png
   ```

4. **Initialize database**
   ```bash
   pnpm db:push
   ```

5. **Start development server**
   ```bash
   pnpm dev
   ```

6. **Access the application**
   
   Open [http://localhost:3000](http://localhost:3000)

## 🗺️ VPN Locations

### Free Tier (8 locations)
- 🇺🇸 United States (New York, Los Angeles)
- 🇬🇧 United Kingdom (London)
- 🇩🇪 Germany (Frankfurt)
- 🇳🇱 Netherlands (Amsterdam)
- 🇸🇬 Singapore
- 🇯🇵 Japan (Tokyo)
- 🇨🇦 Canada (Toronto)

### Pro Tier (16 additional locations)
- 🇸🇪 Sweden (Stockholm)
- 🇨🇭 Switzerland (Zurich)
- 🇮🇸 Iceland (Reykjavik)
- 🇳🇴 Norway (Oslo)
- 🇫🇮 Finland (Helsinki)
- 🇫🇷 France (Paris)
- 🇪🇸 Spain (Madrid)
- 🇮🇹 Italy (Milan)
- 🇦🇺 Australia (Sydney)
- 🇧🇷 Brazil (São Paulo)
- 🇰🇷 South Korea (Seoul)
- 🇭🇰 Hong Kong
- 🇮🇳 India (Mumbai)
- 🇦🇪 UAE (Dubai)
- 🇿🇦 South Africa (Johannesburg)
- 🇲🇽 Mexico (Mexico City)

## 🎯 Usage

### Basic Browsing
1. **Login** to your account
2. **Activate VPN** for anonymous browsing
3. **Enter URL** in the secure browse command
4. **Launch Sandbox** to start protected session
5. **NUKE SESSION** when done to delete all traces

### Settings Configuration
- Navigate to **Settings** page
- Configure auto-delete timer
- Enable/disable tracker and ad blocking
- Adjust threat sensitivity
- Enable AI assistant

### AI Chat Assistant
- Click the chat bubble (bottom-right) during active session
- Ask security questions
- Get real-time threat analysis
- Receive browsing safety tips

### Upgrade to Pro
- Visit **Upgrade to Pro** page
- Choose subscription plan (1, 3, or 12 months)
- Complete payment
- Enjoy premium features immediately

## 🔧 Development

### Project Structure
```
muskskito/
├── client/                 # Frontend React app
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable UI components
│   │   ├── lib/           # tRPC client
│   │   └── index.css      # Global styles
├── server/                # Backend Express app
│   ├── routers.ts         # tRPC API routes
│   ├── db.ts              # Database helpers
│   └── _core/             # Core server utilities
├── drizzle/               # Database schema
│   └── schema.ts          # Table definitions
└── shared/                # Shared types & constants
```

### Available Scripts
- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm db:push` - Push database schema changes
- `pnpm lint` - Run ESLint

### Database Schema
- **users** - User accounts and subscriptions
- **user_settings** - Privacy and security preferences
- **vpn_locations** - VPN server locations
- **sessions** - Browsing sessions with threat data
- **threats** - Detected security threats
- **chat_messages** - AI assistant conversations
- **payments** - Subscription payments

## 🚢 Deployment

### Production Build
```bash
pnpm build
```

### Environment Setup
Ensure all environment variables are configured in your hosting platform.

### Database Migration
```bash
pnpm db:push
```

### Recommended Hosting
- **Frontend**: Vercel, Netlify, Cloudflare Pages
- **Backend**: Railway, Render, Fly.io
- **Database**: PlanetScale, TiDB Cloud, AWS RDS

## 🔐 Security Features

### Session Isolation
- Each browsing session runs in isolated sandbox
- No cookies or storage persistence
- Automatic cleanup on termination

### Threat Detection
- Real-time URL scanning
- Malware pattern recognition
- Phishing detection
- Confidence scoring

### Privacy Protection
- VPN IP masking
- Tracker blocking
- Ad removal
- No browsing history retention

## 💳 Pricing

### Free Plan
- **$0/month**
- 8 VPN locations
- Basic threat detection
- Auto-delete sessions
- AI assistant

### Pro Plan
- **$9.99/month** (save 10% with 3-month plan)
- **$6.99/month** (save 30% with 12-month plan)
- 24 global VPN locations
- Advanced threat detection
- Priority servers
- Enhanced protection
- Unlimited sessions
- Priority support

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🐛 Bug Reports

Found a bug? Please open an issue with:
- Description of the bug
- Steps to reproduce
- Expected behavior
- Screenshots (if applicable)

## 📞 Support

- **Documentation**: [GitHub Wiki](https://github.com/aaronalexander666/muskskito/wiki)
- **Issues**: [GitHub Issues](https://github.com/aaronalexander666/muskskito/issues)
- **Email**: support@muskskito.com

## 🙏 Acknowledgments

- Built with [Manus](https://manus.im) platform
- UI components from [shadcn/ui](https://ui.shadcn.com)
- Icons from [Lucide](https://lucide.dev)

---

**Made with 💚 by the Muskskito Team**

Browse Safe, Leave No Trace 🔒

