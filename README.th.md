# GitHub Green Lantern

[English](README.md) | **ภาษาไทย**

เปลี่ยนปฏิทิน contribution ของ GitHub ให้เป็นแอนิเมชัน Green Lantern สำหรับ README บนโปรไฟล์ ไฟจะค่อย ๆ ดับจากขอบเข้ากลาง สว่างเป็นสัญลักษณ์ แล้วกลับเป็นปฏิทินเดิม วนรอบทุก 16 วินาที

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/guatom999/github-greenlantern/output/greenlantern-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/guatom999/github-greenlantern/output/greenlantern.svg">
  <img alt="แอนิเมชัน contribution ของ GitHub ที่ค่อย ๆ เปลี่ยนเป็นสัญลักษณ์ Green Lantern" src="https://raw.githubusercontent.com/guatom999/github-greenlantern/output/greenlantern-dark.svg">
</picture>

## ใช้บนโปรไฟล์ GitHub

### 1. เพิ่ม workflow ใน profile repo

ใช้ repo ที่เป็น **Public** และมีชื่อเดียวกับ username เช่น `guatom999/guatom999` ดูเพิ่มเติมใน [คู่มือ Profile README ของ GitHub](https://docs.github.com/en/account-and-profile/how-tos/profile-customization/managing-your-profile-readme)

สร้างไฟล์ `.github/workflows/greenlantern.yml` ใน repo นั้น แล้ววางโค้ดต่อไปนี้ เรียกใช้ Action นี้ได้โดยตรงโดยไม่ต้อง Fork โปรเจกต์:

```yaml
name: Green Lantern

on:
  schedule:
    - cron: '17 0 * * *'
  workflow_dispatch:

permissions:
  contents: write

concurrency:
  group: greenlantern-output

jobs:
  generate:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - name: Generate animations
        uses: guatom999/github-greenlantern@v1
        with:
          github_user_name: ${{ github.repository_owner }}
          output_directory: dist

      - name: Publish animations
        uses: crazy-max/ghaction-github-pages@v4
        with:
          target_branch: output
          build_dir: dist
          keep_history: true
          allow_empty_commit: false
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

ขั้นตอนแรกสร้างภาพ ส่วนขั้นตอนที่สองนำไฟล์ไป commit ใน branch `output` ของ **profile repo ของคุณ** โดย `keep_history: true` จะเก็บประวัติ commit เดิมไว้ ตัวอย่างนี้ใช้ token ที่ GitHub สร้างให้อัตโนมัติ ไม่ต้องสร้าง personal token เพิ่ม

**หมายเหตุเรื่องเวอร์ชัน:** ตอนนี้ `@v1` ยังชี้ไปยังรุ่นก่อน ซึ่งสร้าง `greenlantern-logo.svg`, `preview.html` และ `calendar.json` เพิ่มด้วย ถ้าต้องการรุ่นใหม่ที่สร้างเฉพาะ SVG สองธีม ให้เปลี่ยน `@v1` ในตัวอย่างเป็น `@ad0005c06f35a421edb40355edb42aa9fd73c2fa` การอัปเดต `main` ไม่ได้ย้าย tag `v1` อัตโนมัติ

### 2. กดรันครั้งแรก

Commit ไฟล์ workflow แล้วไปที่ **Actions → Green Lantern → Run workflow** ใน profile repo รอให้สำเร็จ แล้วตรวจว่า branch `output` มีไฟล์ SVG

หลังจากนั้นจะอัปเดตทุกวันเวลา **07:17 น. ประเทศไทย / 00:17 UTC** โดย GitHub อาจเริ่มงานช้ากว่าเวลาที่ตั้งไว้ได้

### 3. ใส่ภาพใน README ของโปรไฟล์

วาง HTML นี้ใน `README.md` ที่โฟลเดอร์หลักของ profile repo แล้วเปลี่ยน `YOUR_USERNAME` **ทั้งสองตำแหน่งในแต่ละ URL** ให้เป็นชื่อบัญชีของคุณ:

```html
<picture>
  <source media="(prefers-color-scheme: dark)"
    srcset="https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_USERNAME/output/greenlantern-dark.svg">
  <source media="(prefers-color-scheme: light)"
    srcset="https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_USERNAME/output/greenlantern.svg">
  <img alt="My GitHub contributions — Green Lantern animation"
    src="https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_USERNAME/output/greenlantern-dark.svg">
</picture>
```

Commit README แล้วเปิดหน้าโปรไฟล์ GitHub เพื่อดูภาพได้เลย ถ้าสร้างภาพจาก repo อื่น ให้เปลี่ยน owner และชื่อ repo ใน URL ให้ตรงกับ repo ที่เก็บภาพ

## รันในเครื่อง

ต้องมี **Node.js 22 ขึ้นไป**

```sh
git clone https://github.com/guatom999/github-greenlantern.git
cd github-greenlantern
npm ci
npm run build
node build/src/cli.js --user YOUR_USERNAME --output dist
```

เปลี่ยน `YOUR_USERNAME` เป็นชื่อบัญชีของคุณ แล้วเปิด SVG ที่สร้างใน browser:

| ไฟล์ | ธีม |
| --- | --- |
| `dist/greenlantern.svg` | สว่าง |
| `dist/greenlantern-dark.svg` | มืด |

SVG แต่ละไฟล์มีแอนิเมชันและโลโก้อยู่ในตัว CLI รุ่นปัจจุบันสร้างเฉพาะสองไฟล์นี้ เมื่อรันซ้ำสำเร็จจะลบไฟล์ผลลัพธ์เก่าสามไฟล์ออกจากโฟลเดอร์ปลายทาง โดยเก็บไฟล์ชื่ออื่นไว้

ถ้าต้องการ build และสร้างภาพด้วยคำสั่งเดียว:

```sh
npm run generate -- --user YOUR_USERNAME --output dist
```

สำหรับ PowerShell บน Windows ใช้ `npm.cmd run generate -- --user YOUR_USERNAME --output dist` เพื่อส่ง options ผ่าน npm ให้ครบ หรือใช้คำสั่ง `node build/src/cli.js` ด้านบนโดยตรง

## ตัวเลือกของ Action

| Input | ค่าเริ่มต้น | หน้าที่ |
| --- | --- | --- |
| `github_user_name` | เจ้าของ repo | บัญชี GitHub ที่ต้องการอ่าน contribution |
| `github_token` | `${{ github.token }}` | อ่านข้อมูลผ่าน GitHub GraphQL; ใส่ `''` เพื่ออ่าน HTML ของปฏิทินสาธารณะ |
| `output_directory` | `dist` | โฟลเดอร์สำหรับไฟล์ที่สร้าง |

Action คืน path ของไฟล์ผ่าน outputs ชื่อ `svg` และ `svg_dark` โดย Action ทำหน้าที่สร้างไฟล์ ส่วน workflow ของคุณจัดการเผยแพร่

เมื่อรัน CLI ในเครื่อง จะตั้ง `GITHUB_TOKEN` หรือไม่ก็ได้ ถ้าไม่มีจะอ่านระดับสี contribution จากหน้าสาธารณะ ถ้ามีจะใช้ GraphQL โดยอ่านเฉพาะข้อมูลที่ token เข้าถึงได้ และไม่เขียน token ลงภาพ แอนิเมชันนี้ไม่เปลี่ยนสถิติ contribution บน GitHub

ถ้าต้องการสร้างภาพของบัญชีอื่น ให้ระบุ `github_user_name` ใน workflow สำหรับผู้ที่ Fork repo นี้ [workflow ที่มีให้](.github/workflows/generate.yml) ยังรับ username ตอนกดรันด้วยมือได้ ส่วนรอบตามเวลาจะใช้ชื่อเจ้าของ repo

## สำหรับพัฒนาโปรเจกต์

หลังรัน `npm ci`:

```sh
npm run demo
npm run typecheck
npm test
```

`npm run demo` ใช้ข้อมูลจำลองจาก `test/fixtures/demo.json` รันแบบออฟไลน์ได้ และสร้าง SVG ใน `dist/demo/` ข้อมูลนี้ไม่ใช่สถิติของบัญชีจริง

| ตำแหน่ง | หน้าที่ |
| --- | --- |
| `src/cli.ts` | รับคำสั่ง โหลดข้อมูล และเขียน SVG |
| `src/github.ts` | อ่าน contribution จาก GitHub |
| `src/calendar.ts` | จัดวันที่เป็นกริด 7 แถว |
| `src/animation.ts` | กำหนดแอนิเมชัน 16 วินาทีและสัญลักษณ์ 5 × 7 |
| `src/svg.ts` | สร้าง SVG ที่เล่นแอนิเมชันได้ในตัว |
| `src/index.ts` | ฟังก์ชันและ TypeScript types ที่เปิดให้ import |
| `test/` | ชุดทดสอบและข้อมูล demo |
| `.github/workflows/generate.yml` | สร้างและเผยแพร่ภาพของ repo นี้ |

`build/` เก็บ JavaScript และ type declarations หลังคอมไพล์ ส่วน `dist/` เก็บ SVG ที่สร้าง ทั้งสองโฟลเดอร์และ `node_modules/` ถูก ignore ใน Git สามารถ import `normalizeDays`, `fetchContributions`, `sampleFrame`, `renderSvg` และฟังก์ชันอื่นของ library ผ่าน `build/src/index.js`

ตัวสร้าง SVG ไม่ต้องใช้ browser หรือ runtime dependencies โดยคงจำนวนคอลัมน์สัปดาห์ตามข้อมูลจริง ใช้กริด 7 แถว และแสดงปฏิทินแบบภาพนิ่งเมื่อเปิด reduced motion รุ่นนี้ยังไม่มีการส่งออก GIF หรือ MP4

## เครดิตและสัญญาอนุญาต

ได้แรงบันดาลใจจาก [Platane/snk](https://github.com/Platane/snk) โดยโปรเจกต์นี้เขียนตัวอ่านข้อมูล ลำดับแอนิเมชัน และ renderer ของตัวเอง

โค้ดใช้สัญญาอนุญาต [MIT](LICENSE) เป็นโปรเจกต์แฟนเมด ไม่เกี่ยวข้องอย่างเป็นทางการกับเจ้าของชื่อหรือสัญลักษณ์ Green Lantern
