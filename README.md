# GitHub Green Lantern

เปลี่ยนแสง contribution ตลอดปีให้ค่อย ๆ ดับจากด้านนอก แล้วสว่างเป็น **Green Lantern ตรงกลางกริด 7 แถว** ก่อนวนกลับเป็นปฏิทินเดิม

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/guatom999/github-greenlantern/output/greenlantern-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/guatom999/github-greenlantern/output/greenlantern.svg">
  <img alt="Contributions fade inward and form a Green Lantern symbol across seven rows" src="https://raw.githubusercontent.com/guatom999/github-greenlantern/output/greenlantern-dark.svg">
</picture>

อ่านข้อมูลจริงของ username แล้ววาดกราฟใหม่ จึงได้ไฟล์ **animated SVG** คมชัดสำหรับ README โค้ดเขียนด้วย TypeScript และไม่มี runtime dependency ไม่ต้องติดตั้ง browser เพื่อสร้าง SVG ภาพนี้ไม่เปลี่ยนสถิติ contribution บน GitHub

## เริ่มใช้ในเครื่อง

ต้องมี **Node.js 22 ขึ้นไป**

```sh
git clone https://github.com/guatom999/github-greenlantern.git
cd github-greenlantern
npm ci
npm run build
node build/src/cli.js --user guatom999 --output dist
```

เปิด `dist/preview.html` เพื่อเล่น หยุด และลากดูแต่ละช่วงของแอนิเมชัน เปลี่ยน `--user` เป็น GitHub username ใดก็ได้

คำสั่ง `build` คอมไพล์ TypeScript ไปที่ `build/` ส่วน `dist/` เก็บไฟล์ภาพที่สร้างแล้ว หลัง build สามารถรัน CLI ซ้ำได้โดยไม่ต้องคอมไพล์ใหม่ หรือสั่ง build พร้อมสร้างภาพในขั้นเดียวได้ด้วย:

```sh
npm run generate -- --user guatom999 --output dist
```

ถ้าใช้ PowerShell บน Windows ให้ใช้ `npm.cmd run generate -- --user guatom999 --output dist` เพื่อส่ง options ผ่าน npm ได้ครบ หรือใช้คำสั่ง `node build/src/cli.js` ด้านบนโดยตรง

| ไฟล์ | ใช้ทำอะไร |
| --- | --- |
| `greenlantern.svg` | แอนิเมชันธีมสว่าง |
| `greenlantern-dark.svg` | แอนิเมชันธีมมืด |
| `greenlantern-logo.svg` | ภาพนิ่งช่วงที่สัญลักษณ์สว่างครบ |
| `preview.html` | ดูและลากเวลาใน browser ได้โดยตรง |
| `calendar.json` | ข้อมูลต้นทางและที่มา สำหรับตรวจสอบหรือสร้างเฟรมต่อ |

ถ้าไม่มี token จะอ่านระดับสี 0–4 จากหน้าปฏิทินสาธารณะ ถ้าตั้ง environment variable `GITHUB_TOKEN` จะใช้ GraphQL และอ่านจำนวน contribution ด้วย ใช้ข้อมูลที่ GitHub อนุญาตให้ token นั้นเห็น ไม่เขียน token ลงไฟล์ผลลัพธ์

## ใช้บนโปรไฟล์ GitHub

1. Fork repo นี้ หรือสร้าง repo จากโค้ดนี้ แล้วเปิด GitHub Actions
2. ที่ **Actions → Generate Green Lantern → Run workflow** ปล่อย username ว่างเพื่อใช้ชื่อเจ้าของ repo หรือระบุชื่ออื่น
3. Workflow จะสร้างไฟล์ใน branch `output` และอัปเดตทุกวันเวลา **07:17 น. ประเทศไทย** (GitHub อาจเริ่มงานล่าช้าได้)
4. วางโค้ดนี้ใน README ของโปรไฟล์ แล้วเปลี่ยน `OWNER` และ `REPO` ให้ตรงกับ repo ที่รัน workflow

```html
<picture>
  <source media="(prefers-color-scheme: dark)"
    srcset="https://raw.githubusercontent.com/OWNER/REPO/output/greenlantern-dark.svg">
  <source media="(prefers-color-scheme: light)"
    srcset="https://raw.githubusercontent.com/OWNER/REPO/output/greenlantern.svg">
  <img alt="GitHub Green Lantern contribution animation"
    src="https://raw.githubusercontent.com/OWNER/REPO/output/greenlantern-dark.svg">
</picture>
```

Repo ที่เก็บภาพควรเป็น public เพื่อให้โปรไฟล์โหลดภาพได้ ไฟล์อัปเดตแล้ว GitHub อาจยังแสดงภาพจาก cache อยู่ชั่วคราว

## ใช้เป็น GitHub Action ใน repo อื่น

```yaml
permissions:
  contents: read

steps:
  - uses: guatom999/github-greenlantern@main
    with:
      github_user_name: ${{ github.repository_owner }}
      github_token: ${{ secrets.GITHUB_TOKEN }}
      output_directory: dist
```

