<template>
        <div class="contacts-page">
                <div class="contacts-nav">
                        <button @click="activeTab = 'groups'" :class="{ active: activeTab === 'groups' }">分组</button>
                        <button @click="activeTab = 'friends'" :class="{ active: activeTab === 'friends' }">好友</button>
                        <button @click="activeTab = 'groupChats'"
                                :class="{ active: activeTab === 'groupChats' }">群聊</button>
                </div>
                <main class="page-content">
                        <div v-if="activeTab === 'groups'" class="contact-list">
                                <div v-for="group in contactGroups" :key="group.id" class="group-section">
                                        <div class="group-header" @click="toggleGroup(group.id)">
                                                <svg class="arrow" :class="{ 'is-open': openGroups.includes(group.id) }"
                                                        viewBox="0 0 24 24">
                                                        <path d="m9 18 6-6-6-6" />
                                                </svg>

                                                <span class="group-name">{{ group.name }}</span>
                                                <span class="group-count">{{ group.members.length }}</span>
                                        </div>
                                        <ul v-if="openGroups.includes(group.id)" class="group-members-list">
                                                <li v-for="member in group.members" :key="member.id"
                                                        class="contact-item" @click="goToProfile(member.id)">
                                                        <div class="avatar">
                                                                <img v-if="member.currentAvatar"
                                                                        :src="member.currentAvatar" :alt="member.name"
                                                                        class="avatar-image">
                                                                <span v-else class="avatar-initial">{{
                                                                        getInitial(member.name) }}</span>
                                                        </div>
                                                        <div class="contact-info">
                                                                <span class="contact-name">{{ member.name }}</span>
                                                                <div class="contact-signature">
                                                                        <div class="status-dot"
                                                                                :style="{ backgroundColor: member.status?.color || '#607D8B' }">
                                                                        </div>
                                                                        <span>{{ member.signature }}</span>
                                                                </div>
                                                        </div>
                                                </li>
                                        </ul>
                                </div>
                        </div>
                        <div v-if="activeTab === 'friends'" class="contact-list">
                                <div class="special-care-section">
                                        <div class="alphabet-header">特别关心</div>
                                        <ul>
                                                <li v-for="friend in specialCareFriends" :key="friend.id"
                                                        class="contact-item" @click="goToProfile(friend.id)">
                                                        <div class="avatar">
                                                                <img v-if="friend.currentAvatar"
                                                                        :src="friend.currentAvatar" :alt="friend.name"
                                                                        class="avatar-image">
                                                                <span v-else class="avatar-initial">{{
                                                                        getInitial(friend.name) }}</span>
                                                        </div>
                                                        <div class="contact-info">
                                                                <span class="contact-name">{{ friend.name }}</span>
                                                                <div class="contact-signature">
                                                                        <div class="status-dot"
                                                                                :style="{ backgroundColor: friend.status?.color || '#607D8B' }">
                                                                        </div>
                                                                        <span>{{ friend.signature || " "}}</span>
                                                                </div>
                                                        </div>
                                                </li>
                                        </ul>
                                </div>
                                <div v-for="(group, letter) in groupedFriends" :key="letter">
                                        <div class="alphabet-header">{{ letter }}</div>
                                        <ul>
                                                <li v-for="friend in group" :key="friend.id" class="contact-item"
                                                        @click="goToProfile(friend.id)">
                                                        <div class="avatar">
                                                                <img v-if="friend.currentAvatar"
                                                                        :src="friend.currentAvatar" :alt="friend.name"
                                                                        class="avatar-image">
                                                                <span v-else class="avatar-initial">{{
                                                                        getInitial(friend.name) }}</span>
                                                        </div>
                                                        <div class="contact-info">
                                                                <span class="contact-name">{{ friend.name }}</span>
                                                                <div class="contact-signature">
                                                                        <div class="status-dot"
                                                                                :style="{ backgroundColor: friend.status?.color || '#607D8B' }">
                                                                        </div>
                                                                        <span>{{ friend.signature || " "}}</span>
                                                                </div>
                                                        </div>
                                                </li>
                                        </ul>
                                </div>
                        </div>
                        <div v-if="activeTab === 'groupChats'" class="contact-list">
                                <ul>
                                        <li v-for="chat in groupChats" :key="chat.id" class="contact-item"
                                                @click="goToProfile(chat.id)">
                                                <div class="avatar group-avatar">
                                                        <span class="avatar-initial">#</span>
                                                </div>
                                                <span>{{ chat.name }}</span>
                                        </li>
                                </ul>
                        </div>
                </main>
        </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { pinyin } from 'pinyin-pro';
import { useObservable } from '@vueuse/rxjs';
import { liveQuery } from 'dexie';
import db from '../../services/database.js';

const router = useRouter();

const activeTab = ref('groups');
const openGroups = ref(['group_special', 'group_family']); // Let's default a couple groups to open

// FIX: Make data fetching reactive using liveQuery. This solves the "Special Care" group not appearing.
const allActors = useObservable(liveQuery(() => db.actors.toArray()), { initialValue: [] });
const allGroups = useObservable(liveQuery(() => db.groups.orderBy('order').toArray()), { initialValue: [] });

const getInitial = (name) => {
        if (!name) return '#';
        const firstChar = name.charAt(0);
        return /^[a-zA-Z]/.test(firstChar) ? firstChar.toUpperCase() : firstChar;
};

// 辅助函数：过滤掉用户人格预设和隐藏实体
const isValidActor = (actor) => {
        return !actor.isGroup && 
               !actor.isHidden && 
               actor.id !== '__USER__' && 
               !actor.id?.startsWith('user_');
};

