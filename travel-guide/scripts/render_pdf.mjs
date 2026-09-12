#!/usr/bin/env node
// 用本机 Chromium 内核浏览器（Edge / Chrome）无头模式，把本地 HTML 渲染成打印级 PDF。
//
// 用法：node render_pdf.mjs <input.html> [output.pdf]
//   不传 output 时，输出与输入同名的 .pdf。
//   可用环境变量 BROWSER_BIN 指定浏览器可执行文件路径。
//
// 校验：文件存在 + 体积非零 + 尾部 %%EOF + /Count 页数，并打印出来。

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const [inputArg, outputArg] = process.argv.slice(2);
if (!inputArg) {
  console.error('用法: node render_pdf.mjs <input.html> [output.pdf]');
  process.exit(2);
}

const input = path.resolve(inputArg);
if (!fs.existsSync(input)) {
  console.error('找不到输入文件: ' + input);
  process.exit(2);
}
const output = path.resolve(
  outputArg || (input.replace(/\.html?$/i, '') + '.pdf')
);

const env = process.env;
const candidates = [
  env.BROWSER_BIN,
  env['PROGRAMFILES(X86)'] && path.join(env['PROGRAMFILES(X86)'], 'Microsoft/Edge/Application/msedge.exe'),
  env.PROGRAMFILES && path.join(env.PROGRAMFILES, 'Microsoft/Edge/Application/msedge.exe'),
  env.LOCALAPPDATA && path.join(env.LOCALAPPDATA, 'Microsoft/Edge/Application/msedge.exe'),
  env.PROGRAMFILES && path.join(env.PROGRAMFILES, 'Google/Chrome/Application/chrome.exe'),
  env['PROGRAMFILES(X86)'] && path.join(env['PROGRAMFILES(X86)'], 'Google/Chrome/Application/chrome.exe'),
  env.LOCALAPPDATA && path.join(env.LOCALAPPDATA, 'Google/Chrome/Application/chrome.exe'),
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/microsoft-edge',
  '/usr/bin/google-chrome',
].filter(Boolean);

const browser = candidates.find((p) => fs.existsSync(p));
if (!browser) {
  console.error('没找到 Edge / Chrome。可设 BROWSER_BIN 指向浏览器可执行文件。');
  process.exit(2);
}

// 每次用独立 user-data-dir：避免和正在运行的浏览器抢配置目录。
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'html2pdf-'));
const fileUrl = pathToFileURL(input).href;

// 逐个降级重试：老内核不认 --headless=new；受限 / 沙箱环境里 GPU 进程常被拦，
// 需要 --no-sandbox。渲染的是本地可信 HTML，关掉浏览器沙箱在这里风险很低。
const attempts = [
  ['--headless=new', '--disable-gpu', '--no-sandbox'],
  ['--headless', '--disable-gpu', '--no-sandbox'],
  ['--headless=new', '--disable-gpu'],
];

const common = [
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-extensions',
  '--no-pdf-header-footer',
  '--print-to-pdf-no-header',
  '--run-all-compositor-stages-before-draw',
  '--virtual-time-budget=15000',
  '--user-data-dir=' + profile,
  '--print-to-pdf=' + output,
  fileUrl,
];

let ok = false;
for (const mode of attempts) {
  fs.rmSync(output, { force: true });
  const res = spawnSync(browser, [...mode, ...common], {
    timeout: 180000,
    windowsHide: true,
    encoding: 'utf8',
  });
  if (fs.existsSync(output) && fs.statSync(output).size > 0) {
    ok = true;
    break;
  }
  const err = (res.stderr || '').trim().split('\n').slice(-3).join(' | ');
  console.error('尝试 ' + mode.join(' ') + ' 失败' + (err ? ': ' + err : ''));
}

fs.rmSync(profile, { recursive: true, force: true });

if (!ok) {
  console.error('渲染失败：没有生成 PDF。');
  console.error('若在沙箱 / 受管环境里运行，请用提权方式重跑同一条命令。');
  process.exit(1);
}

const buf = fs.readFileSync(output);
const latin = buf.toString('latin1');
const goodTail = latin.trimEnd().endsWith('%%EOF');
const counts = [...latin.matchAll(/\/Count\s+(\d+)/g)].map((m) => m[1]);
const pageObjs = (latin.match(/\/Type\s*\/Page[^s]/g) || []).length;

console.log('浏览器   : ' + browser);
console.log('输入     : ' + input);
console.log('输出     : ' + output);
console.log('体积     : ' + buf.length + ' bytes');
console.log('尾巴EOF  : ' + (goodTail ? 'OK' : '缺失（可能是截断）'));
console.log('页面对象 : ' + pageObjs + ' | /Count: ' + counts.join(','));

if (!goodTail) process.exit(1);
