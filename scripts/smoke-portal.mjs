import puppeteer from 'puppeteer-core'

const BASE = process.env.PORTAL_URL || 'http://localhost:43123'
const CHROME = process.env.CHROME_PATH || '/usr/bin/google-chrome'

function setNativeValue(el, value) {
  const proto = Object.getPrototypeOf(el)
  const desc = Object.getOwnPropertyDescriptor(proto, 'value')
  desc.set.call(el, value)
  el.dispatchEvent(new Event('input', { bubbles: true }))
  el.dispatchEvent(new Event('change', { bubbles: true }))
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
})

const page = await browser.newPage()
page.setDefaultTimeout(25000)
const logs = []
page.on('console', (msg) => logs.push(`[console.${msg.type()}] ${msg.text()}`))
page.on('pageerror', (err) => logs.push(`[pageerror] ${err.message}`))
page.on('response', async (res) => {
  if (res.url().includes('/api/')) {
    logs.push(`[http] ${res.status()} ${res.request().method()} ${res.url()}`)
  }
})

const steps = []
function step(name, ok, detail = '') {
  steps.push({ name, ok, detail })
  console.log(`${ok ? 'PASS' : 'FAIL'}: ${name}${detail ? ' — ' + detail : ''}`)
}

try {
  await page.goto(BASE + '/', { waitUntil: 'networkidle0' })
  const homeText = await page.evaluate(() => document.body.innerText)
  step('home loads', /农家乐|长三角/.test(homeText), homeText.slice(0, 60).replace(/\n/g, ' '))

  await page.goto(BASE + '/login', { waitUntil: 'networkidle0' })
  await page.waitForSelector('form input')
  await page.evaluate(() => {
    const inputs = [...document.querySelectorAll('form input')]
    const set = (el, value) => {
      const proto = Object.getPrototypeOf(el)
      const desc = Object.getOwnPropertyDescriptor(proto, 'value')
      desc.set.call(el, value)
      el.dispatchEvent(new Event('input', { bubbles: true }))
      el.dispatchEvent(new Event('change', { bubbles: true }))
    }
    set(inputs[0], '13800000001')
    set(inputs[1], 'password')
  })
  await page.click('button[type="submit"]')
  await page.waitForFunction(() => localStorage.getItem('nj_portal_token'), { timeout: 15000 })
  const token = await page.evaluate(() => localStorage.getItem('nj_portal_token'))
  step('login stores token', !!token, token ? token.slice(0, 8) + '…' : 'none')

  await page.goto(BASE + '/homestays/1', { waitUntil: 'networkidle0' })
  await page.waitForFunction(() => document.body.innerText.includes('提交预订意向') || document.body.innerText.includes('已下架'))
  const detailText = await page.evaluate(() => document.body.innerText)
  step('homestay/1 on-shelf detail', detailText.includes('提交预订意向'), detailText.slice(0, 80).replace(/\n/g, ' '))

  await page.goto(BASE + '/homestays/1/book', { waitUntil: 'networkidle0' })
  await page.waitForSelector('form')
  await page.evaluate(() => {
    const set = (el, value) => {
      const proto = Object.getPrototypeOf(el)
      const desc = Object.getOwnPropertyDescriptor(proto, 'value')
      desc.set.call(el, value)
      el.dispatchEvent(new Event('input', { bubbles: true }))
      el.dispatchEvent(new Event('change', { bubbles: true }))
    }
    const dates = document.querySelectorAll('input[type="date"]')
    const d = new Date(); d.setDate(d.getDate() + 21)
    const d2 = new Date(); d2.setDate(d2.getDate() + 23)
    const fmt = (x) => x.toISOString().slice(0, 10)
    if (dates[0]) set(dates[0], fmt(d))
    if (dates[1]) set(dates[1], fmt(d2))
    const texts = [...document.querySelectorAll('input:not([type="date"]):not([type="number"])')]
    // contact name / phone — keep filled values if present
    const number = document.querySelector('input[type="number"]')
    if (number) set(number, '2')
  })
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 20000 }),
    page.click('button[type="submit"]'),
  ])

  const url = page.url()
  const successText = await page.evaluate(() => document.body.innerText)
  const hasIntent = /意向\s*ID[：:]\s*\d+/i.test(successText)
  const hasTel = successText.includes('13651814168')
  step('navigated to success', url.includes('/booking/success'), url)
  step('success shows intent id', hasIntent, (successText.match(/意向\s*ID[：:]\s*\d+/) || [successText.slice(0, 160)])[0])
  step('success shows tel 13651814168', hasTel)

  const allOk = steps.every((s) => s.ok)
  console.log('\nSMOKE_RESULT=' + (allOk ? 'PASS' : 'FAIL'))
  if (!allOk) {
    console.log('--- page text ---\n' + successText)
    console.log('--- logs ---\n' + logs.join('\n'))
  }
  await browser.close()
  process.exit(allOk ? 0 : 1)
} catch (e) {
  console.error('SMOKE_RESULT=FAIL')
  console.error(e)
  console.log(logs.join('\n'))
  try { await page.screenshot({ path: '/workspace/nongjiale-web/smoke-fail.png', fullPage: true }) } catch {}
  const body = await page.evaluate(() => document.body?.innerText || '').catch(() => '')
  console.log('--- body ---\n' + body)
  await browser.close().catch(() => {})
  process.exit(1)
}
