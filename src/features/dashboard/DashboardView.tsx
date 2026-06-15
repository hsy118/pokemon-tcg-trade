"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Boxes,
  CalendarDays,
  ChartNoAxesCombined,
  Coins,
  PackageCheck,
  Percent,
  Sparkles,
} from "lucide-react";
import {
  calculateAverageProfitRateByCategory,
  calculateAverageProfitRateByLanguage,
  calculateDashboardSummary,
  calculateInventoryShareByLanguage,
  calculateMonthlyProfit,
  getLongHoldingInventory,
  getLossSales,
  getTopProfitSales,
} from "@/features/trades/calculations";
import { formatCurrency, formatNumber, formatRate } from "@/features/trades/formatters";
import type { RatioPoint, SaleResult } from "@/features/trades/types";
import { useTradeStore } from "@/features/trades/useTradeStore";

const CHART_COLORS = ["#7c3aed", "#14b8a6", "#f97316", "#ec4899", "#3b82f6"];

export function DashboardView() {
  const { purchases, sales, error, isHydrated } = useTradeStore();
  const summary = calculateDashboardSummary(purchases, sales);
  const profitByLanguage = calculateAverageProfitRateByLanguage(purchases, sales);
  const profitByCategory = calculateAverageProfitRateByCategory(purchases, sales);
  const inventoryShare = calculateInventoryShareByLanguage(purchases, sales);
  const monthlyProfit = calculateMonthlyProfit(purchases, sales);
  const topProfitSales = getTopProfitSales(purchases, sales);
  const longHoldingInventory = getLongHoldingInventory(purchases, sales);
  const lossSales = getLossSales(purchases, sales);

  if (!isHydrated) {
    return <div className="empty-state">대시보드 데이터를 불러오는 중입니다.</div>;
  }

  return (
    <main className="page-stack">
      <section className="hero-panel hero-panel--compact">
        <div className="hero-panel__copy">
          <span className="brand__eyebrow">
            <Sparkles aria-hidden="true" size={15} />
            Portfolio snapshot
          </span>
          <h1>오늘의 Cardfolio</h1>
          <p>보유 원가, 실현 손익, 오래 들고 있는 상품을 한 화면에서 확인합니다.</p>
        </div>
      </section>
      {error ? <p className="form-error">{error}</p> : null}
      <section className="grid grid--cards">
        <MetricCard
          icon={<Coins aria-hidden="true" size={19} />}
          label="총 매입 원가"
          value={formatCurrency(summary.totalAcquisitionCost)}
        />
        <MetricCard
          icon={<Boxes aria-hidden="true" size={19} />}
          label="현재 재고 원가"
          value={formatCurrency(summary.currentInventoryCost)}
        />
        <MetricCard
          icon={<ChartNoAxesCombined aria-hidden="true" size={19} />}
          label="실현 순이익"
          value={formatCurrency(summary.realizedNetProfit)}
        />
        <MetricCard
          icon={<Percent aria-hidden="true" size={19} />}
          label="실현 수익률"
          value={formatRate(summary.realizedProfitRate)}
        />
        <MetricCard
          icon={<PackageCheck aria-hidden="true" size={19} />}
          label="보유 수량"
          value={`${formatNumber(summary.currentQuantity)}개`}
        />
        <MetricCard
          icon={<CalendarDays aria-hidden="true" size={19} />}
          label="평균 보유 기간"
          value={`${formatNumber(summary.averageHoldingDays)}일`}
        />
      </section>

      <section className="section">
        <div className="section__header">
          <div>
            <h2 className="section__title">핵심 차트</h2>
            <p className="section__description">
              언어판, 상품군, 재고 비중, 월별 실현 손익을 빠르게 비교합니다.
            </p>
          </div>
        </div>
        <div className="grid grid--charts">
          <ChartCard title="언어판별 수익률">
            <RateBarChart data={profitByLanguage} />
          </ChartCard>
          <ChartCard title="상품군별 수익률">
            <RateBarChart data={profitByCategory} />
          </ChartCard>
          <ChartCard title="현재 재고 비중">
            <InventoryPieChart data={inventoryShare} />
          </ChartCard>
          <ChartCard title="월별 실현 손익">
            {monthlyProfit.length === 0 ? (
              <div className="empty-state">판매 기록이 없습니다.</div>
            ) : (
              <div className="chart">
                <ResponsiveContainer height={260} width="100%">
                  <BarChart data={monthlyProfit}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `${Number(value) / 1000}k`} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Bar dataKey="profit" fill="#3758f9" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </ChartCard>
        </div>
      </section>

      <section className="grid grid--lists">
        <ListCard title="수익률 TOP 5" emptyText="판매 기록이 없습니다.">
          {topProfitSales.map((sale) => (
            <SaleListItem key={sale.id} sale={sale} />
          ))}
        </ListCard>
        <ListCard title="장기 보유 TOP 5" emptyText="보유 재고가 없습니다.">
          {longHoldingInventory.map((item) => (
            <div className="list__item" key={item.id}>
              <div>
                <div className="list__title">{item.productName}</div>
                <div className="list__meta">
                  {item.language} · {item.category} · {formatNumber(item.remainingQuantity)}개
                </div>
              </div>
              <strong>{formatNumber(item.holdingDays)}일</strong>
            </div>
          ))}
        </ListCard>
        <ListCard title="손실 거래 목록" emptyText="손실 거래가 없습니다.">
          {lossSales.map((sale) => (
            <SaleListItem key={sale.id} sale={sale} />
          ))}
        </ListCard>
      </section>
    </main>
  );
}

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="card metric">
      <span className="metric__icon">{icon}</span>
      <span className="metric__label">{label}</span>
      <strong className="metric__value">{value}</strong>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card">
      <h3 className="section__title">{title}</h3>
      {children}
    </div>
  );
}