// Reworked logic to include "Ungrouped" and handle special care members appearing in multiple groups.
const contactGroups = computed(() => {
        if (!allGroups.value || !allActors.value) return [];

        // 1. Get the regular, user-managed groups from the database
        const regularGroups = allGroups.value
                .filter(group => group.id !== 'group_special')
                .map(group => ({
                        ...group,
                        members: allActors.value.filter(actor => 
                                actor.groupIds?.includes(group.id) && 
                                isValidActor(actor)
                        )
                }));

        // 2. Build the "Special Care" group if there are any members
        let specialCareGroup = null;
        const specialCareMembers = allActors.value.filter(actor => 
                actor.specialCare && 
                isValidActor(actor)
        );
        if (specialCareMembers.length > 0) {
                specialCareGroup = {
                        id: 'group_special',
                        name: '特别关心',
                        order: 0,
                        members: specialCareMembers
                };
        }

        // 3. Build the "Ungrouped" group if there are any members
        let ungroupedGroup = null;
        const ungroupedMembers = allActors.value.filter(
                actor => isValidActor(actor) && (!actor.groupIds || actor.groupIds.length === 0)
        );
        if (ungroupedMembers.length > 0) {
                ungroupedGroup = {
                        id: 'ungrouped',
                        name: '未分组',
                        order: 9999, // High order number to keep it at the bottom
                        members: ungroupedMembers
                };
        }

        // 4. Assemble the final list
        const finalGroups = [];
        if (specialCareGroup) finalGroups.push(specialCareGroup);
        finalGroups.push(...regularGroups);
        if (ungroupedGroup) finalGroups.push(ungroupedGroup);

        return finalGroups.filter(g => g.members.length > 0);
});


const toggleGroup = (groupId) => {
        const index = openGroups.value.indexOf(groupId);
        if (index > -1) {
                openGroups.value.splice(index, 1);
        } else {
                openGroups.value.push(groupId);
        }
};
    
// --- Friends Tab Logic ---
// Helper to get a sortable string from a name
const getSortableName = (name) => {
        const pinyinResult = pinyin(name, { toneType: 'none', nonZh: 'consecutive' });
        return pinyinResult.toUpperCase();
};

const friends = computed(() =>
        allActors.value
                .filter(a => isValidActor(a))
                .map(a => ({ ...a, sortableName: getSortableName(a.name) })) // Add temporary sortable name
                .sort((a, b) => a.sortableName.localeCompare(b.sortableName, 'en-US'))
);

const specialCareFriends = computed(() => friends.value.filter(f => f.specialCare));

const groupedFriends = computed(() => {
        const groups = {};
        friends.value.forEach(friend => {
                const firstChar = friend.sortableName.charAt(0);
                const letter = /^[A-Z]/.test(firstChar) ? firstChar : '#';
                if (!groups[letter]) {
                        groups[letter] = [];
                }
                groups[letter].push(friend);
        });
        // Ensure '#' group is at the end if it exists
        if (groups['#']) {
                const hashGroup = groups['#'];
                delete groups['#'];
                groups['#'] = hashGroup;
        }
        return groups;
});


// --- Group Chats Tab Logic ---
const groupChats = computed(() => allActors.value.filter(a => a.isGroup).sort((a, b) => a.createdAt - b.createdAt));

// 跳转到profile页面
const goToProfile = (actorId) => {
        router.push(`/profile/${actorId}?from=contacts`);
};

</script>

<style scoped>

.contacts-nav {
        display: flex;
        justify-content: space-around;
        padding:  0;
        border-bottom: 1px solid var(--border-color);
        background-color: var(--header-secondary-bg);
        position: absolute;
        /* Height of the header */
        z-index: 99;
        top: var(--header-height);
        width: 100%;
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        height: 48px;

}

.contacts-nav button {
        background: none;
        border: none;
        color: var(--text-secondary);
        font-size: 16px;
        padding: 5px 15px;
        cursor: pointer;
        border-bottom: 2px solid transparent;
}

.contacts-nav button.active {
        color: var(--accent-primary);
        border-bottom-color: var(--accent-primary);
}

.page-content {
        flex-grow: 1;
        overflow-y: auto;
        padding-top: calc(var(--header-height) + 48px);
        padding-bottom: calc(var(--footer-height) );
}

.contact-list ul {
        list-style: none;
        padding: 0;
        margin: 0;
}

.contact-item,
.group-header {
        display: flex;
        align-items: center;
        padding: 12px 15px;
        border-bottom: 1px solid var(--border-color);
        cursor: pointer;
        transition: background-color 0.2s;
}

.contact-item:hover {
        background-color: var(--bg-secondary);
}

.group-avatar .avatar-initial {
        color: var(--accent-primary);
}

.avatar-initial {
        color: var(--accent-primary);
}

.group-header {
        cursor: pointer;
        background-color: var(--bg-secondary);
        height: 10px;
        position: sticky;
        top: 0;
        z-index: 1;
}

.arrow {
        width: 20px;
        height: 20px;
        stroke: var(--text-secondary);
        fill: var(--bg-secondary);
        transition: transform 0.2s ease-in-out;
}

.arrow.is-open {
        transform: rotate(90deg);
}

.group-name {
        flex-grow: 1;
        margin-left: 10px;
        font-weight: 600;
}

.group-count {
        color: var(--text-secondary);
        font-size: 14px;
}

.alphabet-header {
        padding: 4px 15px;
        background-color: var(--bg-primary);
        color: var(--text-secondary);
        font-weight: 600;
        position: sticky;
        top: 0;
        z-index: 1;
}

.contact-info {
        display: flex;
        flex-direction: column;
}

.contact-name {
        font-weight: 600;
}

.contact-signature {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 14px;
        color: var(--text-secondary);
}

.status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
}

</style>