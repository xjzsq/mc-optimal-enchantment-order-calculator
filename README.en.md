# MC Optimal Enchantment Order Calculator

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![中文 README](https://img.shields.io/badge/README-中文-blue)](README.md)

[**Live Demo**](https://xjzsq.github.io/mc-optimal-enchantment-order-calculator/)

## Introduction

This project is a Minecraft optimal enchantment order calculator that helps players find the most cost-efficient order to combine enchantment books onto weapons/tools, minimizing the total XP cost. Both Java Edition and Bedrock Edition are supported.

## Features

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

## Getting Started

### Use Online

Visit directly: [https://xjzsq.github.io/mc-optimal-enchantment-order-calculator/](https://xjzsq.github.io/mc-optimal-enchantment-order-calculator/)

### Local Development

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

## Algorithm Reference

The Hamming algorithm is inspired by and references the implementation in [Dinosaur-MC/BestEnchSeq](https://github.com/Dinosaur-MC/BestEnchSeq). Many thanks to the original author.

## License

This project is licensed under the [GNU General Public License v3.0](LICENSE).
