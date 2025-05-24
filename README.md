# 🚀 Mensajería de Plantillas WhatsApp

<div align="center">
  <img src="https://img.shields.io/badge/React-18.3.1-blue?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.5.3-blue?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Node.js-Latest-green?style=for-the-badge&logo=node.js" alt="Node.js" />
  <img src="https://img.shields.io/badge/MongoDB-Atlas-green?style=for-the-badge&logo=mongodb" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4.1-blue?style=for-the-badge&logo=tailwindcss" alt="Tailwind CSS" />
</div>

## ✨ Descripción GeneralUna hermosa y moderna aplicación web para enviar mensajes de plantilla de WhatsApp a usuarios que solicitaron pago pero no completaron su compra. Construida con React, TypeScript, y una impresionante interfaz basada en gradientes.

## 🎨 Design Features

### 🌟 Modern UI/UX
- **Gradient Backgrounds**: Beautiful blue-to-purple gradients throughout the interface
- **Glass Morphism**: Semi-transparent cards with backdrop blur effects
- **Smooth Animations**: Hover effects, scale transforms, and smooth transitions
- **Dark Mode Support**: Complete dark theme with gradient adaptations
- **Responsive Design**: Perfectly adapted for desktop, tablet, and mobile

### 🎭 Visual Enhancements
- **Custom Icons**: Lucide React icons with gradient backgrounds
- **Progress Indicators**: Beautiful progress bars with gradient fills
- **Interactive Elements**: Hover animations and scale effects
- **Color-Coded Status**: Different colors for payment methods and status
- **Emoji Integration**: Fun emojis throughout the interface

## 🛠️ Technical Stack

### Frontend
- **React 18.3.1** with TypeScript
- **Vite 5.4.2** for fast development
- **Tailwind CSS 3.4.1** for styling
- **Lucide React** for beautiful icons
- **Axios** for API communication

### Backend
- **Node.js** with Express.js
- **MongoDB Atlas** for data storage
- **Mongoose** for database modeling
- **CORS** enabled for cross-origin requests

## 🚀 Features### 📋 Template Management- **Real-time Templates**: Fetches actual WhatsApp templates from Meta Graph API- **Template Preview**: Beautiful preview cards with detailed information- **Status Indicators**: Visual status badges for template approval### 👥 User Management- **Advanced Filtering**: Filter by status, payment method, and date- **Smart Search**: Real-time search by WhatsApp number- **Bulk Selection**: Select all or individual users- **Visual User Cards**: Avatar-style user representation### 🎯 Message Sending- **Batch Processing**: Send messages to multiple users with real WhatsApp API- **Advanced Progress Modal**: Beautiful modal with real-time progress tracking- **Speed Control**: Adjustable sending speed (Slow, Normal, Fast, Very Fast)- **Pause/Resume**: Full control over the sending process- **Error Handling**: Detailed error reporting for each message- **Success Tracking**: Real-time success/failure statistics- **Detailed Results**: Complete log of all sending attempts with timestamps- **Cancellation**: Ability to cancel the sending process at any time

## 📁 Project Structure

```
project/
├── 📁 src/
│   ├── 📁 components/
│   │   ├── 🎨 TemplateSelector.tsx    # Template selection with preview
│   │   ├── 👥 UserList.tsx            # Enhanced user table
│   │   └── 🚀 SendingPanel.tsx        # Message sending controls
│   ├── 📁 api/
│   │   └── ⚡ services.ts             # API communication
│   ├── 📁 utils/
│   │   └── 📅 dateUtils.ts            # Date formatting utilities
│   ├── 🎯 App.tsx                     # Main application
│   ├── 🎨 index.css                   # Custom styles
│   └── 📝 types.ts                    # TypeScript definitions
├── 📁 server/
│   ├── 📁 routes/
│   │   ├── 📋 templateRoutes.js       # WhatsApp template endpoints
│   │   ├── 👥 userRoutes.js           # User management endpoints
│   │   └── 📨 messageRoutes.js        # Message sending endpoints
│   ├── 📁 models/
│   │   └── 👤 userModel.js            # MongoDB user schema
│   └── ⚙️ index.js                    # Express server
└── 📋 package.json                    # Project dependencies
```

