import { Card } from "@/app/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Switch } from "@/app/components/ui/switch";
import { Badge } from "@/app/components/ui/badge";
import { Trash2, UserPlus } from "lucide-react";

export function Settings() {
  const teamMembers = [
    { name: "You (Sarah Chen)", email: "sarah@example.edu", role: "admin" },
    { name: "Marcus Rodriguez", email: "marcus@example.edu", role: "member" },
    { name: "Emily Johnson", email: "emily@example.edu", role: "member" },
  ];

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold mb-2">Settings</h2>
        <p className="text-gray-600">
          Manage team and personal preferences
        </p>
      </div>

      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="personal">Personal Settings</TabsTrigger>
          <TabsTrigger value="team">Team Settings</TabsTrigger>
        </TabsList>

        {/* Personal Settings */}
        <TabsContent value="personal" className="space-y-6 mt-6">
          {/* Profile */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Profile</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Display Name</Label>
                <Input id="name" defaultValue="Sarah Chen" className="mt-2" />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  defaultValue="sarah@example.edu"
                  className="mt-2"
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">
                  Email cannot be changed
                </p>
              </div>
            </div>
          </Card>

          {/* Notification Preferences */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Notifications</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>New Extractions Available</Label>
                  <p className="text-sm text-gray-500">
                    Get notified when new batches are ready for review
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Claim Expiring Soon</Label>
                  <p className="text-sm text-gray-500">
                    Alert me 30 minutes before my claims expire
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Daily Summary Email</Label>
                  <p className="text-sm text-gray-500">
                    Receive a daily digest of team activity
                  </p>
                </div>
                <Switch />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Team Mentions</Label>
                  <p className="text-sm text-gray-500">
                    Notify me when someone mentions me in review notes
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </Card>

          {/* Display Preferences */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Display</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Contextual Help</Label>
                  <p className="text-sm text-gray-500">
                    Display inline explanations and tooltips
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Reduce Motion</Label>
                  <p className="text-sm text-gray-500">
                    Minimize animations and transitions
                  </p>
                </div>
                <Switch />
              </div>
            </div>
          </Card>

          <div className="flex justify-end">
            <Button>Save Changes</Button>
          </div>
        </TabsContent>

        {/* Team Settings */}
        <TabsContent value="team" className="space-y-6 mt-6">
          {/* Team Info */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Team Information</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="team-name">Team Name</Label>
                <Input
                  id="team-name"
                  defaultValue="CubeSat Lab - Stanford"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="organization">Organization</Label>
                <Input
                  id="organization"
                  defaultValue="Stanford University"
                  className="mt-2"
                />
              </div>
            </div>
          </Card>

          {/* Team Members */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Team Members</h3>
              <Button size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Member
              </Button>
            </div>

            <div className="space-y-3">
              {teamMembers.map((member, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium">{member.name}</div>
                      <div className="text-sm text-gray-500">{member.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={member.role === "admin" ? "default" : "secondary"}
                    >
                      {member.role}
                    </Badge>
                    {!member.name.startsWith("You") && (
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Review Settings */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Review Settings</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="claim-timeout">Claim Timeout (minutes)</Label>
                <Input
                  id="claim-timeout"
                  type="number"
                  defaultValue="120"
                  className="mt-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Claims will auto-release after this time period
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require Rejection Reason</Label>
                  <p className="text-sm text-gray-500">
                    Reviewers must provide notes when rejecting
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Bulk Actions</Label>
                  <p className="text-sm text-gray-500">
                    Allow approval/rejection of multiple items at once
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </Card>

          <div className="flex justify-end">
            <Button>Save Team Settings</Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
