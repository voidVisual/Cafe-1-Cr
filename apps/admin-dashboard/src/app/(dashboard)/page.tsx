"use client";

import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, Users, DollarSign, ShoppingBag } from "lucide-react";

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState({ revenueToday: 0, ordersToday: 0 });
  const [topItems, setTopItems] = useState<{name: string, sales: number}[]>([]);
  const [chartData, setChartData] = useState<{name: string, revenue: number, orders: number}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('/api/analytics');
        if (response.ok) {
          const data = await response.json();
          setStats({
            revenueToday: data.revenueToday || 0,
            ordersToday: data.ordersToday || 0,
          });
          if (data.topItems && data.topItems.length > 0) {
            setTopItems(data.topItems);
          }
          if (data.chartData && data.chartData.length > 0) {
            setChartData(data.chartData);
          }
        }
      } catch (err) {
        console.error("Failed to fetch analytics:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalytics();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">₹{stats.revenueToday.toFixed(2)}</p>
            </div>
            <div className="rounded-full bg-green-50 p-3">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="mr-1 h-4 w-4 text-green-500" />
            <span className="text-green-500 font-medium">+4.75%</span>
            <span className="ml-2 text-gray-500">from yesterday</span>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Orders Today</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{stats.ordersToday}</p>
            </div>
            <div className="rounded-full bg-blue-50 p-3">
              <ShoppingBag className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="mr-1 h-4 w-4 text-green-500" />
            <span className="text-green-500 font-medium">+12.5%</span>
            <span className="ml-2 text-gray-500">from yesterday</span>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Customers</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{loading ? '...' : stats.ordersToday}</p>
            </div>
            <div className="rounded-full bg-orange-50 p-3">
              <Users className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-500">Orders placed today</span>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Avg. Order Value</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {loading ? '...' : stats.ordersToday > 0 ? `₹${(stats.revenueToday / stats.ordersToday).toFixed(0)}` : '₹0'}
              </p>
            </div>
            <div className="rounded-full bg-purple-50 p-3">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-500">Revenue per order today</span>
          </div>
        </div>
      </div>

      {/* Charts and Lists */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Revenue Over Time (Past 7 Days)</h2>
          <div className="h-80 w-full">
            {mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} dx={-10} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [`₹${value.toFixed(2)}`, 'Revenue']}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#ea580c" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Top Items</h2>
          <div className="space-y-4">
            {topItems.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-orange-600 font-bold text-sm">
                    {index + 1}
                  </div>
                  <span className="font-medium text-gray-800">{item.name}</span>
                </div>
                <span className="text-gray-500 font-medium">{item.sales}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
