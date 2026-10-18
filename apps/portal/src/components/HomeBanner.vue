<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import {
  BANNER_INTERVAL_MS,
  bannerAlt,
  bannerAutoplay,
  classifyBannerLink,
  stepBanner,
  type HomeBanner,
} from '../domain/banners'

const props = defineProps<{
  banners: HomeBanner[]
}>()

const index = ref(0)
const paused = ref(false)
const reduceMotion = ref(false)
const broken = ref<Record<string, boolean>>({})
const startX = ref<number | null>(null)
let timer: number | undefined
let motionQuery: MediaQueryList | undefined

const current = computed(() => props.banners[index.value] ?? props.banners[0] ?? null)
const multiple = computed(() => props.banners.length >= 2)
const link = computed(() => (current.value ? classifyBannerLink(current.value.linkUrl) : { kind: 'unsafe' as const }))
const alt = computed(() => bannerAlt(current.value?.title))

function stop() {
  if (timer !== undefined) window.clearInterval(timer)
  timer = undefined
}

function arm() {
  stop()
  if (!bannerAutoplay(props.banners.length, paused.value, reduceMotion.value)) return
  timer = window.setInterval(() => {
    index.value = stepBanner(props.banners.length, index.value, 1)
  }, BANNER_INTERVAL_MS)
}

function go(delta: number) {
  if (props.banners.length < 2) return
  index.value = stepBanner(props.banners.length, index.value, delta)
  arm()
}

function pause() {
  paused.value = true
  stop()
}

function resume() {
  paused.value = false
  arm()
}

function onFocusOut(event: FocusEvent) {
  const next = event.relatedTarget
  const host = event.currentTarget
  if (next instanceof Node && host instanceof Node && host.contains(next)) return
  resume()
}

function onKey(event: KeyboardEvent) {
  if (!multiple.value) return
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
  event.preventDefault()
  go(event.key === 'ArrowRight' ? 1 : -1)
}

function onPointerDown(event: PointerEvent) {
  const target = event.target
  if (target instanceof Element && target.closest('button')) {
    startX.value = null
    return
  }
  startX.value = event.clientX
}

function onPointerUp(event: PointerEvent) {
  if (startX.value === null) return
  const delta = event.clientX - startX.value
  startX.value = null
  if (Math.abs(delta) < 40) return
  go(delta < 0 ? 1 : -1)
}

function onImageError(id: string) {
  broken.value = { ...broken.value, [id]: true }
}

function onMotionChange() {
  reduceMotion.value = motionQuery?.matches ?? false
  arm()
}

watch(
  () => props.banners.map((item) => item.id).join(','),
  () => {
    if (index.value >= props.banners.length) index.value = 0
    arm()
  },
)

onMounted(() => {
  if (typeof window.matchMedia === 'function') {
    motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    reduceMotion.value = motionQuery.matches
    motionQuery.addEventListener('change', onMotionChange)
  }
  arm()
})

onUnmounted(() => {
  stop()
  motionQuery?.removeEventListener('change', onMotionChange)
})
</script>

<template>
  <section
    v-if="current"
    class="home-banner"
    :tabindex="multiple ? 0 : undefined"
    @mouseenter="pause"
    @mouseleave="resume"
    @focusin="pause"
    @focusout="onFocusOut"
    @keydown="onKey"
    @pointerdown="onPointerDown"
    @pointerup="onPointerUp"
  >
    <RouterLink v-if="link.kind === 'internal'" class="home-banner-frame" :to="link.href">
      <img v-if="!broken[current.id]" :src="current.imageUrl" :alt="alt" @error="onImageError(current.id)" />
      <span v-else class="home-banner-fallback" role="img" :aria-label="alt">{{ alt }}</span>
    </RouterLink>
    <a
      v-else-if="link.kind === 'external'"
      class="home-banner-frame"
      :href="link.href"
      target="_blank"
      rel="noopener noreferrer"
    >
      <img v-if="!broken[current.id]" :src="current.imageUrl" :alt="alt" @error="onImageError(current.id)" />
      <span v-else class="home-banner-fallback" role="img" :aria-label="alt">{{ alt }}</span>
    </a>
    <div v-else class="home-banner-frame">
      <img v-if="!broken[current.id]" :src="current.imageUrl" :alt="alt" @error="onImageError(current.id)" />
      <span v-else class="home-banner-fallback" role="img" :aria-label="alt">{{ alt }}</span>
    </div>
    <template v-if="multiple">
      <button class="home-banner-nav prev" type="button" aria-label="上一张" @click="go(-1)">‹</button>
      <button class="home-banner-nav next" type="button" aria-label="下一张" @click="go(1)">›</button>
      <div class="home-banner-dots">
        <button
          v-for="(item, dot) in banners"
          :key="item.id"
          type="button"
          :aria-label="`第 ${dot + 1} 张`"
          :aria-current="dot === index ? 'true' : undefined"
          @click="go(dot - index)"
        ></button>
      </div>
    </template>
  </section>
</template>

<style scoped>
.home-banner {
  position: relative;
  margin-bottom: var(--space-5);
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--color-surface-muted);
  outline: none;
}

.home-banner:focus-visible {
  box-shadow: 0 0 0 2px var(--color-brand);
}

.home-banner-frame {
  display: block;
  aspect-ratio: 2.5 / 1;
  background: var(--color-surface-muted);
  color: inherit;
  text-decoration: none;
}

.home-banner-frame img,
.home-banner-fallback {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.home-banner-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
}

.home-banner-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 2rem;
  height: 2rem;
  border: 0;
  border-radius: var(--radius-full);
  background: var(--color-surface);
  color: var(--color-text);
  box-shadow: var(--shadow-sm);
}

.home-banner-nav.prev {
  left: var(--space-3);
}

.home-banner-nav.next {
  right: var(--space-3);
}

.home-banner-dots {
  position: absolute;
  left: 0;
  right: 0;
  bottom: var(--space-3);
  display: flex;
  justify-content: center;
  gap: var(--space-2);
}

.home-banner-dots button {
  width: 0.5rem;
  height: 0.5rem;
  padding: 0;
  border: 0;
  border-radius: var(--radius-full);
  background: var(--color-surface);
}

.home-banner-dots button[aria-current='true'] {
  background: var(--color-brand);
}
</style>
