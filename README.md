# MC最优附魔顺序计算器

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![English README](https://img.shields.io/badge/README-English-blue)](README.en.md)

[**在线使用**](https://xjzsq.github.io/mc-optimal-enchantment-order-calculator/)

## 简介

本项目是一个 Minecraft 最优附魔顺序计算器，帮助玩家以最低的经验值代价，找到将多个附魔书合并到武器/工具上的最优操作顺序，支持 Java 版与基岩版。

## 功能

- **支持 Java 版 / 基岩版**：可选择游戏版本，计算结果将基于对应版本的附魔权重和冲突规则。
- **武器 / 工具选择**：涵盖剑、弓、弩、三叉戟、镐、斧、锹、锄、头盔、胸甲、护腿、靴子、盾牌等。
- **初始附魔配置**：支持设置武器/防具/工具上已有的附魔及其等级，以及当前的惩罚值（附魔惩罚次数）。
- **目标附魔选择**：自由选择需要附魔的附魔种类和等级，自动过滤冲突附魔。
- **两种计算算法**：
  - **DifficultyFirst（难度优先）**：每次优先合并代价最高的附魔，降低整体经验消耗。
  - **Hamming（海明距离法）**：基于惩罚等级分组与二进制海明权重排列，进一步优化合并顺序。
- **忽略惩罚模式**：可选择忽略"Too Expensive"（过于昂贵）限制，纯粹计算理论最优顺序。
- **分步展示结果**：以步骤卡片形式清晰展示每一步的合并操作、消耗经验值及最终总经验值。
- **自动检测过于昂贵**：当合并代价超过 39 级时，自动提示该步骤代价过高。

## 如何启动

### 在线使用

直接访问：[https://xjzsq.github.io/mc-optimal-enchantment-order-calculator/](https://xjzsq.github.io/mc-optimal-enchantment-order-calculator/)

### 本地开发

**环境要求**：Node.js 18+，npm

```bash
# 克隆仓库
git clone https://github.com/xjzsq/mc-optimal-enchantment-order-calculator.git
cd mc-optimal-enchantment-order-calculator

# 安装依赖
npm install

# 启动开发服务器（默认访问 http://localhost:5173）
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 致谢

本项目的设计与算法参考和借鉴自 [Dinosaur-MC/BestEnchSeq](https://github.com/Dinosaur-MC/BestEnchSeq)，对有问题的算法进行了部分修改，在此表示感谢。  
本项目由 Github Copilot Vibe Coding 而成，感谢 Github Student Pack 的支持。

## 许可证

本项目基于 [GNU General Public License v3.0](LICENSE) 发布。
