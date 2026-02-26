import { Radio, Select, Table, Button, Form, InputNumber, Typography } from 'antd';
import type { AppState } from '../App';
import { WEAPONS } from '../data/weapons';
import { getEnchantmentsForWeapon } from '../data/enchantments';
import type { Enchantment } from '../data/enchantments';
import type { EnchantLevel } from '../core/calculator';
import { toRoman } from '../utils/roman';
import { useState, useEffect, useRef } from 'react';
import type React from 'react';
import { useLocale } from '../i18n/useLocale';

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
  const [savedLevels, setSavedLevels] = useState<Record<string, number>>({});
  const inputMouseDown = useRef(false);
  const { t, locale } = useLocale();

  const availableEnchantments = getEnchantmentsForWeapon(weaponIndex, edition === 0 ? 0 : 1);

  useEffect(() => {
    const available = getEnchantmentsForWeapon(weaponIndex, edition === 0 ? 0 : 1);
    setInitialEnchantments(prev =>
      prev.filter(e => available.some(ae => ae.id === e.enchantmentId))
    );
  }, [weaponIndex, edition]);

  function toggleEnchant(ench: Enchantment, checked: boolean) {
    if (checked) {
      const level = savedLevels[ench.id] ?? 1;
      setInitialEnchantments(prev => {
        if (prev.some(e => e.enchantmentId === ench.id)) return prev;
        return [...prev, { enchantmentId: ench.id, level }];
      });
    } else {
      setInitialEnchantments(prev => {
        const current = prev.find(e => e.enchantmentId === ench.id);
        if (current) {
          setSavedLevels(s => ({ ...s, [ench.id]: current.level }));
        }
        return prev.filter(e => e.enchantmentId !== ench.id);
      });
    }
  }

  function setLevel(enchId: string, level: number) {
    setInitialEnchantments(prev =>
      prev.map(e => e.enchantmentId === enchId ? { ...e, level } : e)
    );
  }

  function isConflicted(ench: Enchantment): boolean {
    return initialEnchantments.some(ie => {
      if (ie.enchantmentId === ench.id) return false;
      const ieEnch = availableEnchantments.find(e => e.id === ie.enchantmentId);
      return ieEnch?.conflicts.includes(ench.id) || ench.conflicts.includes(ie.enchantmentId);
    });
  }

  const columns = [
    {
      title: t.colSelect,
      width: 60,
      render: (_: unknown, record: Enchantment) => {
        const selected = initialEnchantments.some(e => e.enchantmentId === record.id);
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
        const conflicted = !initialEnchantments.some(e => e.enchantmentId === record.id) && isConflicted(record);
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
      title: t.colLevel,
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

  return (
    <div>
      <Form layout="vertical">
        <Form.Item label={t.labelEdition}>
          <Radio.Group value={edition} onChange={e => setEdition(e.target.value)}>
            <Radio value={0}>{t.javaEdition}</Radio>
            <Radio value={1}>{t.bedrockEdition}</Radio>
          </Radio.Group>
        </Form.Item>

        <Form.Item label={t.labelWeapon}>
          <Select
            value={weaponIndex}
            onChange={setWeaponIndex}
            style={{ width: 260 }}
            options={WEAPONS.map(w => ({
              value: w.index,
              label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <img src={w.icon} alt={w.nameEn} style={{ width: 20, height: 20, imageRendering: 'pixelated' }} />
                  {locale === 'zh' ? w.nameZh : w.nameEn}
                </span>
              ),
            }))}
          />
        </Form.Item>

        <Form.Item label={t.labelPenalty}>
          <InputNumber
            min={0}
            max={10}
            value={initialPenalty}
            onChange={val => setInitialPenalty(val ?? 0)}
          />
        </Form.Item>

        <Form.Item label={t.labelInitialEnchants}>
          <Table
            dataSource={availableEnchantments}
            columns={columns}
            rowKey="id"
            size="small"
            pagination={false}
            scroll={{ y: 240, x: 'max-content' }}
            onRow={(record) => {
              const selected = initialEnchantments.some(ie => ie.enchantmentId === record.id);
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
        <Button type="primary" onClick={() => onNext({ edition, weaponIndex, initialEnchantments, initialPenalty })}>
          {t.nextStep}
        </Button>
      </div>
    </div>
  );
}
