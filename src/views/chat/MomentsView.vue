<template>
        <main class="page-content">
                <h1>动态页面</h1>
        </main>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();
</script>

<style scoped>
.page-content {
        padding: 20px;
        padding-top: calc(var(--header-height) + 20px);
}
</style>