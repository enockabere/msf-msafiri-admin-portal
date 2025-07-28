import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const activitiesData = [
  {
    visitor: {
      name: "Sarah Johnson",
      department: "Medical Team",
    },
    action: "Room Assignment",
    status: "completed",
    time: "2 hours ago",
    admin: "Event Admin",
    adminRole: "event-admin",
  },
  {
    visitor: {
      name: "Michael Chen",
      department: "Logistics",
    },
    action: "Document Review",
    status: "pending",
    time: "4 hours ago",
    admin: "HR Admin",
    adminRole: "hr-admin",
  },
  {
    visitor: {
      name: "Anna Schmidt",
      department: "Coordinator",
    },
    action: "PerDiem Approved",
    status: "active",
    time: "6 hours ago",
    admin: "HR Admin",
    adminRole: "hr-admin",
  },
  {
    visitor: {
      name: "David Kim",
      department: "Medical Team",
    },
    action: "Transport Arranged",
    status: "completed",
    time: "8 hours ago",
    admin: "Event Admin",
    adminRole: "event-admin",
  },
  {
    visitor: {
      name: "Maria Santos",
      department: "Field Coordinator",
    },
    action: "Check-in Complete",
    status: "active",
    time: "1 day ago",
    admin: "Super Admin",
    adminRole: "super-admin",
  },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case "completed":
      return (
        <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
          Completed
        </Badge>
      );
    case "pending":
      return (
        <Badge variant="destructive" className="bg-red-50 text-red-700 border-red-200">
          Pending
        </Badge>
      );
    case "active":
      return (
        <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
          Active
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const getAdminRoleColor = (role: string) => {
  switch (role) {
    case "super-admin":
      return "text-red-600";
    case "hr-admin":
      return "text-orange-600";
    case "event-admin":
      return "text-blue-600";
    case "mt-admin":
      return "text-yellow-600";
    default:
      return "text-gray-600";
  }
};

export default function RecentActivities() {
  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">Recent Activities</CardTitle>
        <Button variant="outline" size="sm">
          View All
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Visitor</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Admin</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activitiesData.map((activity, index) => (
              <TableRow key={index}>
                <TableCell>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {activity.visitor.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {activity.visitor.department}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-medium">{activity.action}</TableCell>
                <TableCell>{getStatusBadge(activity.status)}</TableCell>
                <TableCell className="text-gray-500">{activity.time}</TableCell>
                <TableCell>
                  <span className={`font-medium ${getAdminRoleColor(activity.adminRole)}`}>
                    {activity.admin}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}