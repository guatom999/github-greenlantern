import { readFileSync } from 'node:fs';
import { escapeXml } from './svg.js';

// Assets are kept readable in source, then embedded for a portable HTML file.
const styles = readFileSync(new URL('./preview/styles.css', import.meta.url), 'utf8');
const playerScript = readFileSync(new URL('./preview/player.js', import.meta.url), 'utf8');

/** User data appears only as escaped text, never inside the player script. */
export function renderPreview({ light, dark, closeup, metadata }) {
  const username = escapeXml(metadata.username);
  const isFixture = metadata.source === 'fixture';
  const sourceTitle = isFixture
    ? 'SYNTHETIC DEMO / ข้อมูลตัวอย่าง'
    : 'LIVE SNAPSHOT / ข้อมูลจาก GitHub';
  const sourceDescription = isFixture
    ? 'ไฟในตัวอย่างนี้เป็นข้อมูลจำลองสำหรับดูเอฟเฟกต์ ไม่ใช่สถิติของบัญชีจริง'
    : `อ่าน ${metadata.dayCount} วันจาก GitHub แล้วสร้างภาพใหม่จากข้อมูลจริง ภาพนี้ไม่เปลี่ยน contribution ของบัญชี`;

  return `<!doctype html>
<html lang="th">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Green Lantern · ${username}</title>
    <style>
${styles}
    </style>
  </head>
  <body>
    <main>
      <header>
        <div class="brand"><span class="mark"></span>GITHUB / GREENLANTERN</div>
        <span class="pill">7 ROWS · 16 SECONDS</span>
      </header>

      <h1>A year of light.<br><span>One symbol.</span></h1>
      <p class="intro">แสงจาก contribution ตลอดปี ค่อย ๆ รวมเป็น Green Lantern ตรงกลางกริดเดิมทั้ง 7 แถว</p>

      <section class="stage" aria-label="Contribution animation player">
        <div class="bar">
          <div>
            <div class="user">@${username}</div>
            <div class="meta">${escapeXml(metadata.from)} → ${escapeXml(metadata.to)} · ${metadata.weeks} weeks</div>
          </div>
          <label class="meta">
            Theme
            <select id="theme" aria-label="Theme">
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </label>
        </div>

        <div id="viewer" class="viewer">
          <div class="variant" data-theme="dark">${dark}</div>
          <div class="variant" data-theme="light" hidden>${light}</div>
        </div>

        <div class="controls">
          <button id="play" type="button">Pause</button>
          <input id="time" aria-label="Animation time in seconds"
            type="range" min="0" max="16" step="0.01" value="0">
          <output id="clock" for="time">0.00 s</output>
        </div>

        <div class="phases">
          <span data-start="0">CALENDAR</span>
          <span data-start="2">GATHER</span>
          <span data-start="8">IGNITE</span>
          <span data-start="10">LANTERN</span>
          <span data-start="13">RETURN</span>
        </div>
      </section>

      <div class="details">
        <section class="note">
          ${closeup}
          <div>
            <h2>Five columns. Seven days.</h2>
            <p>สัญลักษณ์ 5 × 7 ช่องตามภาพอ้างอิง ใช้ไฟ 22 ช่อง อยู่กึ่งกลางปฏิทินตลอดปี</p>
          </div>
        </section>

        <section class="note">
          <div>
            <h2>${sourceTitle}</h2>
            <p>${sourceDescription}</p>
            <p>ลากแถบเวลาเพื่อตรวจแต่ละเฟรม หรือกด Play เพื่อดูวนซ้ำ</p>
            <p id="motion" hidden>Reduced motion เปิดอยู่: แสดงปฏิทินแบบภาพนิ่ง</p>
          </div>
        </section>
      </div>

      <footer>
        <span>
          ORIGINAL IMPLEMENTATION · Inspired by
          <a href="https://github.com/Platane/snk">Platane/snk</a>
        </span>
        <span>Self-contained SVG · No external assets</span>
      </footer>
    </main>
    <script>
${playerScript}
    </script>
  </body>
</html>`;
}
