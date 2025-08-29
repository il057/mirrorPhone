# MirrorPhone - AI Coding Assistant Instructions

## Project Overview
MirrorPhone is a Vue 3 PWA that simulates a smartphone interface with AI chat capabilities, music integration, and cloud synchronization. Built with Vite, it uses Dexie for IndexedDB storage and features a complex data model with actors, conversations, and memories.

## Architecture Patterns

### Data Layer
- **Dexie IndexedDB**: All data stored locally using Dexie ORM
- **Service Layer**: Each domain has dedicated service (e.g., `database.js`, `dataService.js`, `aiChatAPIService.js`)
- **Data Export/Import**: JSON-based backup system with size optimization
- **Incremental Backups**: Automatic background sync with change tracking

### Component Structure
```vue
<!-- Standard Vue 3 Composition API pattern -->
<template>
  <div class="component">
    <!-- Component content -->
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

// Props with detailed validation
defineProps({
  propName: {
    type: String,
    required: true,
    default: ''
  }
})

// Reactive state
const state = ref(initialValue)

// Computed properties for derived state
const computedValue = computed(() => {
  return state.value * 2
})

// Lifecycle hooks
onMounted(() => {
  initializeComponent()
})
</script>

<style scoped>
/* CSS custom properties for theming */
.component {
  background: var(--app-bg);
  border: 1px solid var(--app-border);
  border-radius: min(16px, calc(var(--cell-size, 80px) * 0.2));
}
</style>
```

### Service Patterns
```javascript
// Service structure pattern
import db from './database.js'

export async function serviceFunction(param) {
  try {
    // Database operations
    const result = await db.table.where({ field: param }).first()
    
    // Business logic
    const processed = processResult(result)
    
    return processed
  } catch (error) {
    console.error('Service error:', error)
    throw error
  }
}
```

## Key Conventions

### Database Schema
- **Actors Table**: Core entities (users, characters, groups) with complex relationships
- **Conversations**: Chat history with memory context
- **Memories**: AI context and relationship tracking
- **Settings**: Global configuration with service-specific profiles

### State Management
- **Reactive Settings**: Global settings managed through `globalSettings` reactive object
- **Service Isolation**: Each service manages its own domain state
- **Event-Driven**: Background services use timers and event listeners

### API Integration
- **Multiple AI Providers**: Configurable API profiles with fallback support
- **Cloud Sync**: Dual sync options (GitHub Gist + Nutstore WebDAV)
- **External Services**: Spotify, ElevenLabs TTS, Cloudinary for media

## Development Workflow

### Essential Commands
```bash
# Development server with hot reload
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

### Key Files to Understand
- `src/main.js` - App initialization and theme setup
- `src/services/database.js` - Dexie schema and core data operations
- `src/services/dataService.js` - Backup/export functionality
- `src/router/index.js` - Route configuration
- `src/views/SettingsView.vue` - Complex settings management
- `vite.config.js` - Build configuration with proxy setup

## Common Patterns

### Error Handling
```javascript
try {
  const result = await asyncOperation()
  return result
} catch (error) {
  console.error('Operation failed:', error)
  // Graceful degradation or user notification
  showToast(`Operation failed: ${error.message}`, 'error')
  throw error
}
```

### Database Queries
```javascript
// Complex queries with Dexie
const conversations = await db.conversations
  .where('actorId').equals(actorId)
  .and(conv => conv.timestamp > cutoffDate)
  .sortBy('timestamp')
```

### Component Communication
- **Props Down**: Parent passes data via props
- **Events Up**: Child emits events for parent actions
- **Service Injection**: Shared state through service calls

## Build & Deployment

### Environment Setup
- **Development**: `npm run dev` with hot reload and proxy
- **Production**: `npm run build` creates optimized bundle
- **PWA Features**: Service worker for offline functionality

### Proxy Configuration
Vite proxy handles CORS for external APIs:
- `/api/nutstore` → `https://dav.jianguoyun.com/dav`

## Testing & Debugging

### Common Issues
- **CORS Errors**: Use Vite proxy for external API calls
- **Database Issues**: Check Dexie schema versions
- **Sync Problems**: Verify API tokens and network connectivity

### Debug Tools
- Browser DevTools for Vue component inspection
- IndexedDB viewer for local data debugging
- Network tab for API request monitoring

## Code Style Guidelines

### Vue Components
- Use Composition API with `<script setup>`
- Scoped styles with CSS custom properties
- Consistent prop validation and defaults
- Event emission for parent communication

### Services
- Async/await for all database operations
- Comprehensive error handling
- Clear function documentation
- Service isolation by domain

### File Organization
```
src/
├── components/     # Reusable UI components
├── views/         # Page-level components
├── services/      # Business logic and data access
├── utils/         # Helper functions
├── assets/        # Static assets
└── router/        # Route configuration
```