## ⚙️ Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd project
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Meta (Facebook) WhatsApp Business API Configuration
META_ACCESS_TOKEN=your_meta_access_token_here
TEMPLATE_ID=your_whatsapp_business_phone_number_id_here
```

### 4. MongoDB Configuration
The MongoDB connection is pre-configured in `server/index.js` with:
- **Database**: `bot-WIN+2`
- **Collection**: `bot-win+2` (149,399+ documents)
- **Atlas Cluster**: `cluster0.mzz8o50.mongodb.net`

### 5. Start the Application
```bash
# Start both frontend and backend simultaneously
npm run dev:all

# Or start them separately:
npm run dev      # Frontend (Vite)
npm run server   # Backend (Node.js)
```

## 🎨 UI Components

### 🏠 Header
- Gradient background with glass morphism
- Animated logo with WhatsApp colors
- Beautiful typography with gradient text

### 📋 Template Selector
- Dropdown with custom styling
- Template preview cards
- Status indicators with colors
- Responsive grid layout

### 👥 User List
- Modern table design with hover effects
- Avatar-style user representations
- Color-coded status badges
- Interactive checkboxes

### 🚀 Sending Panel
- Three-column layout for controls
- Real-time progress indicators
- Beautiful action buttons
- Status cards with gradients

## 🔧 API Endpoints

### Templates
- `GET /api/templates` - Fetch WhatsApp templates

### Users
- `GET /api/users/pending` - Get users pending payment
- `POST /api/users/mark-sent` - Mark message as sent

### Messages
- `POST /api/messages/send` - Send template message

## 🎯 Key Features Implemented

### ✅ Visual Enhancements
- [x] Gradient backgrounds and glass morphism
- [x] Smooth animations and hover effects
- [x] Custom color palette with dark mode
- [x] Responsive design patterns
- [x] Interactive UI elements

### ✅ Functional Improvements
- [x] Real WhatsApp template integration
- [x] MongoDB connection with correct collection
- [x] Advanced filtering and search
- [x] Bulk user selection
- [x] Progress tracking for message sending

### ✅ Technical Optimizations
- [x] TypeScript for type safety
- [x] Error handling and fallbacks
- [x] Performance optimizations
- [x] Clean code architecture
- [x] Comprehensive documentation

## 🚀 Usage

1. **Select a Template**: Choose from available WhatsApp templates
2. **Filter Users**: Use advanced filters to target specific users
3. **Select Recipients**: Choose individual users or select all
4. **Send Messages**: Monitor progress in real-time
5. **Track Results**: View sent status and success rates

## 🎨 Custom Styling

The application uses custom CSS classes for enhanced styling:

```css
.glass-effect        /* Glass morphism background */
.gradient-text       /* Gradient text effects */
.btn-gradient        /* Gradient buttons */
.card-hover          /* Hover animations */
```

## 📱 Responsive Design

- **Desktop**: Full-featured layout with three-column grids
- **Tablet**: Adapted layout with responsive columns
- **Mobile**: Stacked layout optimized for touch

## 🔮 Future Enhancements

- [ ] Real-time notifications
- [ ] Message scheduling
- [ ] Analytics dashboard
- [ ] Template editor
- [ ] User segmentation
- [ ] A/B testing capabilities

## 👨‍💻 Development

### Scripts
```bash
npm run dev          # Start frontend development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run server       # Start backend server
npm run dev:all      # Start both servers
npm run lint         # Run ESLint
```

### Tech Stack Highlights
- **Vite**: Lightning-fast development
- **React 18**: Latest React features
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Express.js**: Robust backend framework
- **MongoDB**: Flexible document database

---

<div align="center">
  <p>Made with ❤️ and lots of ☕</p>
  <p><strong>WhatsApp Template Messenger</strong> - Connecting businesses with their customers</p>
</div> 