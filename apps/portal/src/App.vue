<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import SiteHeader from './components/SiteHeader.vue'
import { useSiteStore } from './stores/site'

const site = useSiteStore()
</script>

<template>
  <div class="portal">
    <SiteHeader />
    <main class="portal-main">
      <RouterView />
    </main>
    <footer class="site-foot">
      <div class="site-foot__in">
        <div>
          <div class="foot-brand">
            <span class="brandmark__mark" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
            <span>{{ site.name }}</span>
          </div>
          <p class="slogan">看院子，问档期，到村头去住两晚。</p>
          <p>本平台仅提供信息与咨询意向，不代收费用。</p>
        </div>
        <div>
          <h5>去哪看看</h5>
          <ul>
            <li><RouterLink to="/listings">找农家乐</RouterLink></li>
            <li><RouterLink to="/guides">水乡攻略</RouterLink></li>
            <li><RouterLink to="/my/intents">我的意向</RouterLink></li>
            <li><RouterLink to="/merchant/apply">商家入驻</RouterLink></li>
          </ul>
        </div>
        <div>
          <h5>联系我们</h5>
          <ul>
            <li>
              <a :href="`tel:${site.phone.replace(/\s+/g, '')}`">客服 {{ site.phone }}</a>
            </li>
            <li>服务时间 08:00 - 20:00</li>
          </ul>
        </div>
      </div>
      <div class="site-foot__bottom">© {{ new Date().getFullYear() }} {{ site.name }}</div>
    </footer>
  </div>
</template>
