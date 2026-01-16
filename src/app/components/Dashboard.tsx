import { Card } from "@/app/components/ui/card";
import { AlertCircle, CheckCircle, Clock, Users } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";

interface DashboardProps {
  onNavigate: (view: string) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const metrics = [
    {
      label: "Pending Extractions",
      value: "42",
      description: "Need review",
      icon: AlertCircle,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      action: "Review Now",
      onClick: () => onNavigate("pending"),
    },
    {
      label: "My Claimed Items",
      value: "8",
      description: "Currently reviewing",
      icon: Clock,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      action: "Continue",
      onClick: () => onNavigate("pending"),
    },
    {
      label: "Approved Today",
      value: "15",
      description: "Verified and published",
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
      action: "View History",
      onClick: () => onNavigate("activity"),
    },
    {
      label: "Team Capacity",
      value: "3/5",
      description: "Active reviewers",
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      action: "View Team",
      onClick: () => onNavigate("settings"),
    },
  ];

  const recentActivity = [
    {
      type: "approved",
      entity: "TCS Command Handler v2.1",
      reviewer: "Sarah Chen",
      time: "5 minutes ago",
    },
    {
      type: "rejected",
      entity: "Power Subsystem Telemetry",
      reviewer: "You",
      time: "12 minutes ago",
    },
    {
      type: "claimed",
      entity: "Batch #127 (6 items)",
      reviewer: "Marcus Rodriguez",
      time: "28 minutes ago",
    },
    {
      type: "approved",
      entity: "Attitude Control Parameter",
      reviewer: "You",
      time: "1 hour ago",
    },
  ];

  const alerts = [
    {
      type: "warning",
      message: "Your claim on Batch #125 expires in 45 minutes",
      action: "Continue Review",
    },
    {
      type: "info",
      message: "New extraction batch available (12 items)",
      action: "View",
    },
  ];

  return (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Dashboard</h2>
        <p className="text-gray-600">Overview of pending work and team activity</p>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, index) => (
            <Card key={index} className={`p-4 border-l-4 ${
              alert.type === "warning" ? "border-orange-500 bg-orange-50" : "border-blue-500 bg-blue-50"
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertCircle className={`h-5 w-5 ${
                    alert.type === "warning" ? "text-orange-600" : "text-blue-600"
                  }`} />
                  <span className="text-sm font-medium">{alert.message}</span>
                </div>
                <Button variant="outline" size="sm">
                  {alert.action}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.label} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg ${metric.bgColor}`}>
                  <Icon className={`h-6 w-6 ${metric.color}`} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold">{metric.value}</div>
                <div className="text-sm font-medium text-gray-900">{metric.label}</div>
                <div className="text-xs text-gray-500">{metric.description}</div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-3"
                  onClick={metric.onClick}
                >
                  {metric.action}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Recent Activity</h3>
          <Button variant="ghost" size="sm" onClick={() => onNavigate("activity")}>
            View All
          </Button>
        </div>
        <div className="space-y-3">
          {recentActivity.map((activity, index) => (
            <div key={index} className="flex items-center justify-between py-3 border-b last:border-b-0">
              <div className="flex items-center gap-3">
                <Badge
                  variant={
                    activity.type === "approved"
                      ? "default"
                      : activity.type === "rejected"
                      ? "secondary"
                      : "outline"
                  }
                  className={
                    activity.type === "approved"
                      ? "bg-green-100 text-green-700 border-green-200"
                      : activity.type === "rejected"
                      ? "bg-red-100 text-red-700 border-red-200"
                      : ""
                  }
                >
                  {activity.type}
                </Badge>
                <div>
                  <div className="text-sm font-medium">{activity.entity}</div>
                  <div className="text-xs text-gray-500">
                    by {activity.reviewer} • {activity.time}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
