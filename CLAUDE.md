# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

DocTranslate — AI 驱动的中文→英文文档翻译工具。支持多种文档类型（医疗报告、法律文件、教育证件、政府文件等），通过 OCR 识别图片/PDF 内容，生成结构化翻译并输出专业 PDF。

## 常用命令

- `pnpm dev` — 启动开发服务器 (localhost:3000)
- `pnpm build` — 生产构建
- `pnpm lint` — ESLint 检查
- `pnpm start` — 启动生产服务器

包管理器：pnpm

## 技术栈

- Next.js 16 (App Router) + React 19 + TypeScript 5 + Tailwind CSS 4
- @react-pdf/renderer — PDF 生成
- @myriaddreamin/typst.ts — Typst PDF 编译引擎（客户端 WASM）
- heic2any — HEIC 图片转换
- OpenRouter API — 多模型聚合（Kimi、Seed、Gemini、Claude）

## 架构

### 翻译流程

1. 用户上传文件 → `UploadZone` 组件处理
2. 选择 AI 模型 → 点击翻译
3. `page.tsx` 调用 `translateWithBatching()`（`src/lib/batch.ts`）
   - < 5 个文件：单次请求
   - ≥ 5 个文件：分批（PDF 独立一批，图片每 4 张一批）
4. 每批调用 `POST /api/translate` → OpenRouter API
5. 返回结构化 JSON（TranslationResult）→ 文本预览 + PDF 预览

### 关键模块

- `src/app/page.tsx` — 主页面，管理全局状态和翻译流程
- `src/app/api/translate/route.ts` — 翻译 API 端点
- `src/lib/claude.ts` — OpenRouter API 调用封装
- `src/lib/batch.ts` — 批处理逻辑（分批、重试、合并）
- `src/lib/prompts.ts` — AI 提示词和 JSON Schema 定义
- `src/lib/types.ts` — TypeScript 类型定义（DocumentType、TranslationResult 等）
- `src/lib/constants.ts` — 配置常量（BATCH_SIZE=4, MAX_FILE_COUNT=20 等）
- `src/pdf/` — PDF 生成：模板（templates/）、组件（components/）、字体注册（fonts/）

### API 设计

`POST /api/translate` 接收 `{ files: [{base64, mediaType, fileName}], model }` 返回 `TranslationResult`（含 documentType、sections、layout 等）。

### 环境变量

- `OPENROUTER_API_KEY` — 在 `.env.local` 中配置

## 约定

- 代码注释用英文
- 路径别名：`@/*` → `./src/*`
- 部署平台：Vercel（API 超时限制 60 秒，代码中设 55 秒）
