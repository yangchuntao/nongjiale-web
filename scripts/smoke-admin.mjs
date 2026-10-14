import puppeteer from 'puppeteer-core'
const BASE = 'http://localhost:43124'
const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
})
const page = await browser.newPage()
page.setDefaultTimeout(20000)
try {
  await page.goto(BASE + '/login', { waitUntil: 'networkidle0' })
  await page.evaluate(() => {
    const set = (el, value) => {
      const proto = Object.getPrototypeOf(el)
      const desc = Object.getOwnPropertyDescriptor(proto, 'value')
      desc.set.call(el, value)
      el.dispatchEvent(new Event('input', { bubbles: true }))
      el.dispatchEvent(new Event('change', { bubbles: true }))
    }
    const inputs = [...document.querySelectorAll('input')]
    // Element Plus may wrap inputs
    const text = inputs.find(i => i.type === 'text' || !i.type)
    const pass = inputs.find(i => i.type === 'password')
    if (text) set(text, 'operator')
    if (pass) set(pass, 'password')
  })
  // click login button
  const btn = await page.$('button')
  await Promise.all([
    page.waitForFunction(() => location.pathname === '/' || localStorage.getItem('nj_admin_token'), { timeout: 15000 }),
    btn.click(),
  ])
  const token = await page.evaluate(() => localStorage.getItem('nj_admin_token'))
  console.log('admin token', !!token)
  await page.goto(BASE + '/intents', { waitUntil: 'networkidle0' })
  await page.waitForTimeout?.(1500)
  await new Promise(r => setTimeout(r, 1500))
  const text = await page.evaluate(() => document.body.innerText)
  const ok = !!token && (text.includes('意向') || text.includes('PENDING') || text.includes('NI'))
  console.log(ok ? 'ADMIN_SMOKE=PASS' : 'ADMIN_SMOKE=FAIL')
  console.log(text.slice(0, 300).replace(/\n/g, ' | '))
  await browser.close()
  process.exit(ok ? 0 : 1)
} catch (e) {
  console.error('ADMIN_SMOKE=FAIL', e)
  await browser.close().catch(()=>{})
  process.exit(1)
}
