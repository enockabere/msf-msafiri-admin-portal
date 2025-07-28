import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Users, Calendar, Hotel, Coins, TrendingUp } from "lucide-react";

const statsData = [
  {
    title: "Active Visitors",
    value: "127",
    change: "+12% from last week",
    icon: Users,
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-l-green-500",
  },
  {
    title: "Active Events",
    value: "8",
    change: "3 starting this week",
    icon: Calendar,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-l-blue-500",
  },
  {
    title: "Room Occupancy",
    value: "85%",
    change: "68/80 rooms occupied",
    icon: Hotel,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-l-orange-500",
  },
  {
    title: "Pending PerDiem",
    value: "KES12,450",
    change: "15 payments pending",
    icon: Coins,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-l-purple-500",
  },
];

export default function StatsCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {statsData.map((stat, index) => (
        <Card
          key={index}
          className={`border-l-4 ${stat.borderColor} hover:shadow-lg transition-shadow duration-200`}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <p className="text-sm font-medium text-gray-600">{stat.title}</p>
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {stat.value}
            </div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              {stat.change}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
