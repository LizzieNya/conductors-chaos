import React, { useState } from 'react';
import { UPGRADES, useUpgradeStore, type UpgradeCategory } from '../upgrades';

export const UpgradeShop: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const coins = useUpgradeStore((s) => s.coins);
  const purchaseUpgrade = useUpgradeStore((s) => s.purchaseUpgrade);
  const getUpgradeLevel = useUpgradeStore((s) => s.getUpgradeLevel);
  const getUpgradeCost = useUpgradeStore((s) => s.getUpgradeCost);
  
  const [selectedCategory, setSelectedCategory] = useState<UpgradeCategory | 'all'>('all');
  const [purchaseAnimation, setPurchaseAnimation] = useState<string | null>(null);

  const handlePurchase = (upgradeId: string) => {
    const success = purchaseUpgrade(upgradeId);
    if (success) {
      setPurchaseAnimation(upgradeId);
      setTimeout(() => setPurchaseAnimation(null), 600);
    }
  };

  const categories: { id: UpgradeCategory | 'all'; label: string; icon: string; color: string }[] = [
    { id: 'all', label: 'All', icon: '🎭', color: '#8b5cf6' },
    { id: 'speed', label: 'Speed', icon: '⚡', color: '#3b82f6' },
    { id: 'combo', label: 'Combo', icon: '🔥', color: '#f59e0b' },
    { id: 'power', label: 'Power', icon: '💪', color: '#10b981' },
    { id: 'special', label: 'Special', icon: '✨', color: '#ec4899' },
  ];

  const filteredUpgrades = selectedCategory === 'all' 
    ? UPGRADES 
    : UPGRADES.filter((u) => u.category === selectedCategory);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.9)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 300,
        animation: 'fadeIn 0.3s ease-out',
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(135deg, #1e1b4b, #312e81)',
          borderRadius: 24,
          padding: '32px',
          maxWidth: 900,
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 0 60px rgba(139, 92, 246, 0.4)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2
              style={{
                fontSize: 32,
                fontWeight: 900,
                margin: 0,
                background: 'linear-gradient(135deg, #c084fc, #f472b6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              🎼 Upgrade Shop
            </h2>
            <p style={{ fontSize: 14, color: '#94a3b8', margin: '4px 0 0' }}>
              Enhance your conducting abilities
            </p>
          </div>
          
          <div style={{ textAlign: 'right' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(251, 191, 36, 0.15)',
                border: '1px solid rgba(251, 191, 36, 0.3)',
                borderRadius: 16,
                padding: '8px 20px',
                fontSize: 20,
                fontWeight: 900,
                color: '#fbbf24',
              }}
            >
              <span>💰</span>
              <span>{coins.toLocaleString()}</span>
            </div>
            <button
              onClick={onClose}
              style={{
                marginTop: 8,
                padding: '6px 16px',
                fontSize: 14,
                fontWeight: 700,
                background: 'rgba(255,255,255,0.1)',
                color: '#e2e8f0',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 8,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* Category Filter */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  padding: '10px 20px',
                  fontSize: 14,
                  fontWeight: 700,
                  background: isActive
                    ? `linear-gradient(135deg, ${cat.color}33, ${cat.color}22)`
                    : 'rgba(255,255,255,0.04)',
                  color: isActive ? cat.color : '#64748b',
                  border: `1.5px solid ${isActive ? cat.color + '88' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 12,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  transform: isActive ? 'scale(1.05)' : 'scale(1)',
                }}
              >
                {cat.icon} {cat.label}
              </button>
            );
          })}
        </div>

        {/* Upgrades Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 16,
          }}
        >
          {filteredUpgrades.map((upgrade) => {
            const level = getUpgradeLevel(upgrade.id);
            const cost = getUpgradeCost(upgrade.id);
            const isMaxed = level >= upgrade.maxLevel;
            const canAfford = coins >= cost;
            const isPurchasing = purchaseAnimation === upgrade.id;

            const categoryColor = categories.find((c) => c.id === upgrade.category)?.color || '#8b5cf6';

            return (
              <div
                key={upgrade.id}
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: 16,
                  padding: 16,
                  border: `1px solid ${categoryColor}33`,
                  transition: 'all 0.2s',
                  transform: isPurchasing ? 'scale(1.05)' : 'scale(1)',
                  animation: isPurchasing ? 'pulse 0.6s ease-out' : 'none',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ fontSize: 32 }}>{upgrade.icon}</div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: isMaxed ? '#22c55e' : categoryColor,
                      background: isMaxed ? 'rgba(34, 197, 94, 0.15)' : `${categoryColor}22`,
                      padding: '4px 10px',
                      borderRadius: 8,
                      border: `1px solid ${isMaxed ? '#22c55e' : categoryColor}44`,
                    }}
                  >
                    {isMaxed ? 'MAX' : `${level}/${upgrade.maxLevel}`}
                  </div>
                </div>

                <h3
                  style={{
                    fontSize: 16,
                    fontWeight: 800,
                    color: '#f8fafc',
                    margin: '0 0 6px',
                  }}
                >
                  {upgrade.name}
                </h3>

                <p
                  style={{
                    fontSize: 12,
                    color: '#94a3b8',
                    margin: '0 0 12px',
                    lineHeight: 1.5,
                    minHeight: 36,
                  }}
                >
                  {upgrade.description}
                </p>

                {/* Level Progress Bar */}
                <div
                  style={{
                    width: '100%',
                    height: 6,
                    background: 'rgba(255,255,255,0.08)',
                    borderRadius: 3,
                    overflow: 'hidden',
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{
                      width: `${(level / upgrade.maxLevel) * 100}%`,
                      height: '100%',
                      background: `linear-gradient(90deg, ${categoryColor}, ${categoryColor}cc)`,
                      borderRadius: 3,
                      transition: 'width 0.3s',
                    }}
                  />
                </div>

                <button
                  onClick={() => handlePurchase(upgrade.id)}
                  disabled={isMaxed || !canAfford}
                  style={{
                    width: '100%',
                    padding: '10px',
                    fontSize: 14,
                    fontWeight: 700,
                    background: isMaxed
                      ? 'rgba(34, 197, 94, 0.2)'
                      : canAfford
                        ? `linear-gradient(135deg, ${categoryColor}, ${categoryColor}cc)`
                        : 'rgba(255,255,255,0.05)',
                    color: isMaxed ? '#22c55e' : canAfford ? '#fff' : '#475569',
                    border: 'none',
                    borderRadius: 10,
                    cursor: isMaxed || !canAfford ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    opacity: isMaxed || !canAfford ? 0.6 : 1,
                  }}
                >
                  {isMaxed ? '✓ Maxed Out' : `💰 ${cost.toLocaleString()} Coins`}
                </button>
              </div>
            );
          })}
        </div>

        {filteredUpgrades.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: 40,
              color: '#64748b',
              fontSize: 16,
            }}
          >
            No upgrades in this category
          </div>
        )}
      </div>
    </div>
  );
};