Action นี้สร้างไฟล์เท่านั้น ส่วนการเผยแพร่ใช้ workflow ของคุณเอง หรือดูตัวอย่าง [.github/workflows/generate.yml](.github/workflows/generate.yml) ที่แยก job สร้างไฟล์กับ job เผยแพร่ และให้ `contents: write` เฉพาะ job เผยแพร่ ควร pin Action เป็น commit SHA เมื่อใช้งานจริง

## ภาพเคลื่อนไหวทำงานอย่างไร

| เวลา | ภาพ |
| --- | --- |
| 0–2 วินาที | ปฏิทิน contribution จริง พร้อมความเข้มสีเดิม |
| 2–8 วินาที | ไฟค่อย ๆ ดับจากขอบซ้ายและขวาเข้ากลาง |
| 6–10 วินาที | ไฟ 22 ช่องค่อย ๆ สว่างเป็นสัญลักษณ์ |
| 10–13 วินาที | สัญลักษณ์สว่างครบและเต้นแสงเบา ๆ |
| 13–16 วินาที | กลับมาเป็นปฏิทินเดิมและวนซ้ำ |

ตัวสัญลักษณ์มีขนาด **5 คอลัมน์ × 7 แถว** ตามภาพอ้างอิง ความกว้างของปฏิทินตามจำนวนสัปดาห์ที่ GitHub ส่งกลับ ไม่บีบทั้งปีเหลือ 52 คอลัมน์ ถ้าเครื่องตั้ง reduced motion จะแสดงปฏิทินแบบภาพนิ่ง

## ตัวอย่างออฟไลน์และทดสอบ

```sh
npm run typecheck
npm run demo
npm test
```

หลังรัน `npm run demo` ให้เปิด `dist/demo/preview.html` ข้อมูลใน `test/fixtures/demo.json` เป็น **ข้อมูลจำลอง** สำหรับดูเอฟเฟกต์ ส่วนคำสั่ง `--user guatom999` ที่ไม่ระบุ `--fixture` จะอ่านข้อมูลจริงจาก GitHub ไฟล์ที่สร้างทั้งหมดอยู่ใน `dist/` ซึ่งไม่ถูก commit

ใช้ fixture ของคุณเองได้ โดยให้ JSON มี `days` เป็น array ของ `{ "date": "2026-10-24", "level": 4 }` และอาจมี `count` จำนวนเต็มที่ไม่ติดลบ ต้องครอบคลุมอย่างน้อย 5 สัปดาห์เพื่อวางสัญลักษณ์ได้

```sh
npm run generate -- --user demo --fixture test/fixtures/demo.json --output dist/demo
```

## โครงสร้างโค้ด

```text
.github/workflows/   ทดสอบ สร้างภาพ และเผยแพร่ไป branch output
src/                ซอร์ส TypeScript และไฟล์ของหน้า preview
test/               ชุดทดสอบและข้อมูล demo ใน fixtures/
action.yml          จุดเรียกใช้เป็น GitHub Action
```

Flow หลัก: `src/cli.ts` รับ options → `github.ts` อ่าน contribution (หรืออ่าน JSON เมื่อระบุ `--fixture`) → `calendar.ts` จัดเป็นกริด 7 แถว → `svg.ts` สร้างภาพด้วย keyframes จาก `animation.ts` → `preview.ts` สร้างหน้าเล่นและลากเวลา

SVG มี CSS animation อยู่ในไฟล์ ส่วนหน้า preview ฝัง CSS และ player ไว้ครบจึงเปิดออฟไลน์ได้ การสร้างภาพกับการเผยแพร่แยกกัน: `action.yml` สร้างไฟล์ แล้ว job `publish` ใน workflow นำไปอัปเดต branch `output`

ซอร์สของ library อยู่ที่ `src/index.ts` และคอมไพล์เป็น `build/src/index.js` พร้อม type declarations สามารถ import `normalizeDays`, `fetchContributions`, `sampleFrame`, `renderSvg` ไปใช้ต่อได้ รองรับ SVG ในรุ่นนี้ ส่วน GIF/MP4 ยังไม่รวมอยู่

`build/` เก็บ JavaScript ที่คอมไพล์แล้ว ส่วน `dist/` เก็บ SVG/HTML/JSON ที่สร้าง ทั้งสองโฟลเดอร์และ `node_modules/` ถูก ignore ใน Git ในไฟล์ `.ts` จะเห็น import ที่ลงท้าย `.js` ตามรูปแบบ `NodeNext` เพื่อให้ Node รันไฟล์หลังคอมไพล์ได้โดยตรง

## Credits

ได้แรงบันดาลใจจาก [Platane/snk](https://github.com/Platane/snk) ในการอ่านปฏิทิน contribution แล้วสร้างภาพเคลื่อนไหวสำหรับ README โปรเจกต์นี้เขียนตัวอ่านข้อมูล ลำดับเฟรม และ renderer ใหม่ โดยไม่ใช้ snake solver หรือคัดลอกโค้ดต้นฉบับ

MIT สำหรับโค้ด · โปรเจกต์แฟนเมด ไม่เกี่ยวข้องอย่างเป็นทางการกับเจ้าของชื่อหรือสัญลักษณ์ Green Lantern
