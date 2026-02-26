import { Radio, Table, Button, Form, InputNumber, Switch, Space, Typography } from 'antd';
import type { AppState } from '../App';
import { getEnchantmentsForWeapon } from '../data/enchantments';
import type { Enchantment } from '../data/enchantments';
import type { EnchantLevel } from '../core/calculator';
import { toRoman } from '../utils/roman';
import { useState, useRef } from 'react';
import type React from 'react';
import { useLocale } from '../i18n/useLocale';

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
  const [savedLevels, setSavedLevels] = useState<Record<string, number>>({});
  const inputMouseDown = useRef(false);
  const { t, locale } = useLocale();

  const availableEnchantments = getEnchantmentsForWeapon(appState.weaponIndex, appState.edition === 0 ? 0 : 1)
    .filter(e => {
      // Hide enchantments already at max level on the weapon
      const initial = appState.initialEnchantments.find(ie => ie.enchantmentId === e.id);
      return !(initial && initial.level >= e.maxLevel);
    });

  function toggleEnchant(ench: Enchantment, checked: boolean) {
    if (checked) {
      const level = savedLevels[ench.id] ?? ench.maxLevel;
      setTargetEnchantments(prev => {
        if (prev.some(e => e.enchantmentId === ench.id)) return prev;
        return [...prev, { enchantmentId: ench.id, level }];
      });
    } else {
      setTargetEnchantments(prev => {
        const current = prev.find(e => e.enchantmentId === ench.id);
        if (current) {
          setSavedLevels(s => ({ ...s, [ench.id]: current.level }));
        }
        return prev.filter(e => e.enchantmentId !== ench.id);
      });
    }
  }

  function setLevel(enchId: string, level: number) {
    setTargetEnchantments(prev =>
      prev.map(e => e.enchantmentId === enchId ? { ...e, level } : e)
    );
  }

  function isConflicted(ench: Enchantment): boolean {
    // Check conflicts with selected target enchantments
    const conflictWithTarget = targetEnchantments.some(te => {
      const teEnch = availableEnchantments.find(e => e.id === te.enchantmentId);
      return teEnch?.conflicts.includes(ench.id) || ench.conflicts.includes(te.enchantmentId);
    });
    // Check conflicts with initial enchantments from Step1
    const conflictWithInitial = appState.initialEnchantments.some(ie => {
      const ieEnch = availableEnchantments.find(e => e.id === ie.enchantmentId);
      return ieEnch?.conflicts.includes(ench.id) || ench.conflicts.includes(ie.enchantmentId);
    });
    return conflictWithTarget || conflictWithInitial;
  }

  const columns = [
    {
      title: t.colSelect,
      width: 60,
      render: (_: unknown, record: Enchantment) => {
        const selected = targetEnchantments.some(e => e.enchantmentId === record.id);
        const conflicted = !selected && isConflicted(record);
        return (
          <input
            type="checkbox"
            checked={selected}
            disabled={conflicted}
            onClick={e => e.stopPropagation()}
            onChange={ev => toggleEnchant(record, ev.target.checked)}
          />
        );
      },
    },
    {
      title: t.colEnchant,
      minWidth: 160,
      render: (_: unknown, record: Enchantment) => {
        const conflicted = !targetEnchantments.some(e => e.enchantmentId === record.id) && isConflicted(record);
        const name = locale === 'zh' ? record.nameZh : record.nameEn;
        return (
          <Text type={conflicted ? 'secondary' : undefined}>
            {name}
            {conflicted && ` ${t.conflicted}`}
          </Text>
        );
      },
    },
    {
      title: t.colTargetLevel,
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
            onMouseDown={(e) => {
              e.stopPropagation();
              inputMouseDown.current = true;
              setTimeout(() => { inputMouseDown.current = false; }, 300);
            }}
            onChange={val => setLevel(record.id, val ?? 1)}
          />
        );
      },
    },
    {
      title: t.colMaxLevel,
      width: 60,
      render: (_: unknown, record: Enchantment) => toRoman(record.maxLevel),
    },
  ];

  const canCalculate = targetEnchantments.length > 0;

  return (
    <div>
      <Form layout="vertical">
        <Form.Item label={t.labelAlgorithm}>
          <Radio.Group value={algorithm} onChange={e => setAlgorithm(e.target.value)}>
            <Radio value="DifficultyFirst">{t.difficultyFirst}</Radio>
            <Radio value="Hamming">{t.hamming}</Radio>
          </Radio.Group>
        </Form.Item>

        <Form.Item label={t.labelOptions}>
          <Space>
            <Switch checked={ignorePenalty} onChange={setIgnorePenalty} />
            <Text>{t.ignorePenaltyLabel}</Text>
          </Space>
        </Form.Item>

        <Form.Item label={t.labelTargetEnchants}>
          <Table
            dataSource={availableEnchantments}
            columns={columns}
            rowKey="id"
            size="small"
            pagination={false}
            scroll={{ y: 300, x: 'max-content' }}
            onRow={(record) => {
              const selected = targetEnchantments.some(e => e.enchantmentId === record.id);
              const conflicted = !selected && isConflicted(record);
              return {
                onClick: (e: React.MouseEvent) => {
                  if (inputMouseDown.current) return;
                  if ((e.target as HTMLElement).closest('.ant-input-number')) return;
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
        <Button onClick={onBack}>{t.prevStep}</Button>
        <Button
          type="primary"
          disabled={!canCalculate}
          onClick={() => onCalculate({ algorithm, targetEnchantments, ignorePenalty })}
        >
          {t.calculate}
        </Button>
      </div>
    </div>
  );
}
