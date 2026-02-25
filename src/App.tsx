import { useState } from 'react';
import { Steps, Card, Typography, Layout } from 'antd';
import Step1 from './components/Step1';
import Step2 from './components/Step2';
import Step3 from './components/Step3';
import type { EnchantLevel, Item, CalcResult } from './core/calculator';
import { calcDifficultyFirst, calcHamming } from './core/calculator';
import { getEnchantmentsForWeapon } from './data/enchantments';
import './App.css';

const { Title } = Typography;

export interface AppState {
  edition: 0 | 1; // 0=Java, 1=Bedrock
  weaponIndex: number;
  initialEnchantments: EnchantLevel[];
  initialPenalty: number;
  targetEnchantments: EnchantLevel[];
  algorithm: 'DifficultyFirst' | 'Hamming';
  ignorePenalty: boolean;
}

const defaultState: AppState = {
  edition: 0,
  weaponIndex: 0,
  initialEnchantments: [],
  initialPenalty: 0,
  targetEnchantments: [],
  algorithm: 'DifficultyFirst',
  ignorePenalty: false,
};

export default function App() {
  const [current, setCurrent] = useState(0);
  const [appState, setAppState] = useState<AppState>(defaultState);
  const [result, setResult] = useState<CalcResult | null>(null);

  function handleStep1Next(state: Partial<AppState>) {
    const newState = { ...appState, ...state };
    // Filter target enchantments: remove those now at max level on the weapon
    // and those no longer available for this weapon/edition
    const available = getEnchantmentsForWeapon(
      newState.weaponIndex,
      newState.edition === 0 ? 0 : 1
    );
    const filteredTargets = newState.targetEnchantments.filter(te => {
      const enchData = available.find(e => e.id === te.enchantmentId);
      if (!enchData) return false; // enchantment not available for this weapon
      const initial = newState.initialEnchantments.find(ie => ie.enchantmentId === te.enchantmentId);
      if (initial && initial.level >= enchData.maxLevel) return false; // already at max level
      return true;
    });
    setAppState({ ...newState, targetEnchantments: filteredTargets });
    setCurrent(1);
  }

  function handleStep2Calculate(state: Partial<AppState>) {
    const newState = { ...appState, ...state };
    setAppState(newState);

    const isJava = newState.edition === 0;
    const weapon: Item = {
      id: 'weapon',
      label: '武器',
      isBook: false,
      enchantments: newState.initialEnchantments,
      penalty: newState.initialPenalty,
    };

    let calcResult: CalcResult;
    const startTime = performance.now();
    if (newState.algorithm === 'DifficultyFirst') {
      calcResult = calcDifficultyFirst(weapon, newState.targetEnchantments, isJava, newState.ignorePenalty);
    } else {
      calcResult = calcHamming(weapon, newState.targetEnchantments, isJava, newState.ignorePenalty);
    }
    const calcTime = performance.now() - startTime;
    setResult({ ...calcResult, calcTimeMs: calcTime });
    setCurrent(2);
  }

  function handleReset() {
    setAppState(defaultState);
    setResult(null);
    setCurrent(0);
  }

  const steps = [
    { title: '选择装备', description: '选择版本、武器和初始附魔' },
    { title: '目标附魔', description: '选择算法和目标附魔' },
    { title: '计算结果', description: '查看最优附魔顺序' },
  ];

  return (
    <Layout className="app-container">
      <Layout.Content>
        <Title level={2} style={{ textAlign: 'center', margin: '24px 0' }}>
          最佳附魔顺序计算器
        </Title>
        <Card style={{ maxWidth: 900, margin: '0 auto', padding: '24px' }}>
          <Steps current={current} items={steps} style={{ marginBottom: 32 }} />
          {current === 0 && (
            <Step1 appState={appState} onNext={handleStep1Next} />
          )}
          {current === 1 && (
            <Step2
              appState={appState}
              onBack={() => setCurrent(0)}
              onCalculate={handleStep2Calculate}
            />
          )}
          {current === 2 && result && (
            <Step3 result={result} appState={appState} onReset={handleReset} onBack={() => setCurrent(1)} />
          )}
        </Card>
      </Layout.Content>
      <Layout.Footer style={{ textAlign: 'center' }}>
        最佳附魔顺序计算器 &copy;2026 Crafted with ❤ by{' '}
        <a href="https://xjzsq.cn" target="_blank" rel="noreferrer">xjzsq</a>,
        {' '}Powered by{' '}
        <a href="https://reactjs.org/" target="_blank" rel="noreferrer">React</a>
        {' '}|{' '}
        <a href="https://github.com/xjzsq/best-enchantment-calculator" target="_blank" rel="noreferrer">GitHub</a>
      </Layout.Footer>
    </Layout>
  );
}
