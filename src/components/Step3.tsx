import { Button, Card, Tag, Typography, Space, Divider, Alert } from 'antd';
import type { CalcResult, ForgeStep, EnchantLevel } from '../core/calculator';
import type { AppState } from '../App';
import { ENCHANTMENTS } from '../data/enchantments';
import { WEAPONS, ENCHANTED_BOOK_ICON } from '../data/weapons';
import { toRoman } from '../utils/roman';

const { Text, Title } = Typography;

interface Props {
  result: CalcResult;
  appState: AppState;
  onReset: () => void;
  onBack: () => void;
}

function EnchantTag({ el }: { el: EnchantLevel }) {
  const ench = ENCHANTMENTS.find(e => e.id === el.enchantmentId);
  if (!ench) return null;
  return (
    <Tag color="blue" style={{ marginBottom: 4 }}>
      {ench.nameZh} {toRoman(el.level)}
    </Tag>
  );
}

function ItemDisplay({ item, label, weaponIndex }: { item: ForgeStep['target']; label: string; weaponIndex: number }) {
  const weapon = WEAPONS.find(w => w.index === weaponIndex);
  const iconSrc = item.isBook ? ENCHANTED_BOOK_ICON : (weapon?.icon ?? '');
  const iconAlt = item.isBook ? '附魔书' : (weapon?.nameZh ?? '物品');

  return (
    <div style={{ flex: 1, minWidth: 180 }}>
      <Text strong>{label}</Text>
      <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
        <img src={iconSrc} alt={iconAlt} style={{ width: 24, height: 24, imageRendering: 'pixelated' }} />
        {item.isBook ? (
          <Tag color="green">附魔书</Tag>
        ) : (
          <Tag color="purple">{weapon?.nameZh ?? '物品'}</Tag>
        )}
        <Tag>惩罚值: {item.penalty}</Tag>
      </div>
      <div style={{ marginTop: 4 }}>
        {item.enchantments.map(el => (
          <EnchantTag key={el.enchantmentId} el={el} />
        ))}
      </div>
    </div>
  );
}

export default function Step3({ result, appState, onReset, onBack }: Props) {
  if (result.steps.length === 0) {
    return (
      <div>
        <Alert message="没有需要附魔的步骤。" type="info" />
        <div className="step-footer">
          <Button onClick={onBack}>上一步</Button>
          <Button onClick={onReset}>重新开始</Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Title level={4}>附魔步骤（共 {result.steps.length} 步）</Title>
      {result.steps.map((step, idx) => (
        <Card
          key={idx}
          size="small"
          style={{ marginBottom: 12 }}
          title={
            <Space>
              <Tag color="orange">第 {idx + 1} 步</Tag>
              <Text>花费: <Text strong type="danger">{step.cost} 级经验</Text></Text>
            </Space>
          }
        >
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <ItemDisplay item={step.target} label="目标（铁砧左侧）" weaponIndex={appState.weaponIndex} />
            <div style={{ display: 'flex', alignItems: 'center', padding: '20px 0' }}>
              <Text style={{ fontSize: 20 }}>+</Text>
            </div>
            <ItemDisplay item={step.sacrifice} label="牺牲品（铁砧右侧）" weaponIndex={appState.weaponIndex} />
            <div style={{ display: 'flex', alignItems: 'center', padding: '20px 0' }}>
              <Text style={{ fontSize: 20 }}>→</Text>
            </div>
            <ItemDisplay item={step.result} label="结果" weaponIndex={appState.weaponIndex} />
          </div>
        </Card>
      ))}

      <Divider />
      <Card>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Text>总经验消耗:</Text>
            <Text strong style={{ fontSize: 18, color: '#f5222d' }}>
              {result.totalCost} 级经验
            </Text>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Text>版本:</Text>
            <Text>{appState.edition === 0 ? 'Java版' : '基岩版'}</Text>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Text>算法:</Text>
            <Text>{appState.algorithm}</Text>
          </div>
          {result.calcTimeMs != null && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text>计算用时:</Text>
              <Text>{result.calcTimeMs.toFixed(1)} ms</Text>
            </div>
          )}
        </Space>
      </Card>

      <div className="step-footer">
        <Button onClick={onBack}>上一步</Button>
        <Button type="primary" onClick={onReset}>重新开始</Button>
      </div>
    </div>
  );
}
