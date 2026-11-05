<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../stores/user'

const userStore = useUserStore()

const formRef = ref(null)
const loading = ref(false)

const form = reactive({
  username: '',
  password: '',
  confirm: '',
  nickname: ''
})

const isRegister = computed(() => userStore.loginMode === 'register')

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { pattern: /^[A-Za-z0-9_]{3,20}$/, message: '用户名为 3-20 位字母、数字或下划线', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度为 6-20 位', trigger: 'blur' }
  ],
  confirm: [
    {
      validator: (rule, value, callback) => {
        if (!isRegister.value) return callback()
        if (!value) return callback(new Error('请再次输入密码'))
        if (value !== form.password) return callback(new Error('两次输入的密码不一致'))
        callback()
      },
      trigger: 'blur'
    }
  ]
}

watch(
  () => userStore.loginVisible,
  (visible) => {
    if (visible) {
      form.username = ''
      form.password = ''
      form.confirm = ''
      form.nickname = ''
      formRef.value?.clearValidate()
    }
  }
)

function switchMode() {
  userStore.loginMode = isRegister.value ? 'login' : 'register'
  formRef.value?.clearValidate()
}

async function submit() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    loading.value = true
    try {
      if (isRegister.value) {
        await userStore.register({
          username: form.username,
          password: form.password,
          nickname: form.nickname || form.username
        })
        ElMessage.success('注册成功，开始听歌吧')
      } else {
        await userStore.login({ username: form.username, password: form.password })
        ElMessage.success('登录成功')
      }
    } catch {
      // 错误提示已由 axios 拦截器统一处理
    } finally {
      loading.value = false
    }
  })
}
</script>

<template>
  <el-dialog
    v-model="userStore.loginVisible"
    :title="isRegister ? '注册云音乐账号' : '登录云音乐'"
    width="380px"
    align-center
    class="login-dialog"
    @close="userStore.closeLogin()"
  >
    <div class="login-tip">
      {{ isRegister ? '注册后即可收藏、评论、创建歌单' : '使用演示账号：test / 123456（管理员：admin / 123456）' }}
    </div>

    <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent>
      <el-form-item label="用户名" prop="username">
        <el-input v-model="form.username" placeholder="请输入用户名" :prefix-icon="'User'" />
      </el-form-item>

      <el-form-item v-if="isRegister" label="昵称" prop="nickname">
        <el-input v-model="form.nickname" placeholder="不填则默认使用用户名" :prefix-icon="'Postcard'" />
      </el-form-item>

      <el-form-item label="密码" prop="password">
        <el-input
          v-model="form.password"
          type="password"
          show-password
          placeholder="请输入密码"
          :prefix-icon="'Lock'"
          @keyup.enter="submit"
        />
      </el-form-item>

      <el-form-item v-if="isRegister" label="确认密码" prop="confirm">
        <el-input
          v-model="form.confirm"
          type="password"
          show-password
          placeholder="请再次输入密码"
          :prefix-icon="'Lock'"
          @keyup.enter="submit"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="login-footer">
        <el-button text @click="switchMode">{{ isRegister ? '已有账号？去登录' : '还没有账号？去注册' }}</el-button>
        <el-button type="primary" :loading="loading" @click="submit">
          {{ isRegister ? '注册' : '登录' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.login-tip {
  margin: -6px 0 16px;
  color: var(--music-text-3);
  font-size: 12px;
  line-height: 1.6;
}

.login-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
