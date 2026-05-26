'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import { formatNumber } from '@/lib/utils';

const COLORS = ['#2D7D46', '#4CAF50', '#FFB74D', '#42A5F5', '#BA68C8', '#FF7043'];

export function ProjectTonnageChart({ data }: { data: { name: string; ton: number; mw: number }[] }) {
  if (!data.length) {
    return <div className="h-72 flex items-center justify-center text-slate-400 text-sm">Henüz veri yok</div>;
  }
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
        <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
        <Tooltip
          contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid #e2e8f0' }}
          formatter={(value: number, name: string) =>
            name === 'ton' ? [`${formatNumber(value)} ton`, 'Tonaj'] : [`${formatNumber(value)} MW`, 'Güç']
          }
        />
        <Bar dataKey="ton" fill="#2D7D46" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function MaterialBreakdownChart({ data }: { data: { name: string; value: number }[] }) {
  if (!data.length || data.every((d) => d.value === 0)) {
    return <div className="h-72 flex items-center justify-center text-slate-400 text-sm">Henüz veri yok</div>;
  }
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={4}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid #e2e8f0' }}
          formatter={(value: number) => [`${formatNumber(value)} ton`, '']}
        />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
