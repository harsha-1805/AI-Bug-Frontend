// Static dummy data for the Phase-1 dashboard UI. No backend endpoint
// exists for this yet (by design, per the project brief) — swap this
// module out for a real `dashboardService.getSummary()` call later.

export const statCards = [
  { key: "total", label: "Total Bugs", value: 321, delta: "18%", direction: "up" },
  { key: "critical", label: "Critical", value: 23, delta: "12%", direction: "up" },
  { key: "resolved", label: "Resolved", value: 128, delta: "22%", direction: "up" },
  { key: "open", label: "Open", value: 193, delta: "15%", direction: "up" },
  { key: "inProgress", label: "In Progress", value: 76, delta: "8%", direction: "up" },
];

export const bugStatusBreakdown = [
  { name: "Critical", value: 23, color: "#ef4444" },
  { name: "High", value: 68, color: "#f97316" },
  { name: "Medium", value: 145, color: "#f59e0b" },
  { name: "Low", value: 85, color: "#10b981" },
];

export const bugTrend = [
  { day: "May 10", created: 32, resolved: 18 },
  { day: "May 11", created: 45, resolved: 30 },
  { day: "May 12", created: 28, resolved: 40 },
  { day: "May 13", created: 52, resolved: 22 },
  { day: "May 14", created: 38, resolved: 35 },
  { day: "May 15", created: 60, resolved: 45 },
  { day: "May 16", created: 41, resolved: 50 },
];

export const topBuggyModules = [
  { module: "Authentication", count: 48 },
  { module: "Payment", count: 32 },
  { module: "Checkout", count: 28 },
  { module: "Dashboard", count: 22 },
  { module: "User Profile", count: 18 },
];

export const recentActivity = [
  { id: 1, text: "AI created BUG-321", time: "2 mins ago" },
  { id: 2, text: "Sara assigned BUG-299 to you", time: "15 mins ago" },
  { id: 3, text: "BUG-298 marked as resolved", time: "1 hour ago" },
  { id: 4, text: "Sprint 12 started", time: "2 hours ago" },
];

export const aiInsights = [
  { id: 1, text: "Login failures increased by 23%", meta: "27 bugs related to Authentication" },
  { id: 2, text: "Payment module is unstable", meta: "16 crashes in last 7 days" },
  { id: 3, text: "8 similar bugs detected", meta: "AI merged 8 potential duplicates" },
  { id: 4, text: "Sprint health looks good", meta: "91% of tasks on track" },
];
