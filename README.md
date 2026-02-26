# MC Optimal Enchantment Order Calculator / MC最优附魔顺序计算器

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

[**在线使用 / Live Demo**](https://xjzsq.github.io/mc-optimal-enchantment-order-calculator/)

---

## 中文

### 简介

本项目是一个 Minecraft 最优附魔顺序计算器，帮助玩家以最低的经验值代价，找到将多个附魔书合并到武器/工具上的最优操作顺序。支持 Java 版与 基岩版。

### 功能

- **支持 Java 版 / 基岩版**：可选择游戏版本，计算结果将基于对应版本的附魔权重和冲突规则。
- **武器 / 工具选择**：涵盖剑、弓、弩、三叉戟、镐、斧、锹、锄、头盔、胸甲、护腿、靴子、盾牌等。
- **初始附魔配置**：支持设置武器/工具上已有的附魔及其等级，以及当前的惩罚值（工作惩罚次数）。
- **目标附魔选择**：自由选择需要附魔的附魔种类和等级，自动过滤冲突附魔。
- **两种计算算法**：
  - **DifficultyFirst（难度优先）**：每次优先合并代价最高的附魔，降低整体经验消耗。
  - **Hamming（海明距离法）**：基于惩罚等级分组与二进制海明权重排列，进一步优化合并顺序，参考自 [Dinosaur-MC/BestEnchSeq](https://github.com/Dinosaur-MC/BestEnchSeq)。
- **忽略惩罚模式**：可选择忽略"Too Expensive"（代价过高）限制，纯粹计算理论最优顺序。
- **分步展示结果**：以步骤卡片形式清晰展示每一步的合并操作、消耗经验值及最终总经验值。
- **自动检测 Too Expensive**：当合并代价超过 39 级时，自动提示该步骤代价过高。

### 如何启动

#### 在线使用

直接访问：[https://xjzsq.github.io/mc-optimal-enchantment-order-calculator/](https://xjzsq.github.io/mc-optimal-enchantment-order-calculator/)

#### 本地开发

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

### 算法参考

Hamming 算法参考并借鉴了 [Dinosaur-MC/BestEnchSeq](https://github.com/Dinosaur-MC/BestEnchSeq) 的实现思路，在此表示感谢。

### 许可证

本项目基于 [GNU General Public License v3.0](LICENSE) 发布。

---

## English

### Introduction

This project is a Minecraft optimal enchantment order calculator that helps players find the most cost-efficient order to combine enchantment books onto weapons/tools, minimizing the total XP cost. Both Java Edition and Bedrock Edition are supported.

### Features

- **Java Edition / Bedrock Edition support**: Choose your game edition; enchantment weights and conflict rules are applied accordingly.
- **Weapon / tool selection**: Covers swords, bows, crossbows, tridents, pickaxes, axes, shovels, hoes, helmets, chestplates, leggings, boots, and shields.
- **Initial enchantment configuration**: Set existing enchantments and their levels on the item, as well as the current work penalty count.
- **Target enchantment selection**: Freely choose enchantments and levels to add; conflicting enchantments are automatically filtered out.
- **Two calculation algorithms**:
  - **DifficultyFirst**: Merges the most expensive enchantment first in each step to reduce overall XP cost.
  - **Hamming**: Groups items by penalty level and arranges merge order using binary Hamming weight, further optimizing the sequence. Algorithm inspired by [Dinosaur-MC/BestEnchSeq](https://github.com/Dinosaur-MC/BestEnchSeq).
- **Ignore penalty mode**: Optionally ignore the "Too Expensive" (39-level) limit to calculate the theoretical optimal order.
- **Step-by-step result display**: Each forging step is presented as a card showing items, enchantments, XP cost, and total cost.
- **Automatic Too Expensive detection**: Warns when a merge step exceeds 39 XP levels.

### Getting Started

#### Use Online

Visit directly: [https://xjzsq.github.io/mc-optimal-enchantment-order-calculator/](https://xjzsq.github.io/mc-optimal-enchantment-order-calculator/)

#### Local Development

**Requirements**: Node.js 18+, npm

```bash
# Clone the repository
git clone https://github.com/xjzsq/mc-optimal-enchantment-order-calculator.git
cd mc-optimal-enchantment-order-calculator

# Install dependencies
npm install

# Start the development server (default: http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview the production build
npm run preview
```

### Algorithm Reference

The Hamming algorithm is inspired by and references the implementation in [Dinosaur-MC/BestEnchSeq](https://github.com/Dinosaur-MC/BestEnchSeq). Many thanks to the original author.

### License

This project is licensed under the [GNU General Public License v3.0](LICENSE).
