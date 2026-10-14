<template>
  <el-result icon="warning" title="无权限" sub-title="当前账号不能访问该功能。客服没有入驻审核、上下架审核、资讯、商家账号和站点配置入口。">
    <template #extra>
      <el-button type="primary" @click="$router.push('/')">返回工作台</el-button>
    </template>
  </el-result>
</template>
