import { Radio, Table, Button, Form, InputNumber, Switch, Space, Typography } from 'antd';
import type { AppState } from '../App';
import { getEnchantmentsForWeapon } from '../data/enchantments';
import type { Enchantment } from '../data/enchantments';
import type { EnchantLevel } from '../core/calculator';
import { toRoman } from '../utils/roman';
import { useState } from 'react';

const { Text } = Typography;

interface Props {
  appState: AppState;
  onBack: () => void;
  onCalculate: (state: Partial<AppState>) => void;
}

export default function Step2({ appState, onBack, onCalculate }: Props) {
  const [algorithm, setAlgorithm] = useState<'DifficultyFirst' | 'Hamming'>(appState.algorithm);
  const [targetEnchantments, setTargetEnchantments] = useState<EnchantLevel[]>(appState.targetEnchantments);
  const [ignorePenalty, setIgnorePenalty] = useState(appState.ignorePenalty);
  const [ignoreRepairing, setIgnoreRepairing] = useState(appState.ignoreRepairing);

  const availableEnchantments = getEnchantmentsForWeapon(appState.weaponIndex, appState.edition === 0 ? 0 : 1)
    .filter(e => {
      // Hide enchantments already at max level on the weapon
      const initial = appState.initialEnchantments.find(ie => ie.enchantmentId === e.id);
      return !(initial && initial.level >= e.maxLevel);
    });

  function toggleEnchant(ench: Enchantment, checked: boolean) {
    if (checked) {
      setTargetEnchantments(prev => [...prev, { enchantmentId: ench.id, level: ench.maxLevel }]);
    } else {
      setTargetEnchantments(prev => prev.filter(e => e.enchantmentId !== ench.id));
    }
  }

  function setLevel(enchId: string, level: number) {
    setTargetEnchantments(prev =>
      prev.map(e => e.enchantmentId === enchId ? { ...e, level } : e)
    );
  }

  function isConflicted(ench: Enchantment): boolean {
    return targetEnchantments.some(te => {
      const teEnch = availableEnchantments.find(e => e.id === te.enchantmentId);
      return teEnch?.conflicts.includes(ench.id) || ench.conflicts.includes(te.enchantmentId);
    });
  }

  const columns = [
    {
      title: '选择',
      width: 60,
      render: (_: unknown, record: Enchantment) => {
        const selected = targetEnchantments.some(e => e.enchantmentId === record.id);
        const conflicted = !selected && isConflicted(record);
        return (
          <input
            type="checkbox"
            checked={selected}
            disabled={conflicted}
            onChange={ev => toggleEnchant(record, ev.target.checked)}
          />
        );
      },
    },
    {
      title: '附魔',
      render: (_: unknown, record: Enchantment) => {
        const conflicted = !targetEnchantments.some(e => e.enchantmentId === record.id) && isConflicted(record);
        return (
          <Text type={conflicted ? 'secondary' : undefined}>
            {record.nameZh} ({record.nameEn})
            {conflicted && ' [冲突]'}
          </Text>
        );
      },
    },
    {
      title: '目标等级',
      width: 120,
      render: (_: unknown, record: Enchantment) => {
        const sel = targetEnchantments.find(e => e.enchantmentId === record.id);
        if (!sel) return <Text type="secondary">-</Text>;
        return (
          <InputNumber
            min={1}
            max={record.maxLevel}
            value={sel.level}
            size="small"
            onClick={e => e.stopPropagation()}
            onChange={val => setLevel(record.id, val ?? 1)}
          />
        );
      },
    },
    {
      title: '最高',
      width: 60,
      render: (_: unknown, record: Enchantment) => toRoman(record.maxLevel),
    },
  ];

  const canCalculate = targetEnchantments.length > 0;

  return (
    <div>
      <Form layout="vertical">
        <Form.Item label="计算算法">
          <Radio.Group value={algorithm} onChange={e => setAlgorithm(e.target.value)}>
            <Radio value="DifficultyFirst">难度优先 (DifficultyFirst)</Radio>
            <Radio value="Hamming">汉明算法 (Hamming)</Radio>
          </Radio.Group>
        </Form.Item>

        <Form.Item label="选项">
          <Space direction="vertical">
            <Space>
              <Switch checked={ignorePenalty} onChange={setIgnorePenalty} />
              <Text>忽略惩罚值（假设武器无使用次数）</Text>
            </Space>
            <Space>
              <Switch checked={ignoreRepairing} onChange={setIgnoreRepairing} />
              <Text>忽略修复（不计算修复费用）</Text>
            </Space>
          </Space>
        </Form.Item>

        <Form.Item label="目标附魔">
          <Table
            dataSource={availableEnchantments}
            columns={columns}
            rowKey="id"
            size="small"
            pagination={false}
            scroll={{ y: 300 }}
            onRow={(record) => {
              const selected = targetEnchantments.some(e => e.enchantmentId === record.id);
              const conflicted = !selected && isConflicted(record);
              return {
                onClick: () => {
                  if (!conflicted) {
                    toggleEnchant(record, !selected);
                  }
                },
                style: { cursor: conflicted ? 'not-allowed' : 'pointer' },
              };
            }}
          />
        </Form.Item>
      </Form>

      <div className="step-footer">
        <Button onClick={onBack}>上一步</Button>
        <Button
          type="primary"
          disabled={!canCalculate}
          onClick={() => onCalculate({ algorithm, targetEnchantments, ignorePenalty, ignoreRepairing })}
        >
          计算最优顺序
        </Button>
      </div>
    </div>
  );
}