function RateBarChart({ data }: { data: RatioPoint[] }) {
  if (data.length === 0) {
    return <div className="empty-state">판매 기록이 없습니다.</div>;
  }

  return (
    <div className="chart">
      <ResponsiveContainer height={260} width="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis tickFormatter={(value) => `${value}%`} />
          <Tooltip formatter={(value) => `${Number(value).toFixed(2)}%`} />
          <Bar dataKey="value" fill="#3758f9" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function InventoryPieChart({ data }: { data: RatioPoint[] }) {
  if (data.length === 0) {
    return <div className="empty-state">보유 재고가 없습니다.</div>;
  }

  return (
    <div className="chart">
      <ResponsiveContainer height={260} width="100%">
        <PieChart>
          <Pie data={data} dataKey="value" innerRadius={58} nameKey="name" outerRadius={92}>
            {data.map((entry, index) => (
              <Cell
                fill={CHART_COLORS[index % CHART_COLORS.length]}
                key={`${entry.name}-${entry.value}`}
              />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
          <Legend iconType="circle" />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function ListCard({
  title,
  emptyText,
  children,
}: {
  title: string;
  emptyText: string;
  children: React.ReactNode;
}) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : Boolean(children);

  return (
    <section className="section">
      <h2 className="section__title">{title}</h2>
      <div className="list" style={{ marginTop: 16 }}>
        {hasChildren ? children : <div className="empty-state">{emptyText}</div>}
      </div>
    </section>
  );
}

function SaleListItem({ sale }: { sale: SaleResult }) {
  return (
    <div className="list__item">
      <div>
        <div className="list__title">{sale.productName}</div>
        <div className="list__meta">
          {sale.language} · {sale.category} · {sale.saleDate}
        </div>
      </div>
      <div className={sale.netProfit >= 0 ? "profit-positive" : "profit-negative"}>
        {formatRate(sale.profitRate)}
      </div>
    </div>
  );
}
