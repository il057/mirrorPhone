<template>
        <div class="modal-overlay" @click="$emit('cancel')">
                <div class="modal-container" @click.stop>
                        <div class="modal-header">
                                <h3>选择歌单</h3>
                                <button class="close-btn" @click="$emit('cancel')">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                                strokeWidth={1.5} stroke="currentColor" className="size-6">
                                                <path strokeLinecap="round" strokeLinejoin="round"
                                                        d="M6 18 18 6M6 6l12 12" />
                                        </svg>
                                </button>
                        </div>
                        <div class="modal-content">
                                <div v-if="isLoading" class="loading-state">
                                        <p>正在加载歌单...</p>
                                </div>
                                <div v-else-if="playlists.length === 0" class="empty-state">
                                        <p>没有找到歌单</p>
                                </div>
                                <div v-else class="playlists-list">
                                        <div v-for="playlist in playlists" :key="playlist.id" 
                                             class="playlist-item" @click="selectPlaylist(playlist)">
                                                <div class="playlist-image">
                                                        <img v-if="playlist.images && playlist.images[0]" 
                                                             :src="playlist.images[0].url" 
                                                             :alt="playlist.name">
                                                        <div v-else class="image-placeholder">
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" 
                                                                     fill="currentColor" class="bi bi-music-note-list" viewBox="0 0 16 16">
                                                                        <path d="M12 13c0 1.105-1.12 2-2.5 2S7 14.105 7 13s1.12-2 2.5-2 2.5.895 2.5 2"/>
                                                                        <path fill-rule="evenodd" d="M12 3v10h-1V3z"/>
                                                                        <path d="M11 2.82a1 1 0 0 1 .804-.98l3-.6A1 1 0 0 1 16 2.22V4l-5 1z"/>
                                                                        <path fill-rule="evenodd" d="M0 11.5a.5.5 0 0 1 .5-.5H4a.5.5 0 0 1 0 1H.5a.5.5 0 0 1-.5-.5m0-4A.5.5 0 0 1 .5 7H8a.5.5 0 0 1 0 1H.5a.5.5 0 0 1-.5-.5m0-4A.5.5 0 0 1 .5 3H8a.5.5 0 0 1 0 1H.5a.5.5 0 0 1-.5-.5"/>
                                                                </svg>
                                                        </div>
                                                </div>
                                                <div class="playlist-info">
                                                        <div class="playlist-name">{{ playlist.name }}</div>
                                                        <div class="playlist-details">{{ playlist.tracks.total }} 首歌曲 • {{ playlist.owner.display_name }}</div>
                                                        <div v-if="playlist.description" class="playlist-description">{{ playlist.description }}</div>
                                                </div>
                                        </div>
                                </div>
                        </div>
                </div>
        </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import spotifyService from '../../services/spotifyService.js';

const emit = defineEmits(['select', 'cancel']);

const isLoading = ref(false);
const playlists = ref([]);

const loadPlaylists = async () => {
        isLoading.value = true;
        try {
                const response = await spotifyService.getUserPlaylists(50);
                playlists.value = response.items || [];
        } catch (error) {
                console.error('加载歌单失败:', error);
        } finally {
                isLoading.value = false;
        }
};

const selectPlaylist = (playlist) => {
        emit('select', playlist);
};

onMounted(() => {
        loadPlaylists();
});
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
}

.loading-state,
.empty-state {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 40px 20px;
        color: var(--text-secondary);
}

.playlists-list {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
}

.playlist-item {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 12px;
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
        margin-bottom: 8px;
}

.playlist-item:hover {
        background-color: var(--bg-secondary);
        transform: translateY(-1px);
}

.playlist-image {
        width: 64px;
        height: 64px;
        border-radius: 8px;
        overflow: hidden;
        flex-shrink: 0;
}

.playlist-image img {
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

.playlist-info {
        flex: 1;
        min-width: 0;
}

.playlist-name {
        font-size: 16px;
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: 4px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
}

.playlist-details {
        font-size: 14px;
        color: var(--text-secondary);
        margin-bottom: 4px;
}

.playlist-description {
        font-size: 12px;
        color: var(--text-secondary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
}

/* 滚动条样式 */
.playlists-list::-webkit-scrollbar {
        width: 6px;
}

.playlists-list::-webkit-scrollbar-track {
        background: var(--bg-primary);
        border-radius: 3px;
}

.playlists-list::-webkit-scrollbar-thumb {
        background: var(--border-color);
        border-radius: 3px;
}

.playlists-list::-webkit-scrollbar-thumb:hover {
        background: var(--text-secondary);
}
</style>
