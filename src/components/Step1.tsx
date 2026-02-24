import { Radio, Select, Table, Button, Form, InputNumber, Typography } from 'antd';
import type { AppState } from '../App';
import { WEAPONS } from '../data/weapons';
import { getEnchantmentsForWeapon } from '../data/enchantments';
import type { Enchantment } from '../data/enchantments';
import type { EnchantLevel } from '../core/calculator';
import { useState, useEffect } from 'react';

const { Text } = Typography;

interface Props {
  appState: AppState;
  onNext: (state: Partial<AppState>) => void;
}

export default function Step1({ appState, onNext }: Props) {
  const [edition, setEdition] = useState<0 | 1>(appState.edition);
  const [weaponIndex, setWeaponIndex] = useState<number>(appState.weaponIndex);
  const [initialEnchantments, setInitialEnchantments] = useState<EnchantLevel[]>(appState.initialEnchantments);
  const [initialPenalty, setInitialPenalty] = useState<number>(appState.initialPenalty);

  const availableEnchantments = getEnchantmentsForWeapon(weaponIndex, edition === 0 ? 0 : 1);

  useEffect(() => {
    const available = getEnchantmentsForWeapon(weaponIndex, edition === 0 ? 0 : 1);
    setInitialEnchantments(prev =>
      prev.filter(e => available.some(ae => ae.id === e.enchantmentId))
    );
  }, [weaponIndex, edition]);

  function toggleEnchant(ench: Enchantment, checked: boolean) {
    if (checked) {
      setInitialEnchantments(prev => [...prev, { enchantmentId: ench.id, level: 1 }]);
    } else {
      setInitialEnchantments(prev => prev.filter(e => e.enchantmentId !== ench.id));
    }
  }

  function setLevel(enchId: string, level: number) {
    setInitialEnchantments(prev =>
      prev.map(e => e.enchantmentId === enchId ? { ...e, level } : e)
    );
  }

  const columns = [
    {
      title: '选择',
      width: 60,
      render: (_: unknown, record: Enchantment) => {
        const selected = initialEnchantments.some(e => e.enchantmentId === record.id);
        return (
          <input
            type="checkbox"
            checked={selected}
            onChange={ev => toggleEnchant(record, ev.target.checked)}
          />
        );
      },
    },
    {
      title: '附魔',
      render: (_: unknown, record: Enchantment) => `${record.nameZh} (${record.nameEn})`,
    },
    {
      title: '等级',
      width: 120,
      render: (_: unknown, record: Enchantment) => {
        const sel = initialEnchantments.find(e => e.enchantmentId === record.id);
        if (!sel) return <Text type="secondary">-</Text>;
        return (
          <InputNumber
            min={1}
            max={record.maxLevel}
            value={sel.level}
            size="small"
            onChange={val => setLevel(record.id, val ?? 1)}
          />
        );
      },
    },
    {
      title: '最高',
      width: 60,
      render: (_: unknown, record: Enchantment) => record.maxLevel,
    },
  ];

  return (
    <div>
      <Form layout="vertical">
        <Form.Item label="游戏版本">
          <Radio.Group value={edition} onChange={e => setEdition(e.target.value)}>
            <Radio value={0}>Java版</Radio>
            <Radio value={1}>基岩版</Radio>
          </Radio.Group>
        </Form.Item>

        <Form.Item label="武器/工具类型">
          <Select
            value={weaponIndex}
            onChange={setWeaponIndex}
            style={{ width: 200 }}
            options={WEAPONS.map(w => ({
              value: w.index,
              label: `${w.icon} ${w.nameZh} (${w.nameEn})`,
            }))}
          />
        </Form.Item>

        <Form.Item label="初始惩罚值（已使用铁砧次数）">
          <InputNumber
            min={0}
            max={10}
            value={initialPenalty}
            onChange={val => setInitialPenalty(val ?? 0)}
          />
        </Form.Item>

        <Form.Item label="武器已有的附魔（可选）">
          <Table
            dataSource={availableEnchantments}
            columns={columns}
            rowKey="id"
            size="small"
            pagination={false}
            scroll={{ y: 300 }}
          />
        </Form.Item>
      </Form>

      <div className="step-footer">
        <Button type="primary" onClick={() => onNext({ edition, weaponIndex, initialEnchantments, initialPenalty })}>
          下一步
        </Button>
      </div>
    </div>
  );
}
