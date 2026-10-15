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
    <footer class="portal-footer">
      <span>{{ site.name }}</span>
      <a :href="`tel:${site.phone.replace(/\s+/g, '')}`">客服 {{ site.phone }}</a>
      <RouterLink to="/merchant/apply">商家入驻</RouterLink>
    </footer>
  </div>
</template>

<style scoped>
.portal {
  min-height: 100svh;
  display: flex;
  flex-direction: column;
}

.portal-main {
  flex: 1;
  width: min(var(--content-width), calc(100% - var(--space-6)));
  margin: 0 auto;
  padding: var(--space-5) 0 var(--space-7);
}

.portal-footer {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-5);
  border-top: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  font-size: var(--font-caption);
}

.portal-footer a {
  color: var(--color-text-secondary);
}
</style>
