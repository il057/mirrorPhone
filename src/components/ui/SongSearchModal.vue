<template>
        <div class="modal-overlay" @click="$emit('cancel')">
                <div class="modal-container" @click.stop>
                        <div class="modal-header">
                                <h3>搜索歌曲</h3>
                                <button class="close-btn" @click="$emit('cancel')">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                                strokeWidth={1.5} stroke="currentColor" className="size-6">
                                                <path strokeLinecap="round" strokeLinejoin="round"
                                                        d="M6 18 18 6M6 6l12 12" />
                                        </svg>
                                </button>
                        </div>
                        <div class="modal-content">
                                <div class="search-input-container">
                                        <input 
                                                v-model="searchQuery" 
                                                type="text" 
                                                placeholder="搜索歌曲、艺术家或专辑..."
                                                class="search-input"
                                                @input="handleSearch"
                                                @keydown.enter="performSearch"
                                        />
                                        <button class="search-btn" @click="performSearch" :disabled="!searchQuery.trim()">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" 
                                                     fill="currentColor" class="bi bi-search" viewBox="0 0 16 16">
                                                        <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0"/>
                                                </svg>
                                        </button>
                                </div>
                                
                                <div class="search-results">
                                        <div v-if="isLoading" class="loading-state">
                                                <p>正在搜索...</p>
                                        </div>
                                        <div v-else-if="searchQuery && tracks.length === 0 && hasSearched" class="empty-state">
                                                <p>没有找到相关歌曲</p>
                                        </div>
                                        <div v-else-if="!searchQuery" class="initial-state">
                                                <p>输入歌曲名称开始搜索</p>
                                        </div>
                                        <div v-else class="tracks-list">
                                                <div v-for="track in tracks" :key="track.id" 
                                                     class="track-item" @click="selectTrack(track)">
                                                        <div class="track-image">
                                                                <img v-if="track.album.images && track.album.images[0]" 
                                                                     :src="track.album.images[0].url" 
                                                                     :alt="track.album.name">
                                                                <div v-else class="image-placeholder">
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" 
                                                                             fill="currentColor" class="bi bi-music-note" viewBox="0 0 16 16">
                                                                                <path d="M9 13c0 1.105-1.12 2-2.5 2S4 14.105 4 13s1.12-2 2.5-2 2.5.895 2.5 2"/>
                                                                                <path fill-rule="evenodd" d="M9 3v10H8V3z"/>
                                                                                <path d="M8 2.82a1 1 0 0 1 .804-.98l3-.6A1 1 0 0 1 13 2.22V4L8 5z"/>
                                                                        </svg>
                                                                </div>
                                                        </div>
                                                        <div class="track-info">
                                                                <div class="track-name">{{ track.name }}</div>
                                                                <div class="track-artist">{{ getArtistNames(track.artists) }}</div>
                                                                <div class="track-album">{{ track.album.name }}</div>
                                                        </div>
                                                        <div class="track-duration">
                                                                {{ formatDuration(track.duration_ms) }}
                                                        </div>
                                                </div>
                                        </div>
                                </div>
                        </div>
                </div>
        </div>
</template>

<script setup>
import { ref } from 'vue';
import spotifyService from '../../services/spotifyService.js';

const emit = defineEmits(['select', 'cancel']);

const searchQuery = ref('');
const tracks = ref([]);
const isLoading = ref(false);
const hasSearched = ref(false);
let searchTimeout = null;

const handleSearch = () => {
        if (searchTimeout) {
                clearTimeout(searchTimeout);
        }
        
        searchTimeout = setTimeout(() => {
                if (searchQuery.value.trim()) {
                        performSearch();
                }
        }, 500);
};

const performSearch = async () => {
        if (!searchQuery.value.trim()) return;
        
        isLoading.value = true;
        hasSearched.value = true;
        
        try {
                const response = await spotifyService.apiRequest(`/search?q=${encodeURIComponent(searchQuery.value)}&type=track&limit=20`);
                tracks.value = response.tracks?.items || [];
        } catch (error) {
                console.error('搜索失败:', error);
                tracks.value = [];
        } finally {
                isLoading.value = false;
        }
};

const selectTrack = (track) => {
        emit('select', track);
};

const getArtistNames = (artists) => {
        return artists?.map(a => a.name).join(', ') || '未知艺术家';
};

const formatDuration = (ms) => {
        if (!ms) return '--:--';
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};
</script>

<style scoped>

.modal-container {
        background-color: var(--bg-card);
        border-radius: 16px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        max-height: 80vh;
        overflow: hidden;
        display: flex;
        flex-direction: column;
}

.modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 20px 20px 15px;
        border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
        margin: 0;
        color: var(--text-primary);
        font-size: 18px;
        font-weight: 600;
}

.close-btn {
        background: none;
        border: none;
        font-size: 24px;
        color: var(--text-secondary);
        cursor: pointer;
        padding: 0;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background-color 0.2s;
}

.close-btn:hover {
        color: var(--accent-primary);
}

.modal-content {
        flex: 1;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        padding: 20px;
}

.search-input-container {
        display: flex;
        gap: 8px;
        margin-bottom: 20px;
}

.search-input {
        flex: 1;
        padding: 12px 16px;
        border: 1px solid var(--border-color);
        border-radius: 8px;
        background: var(--bg-primary);
        color: var(--text-primary);
        font-size: 14px;
        outline: none;
        transition: border-color 0.2s ease;
}

.search-input:focus {
        border-color: var(--accent-primary);
}

.search-input::placeholder {
        color: var(--text-secondary);
}

.search-btn {
        padding: 12px 16px;
        background: var(--accent-primary);
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
}

.search-btn:hover:not(:disabled) {
        background: var(--accent-darker);
}

.search-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
}

.search-results {
        flex: 1;
        overflow: hidden;
        display: flex;
        flex-direction: column;
}

.loading-state,
.empty-state,
.initial-state {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 40px 20px;
        color: var(--text-secondary);
}

.tracks-list {
        flex: 1;
        overflow-y: auto;
}

.track-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
        margin-bottom: 8px;
}

.track-item:hover {
        background-color: var(--bg-secondary);
}

.track-image {
        width: 48px;
        height: 48px;
        border-radius: 6px;
        overflow: hidden;
        flex-shrink: 0;
}

.track-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
}

.image-placeholder {
        width: 100%;
        height: 100%;
        background: var(--bg-primary);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--text-secondary);
}

.track-info {
        flex: 1;
        min-width: 0;
}

.track-name {
        font-size: 14px;
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: 2px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
}

.track-artist {
        font-size: 13px;
        color: var(--text-secondary);
        margin-bottom: 2px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
}

.track-album {
        font-size: 12px;
        color: var(--text-secondary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
}

.track-duration {
        font-size: 12px;
        color: var(--text-secondary);
        flex-shrink: 0;
}

/* 滚动条样式 */
.tracks-list::-webkit-scrollbar {
        width: 6px;
}

.tracks-list::-webkit-scrollbar-track {
        background: var(--bg-primary);
        border-radius: 3px;
}

.tracks-list::-webkit-scrollbar-thumb {
        background: var(--border-color);
        border-radius: 3px;
}

.tracks-list::-webkit-scrollbar-thumb:hover {
        background: var(--text-secondary);
}
</style>
