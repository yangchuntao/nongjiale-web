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

/* 无图时的底色：按序号轮换三种水乡色，避免同屏撞色 */
const TONES = ['field', 'dusk', 'water'] as const
function tone(dot: number): string {
  return `slide--${TONES[dot % TONES.length]}`
}

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
    class="hero"
    :tabindex="multiple ? 0 : undefined"
    :aria-roledescription="multiple ? '轮播' : undefined"
    :aria-label="multiple ? '首页推荐轮播，可用左右方向键切换' : undefined"
    @mouseenter="pause"
    @mouseleave="resume"
    @focusin="pause"
    @focusout="onFocusOut"
    @keydown="onKey"
    @pointerdown="onPointerDown"
    @pointerup="onPointerUp"
  >
    <div class="hero__frame">
      <div
        v-for="(item, dot) in banners"
        :key="item.id"
        class="slide"
        :class="[tone(dot), { 'is-on': dot === index }]"
        :aria-hidden="dot !== index"
      >
        <div class="slide__art">
          <img v-if="!broken[item.id]" :src="item.imageUrl" :alt="bannerAlt(item.title)" @error="onImageError(item.id)" />
        </div>
        <div class="hero__field-art" aria-hidden="true"></div>
        <div class="hero__scrim" aria-hidden="true"></div>
      </div>

      <div class="slide__cap">
        <p class="eyebrow">水乡农家 · 到村头去</p>
        <h1>{{ current.title || '住进垛田边的院子' }}</h1>
        <p>不预售、不担保，先看院子，再和店主说说话。</p>
        <RouterLink v-if="link.kind === 'internal'" class="btn" :to="link.href">看看这间 →</RouterLink>
        <a
          v-else-if="link.kind === 'external'"
          class="btn"
          :href="link.href"
          target="_blank"
          rel="noopener noreferrer"
        >
          了解更多 →
        </a>
        <RouterLink v-else class="btn" to="/listings">浏览农家乐 →</RouterLink>
      </div>

      <template v-if="multiple">
        <button class="hero__arrow hero__arrow--prev" type="button" aria-label="上一张" @click="go(-1)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
            <path d="M15 5 8 12l7 7" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
        <button class="hero__arrow hero__arrow--next" type="button" aria-label="下一张" @click="go(1)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
            <path d="m9 5 7 7-7 7" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
        <div class="hero__dots">
          <button
            v-for="(item, dot) in banners"
            :key="item.id"
            type="button"
            class="hero__dot"
            :class="{ 'is-on': dot === index }"
            :aria-label="`第 ${dot + 1} 张`"
            :aria-current="dot === index ? 'true' : undefined"
            @click="go(dot - index)"
          ></button>
        </div>
      </template>
    </div>
  </section>
</template>
