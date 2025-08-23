<template>
        <div>
                <header>
                        <h1>{{ isNew ? '创建新角色' : '编辑资料' }}</h1>
                        <button @click="saveChanges">保存</button>
                </header>

                <main>
                        <label>昵称</label>
                        <input v-model="actor.name" />

                        <div v-if="!isGroup">
                                <label>名字</label>
                                <input v-model="actor.realName" />
                                <label>初始关系设定...</label>
                        </div>

                        <div v-else>
                                <button @click="manageMembers">管理群成员</button>
                        </div>

                </main>
        </div>
</template>

<script>
</script>