import { motion } from "motion/react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Users, DollarSign, Activity, ArrowUpRight, ArrowDownRight } from "lucide-react";

const data = [
  { name: "Mon", revenue: 4000, users: 2400 },
  { name: "Tue", revenue: 3000, users: 1398 },
  { name: "Wed", revenue: 2000, users: 9800 },
  { name: "Thu", revenue: 2780, users: 3908 },
  { name: "Fri", revenue: 1890, users: 4800 },
  { name: "Sat", revenue: 2390, users: 3800 },
  { name: "Sun", revenue: 3490, users: 4300 },
];

export function DashboardContent() {
  const stats = [
    { title: "Total Revenue", value: "$45,231.89", icon: DollarSign, trend: "+20.1%", isPositive: true },
    { title: "Active Users", value: "2,350", icon: Users, trend: "+15.2%", isPositive: true },
    { title: "Active Tasks", value: "124", icon: Activity, trend: "-4.5%", isPositive: false },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 space-y-8"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Dashboard Overview</h1>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-sm">
          Download Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div 
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="bg-card p-6 rounded-2xl border border-border shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <Icon size={24} />
                </div>
                <div className={`flex items-center gap-1 text-sm font-medium px-2.5 py-1 rounded-full ${stat.isPositive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                  {stat.isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                  {stat.trend}
                </div>
              </div>
              <h3 className="text-muted-foreground font-medium mb-1">{stat.title}</h3>
              <p className="text-3xl font-bold text-foreground">{stat.value}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="bg-card p-6 rounded-2xl border border-border shadow-sm h-[400px]">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-foreground">Revenue vs Users</h2>
          <p className="text-sm text-muted-foreground">Performance over the last 7 days</p>
        </div>
        <ResponsiveContainer width="100%" height="80%">
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
            <Tooltip 
              contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px', color: 'var(--foreground)' }}
              itemStyle={{ color: 'var(--foreground)' }}
            />
            <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
