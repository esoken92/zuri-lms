import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AccessPage() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/access/zones">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle>Access Zones</CardTitle>
              <CardDescription>Physical zones and areas</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">Define and manage access zones</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/access/badges">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle>Access Badges</CardTitle>
              <CardDescription>Cards, fobs, and credentials</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">Issue and manage access badges</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/access/requests">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle>Access Requests</CardTitle>
              <CardDescription>Pending and approved requests</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">Review and approve access requests</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/access/logs">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle>Access Logs</CardTitle>
              <CardDescription>Entry and exit history</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">View access activity records</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/access/schedules">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle>Access Schedules</CardTitle>
              <CardDescription>Time-based access rules</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">Configure time-based access</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">0</p>
              <p className="text-sm text-gray-600">Active Zones</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">0</p>
              <p className="text-sm text-gray-600">Active Badges</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">0</p>
              <p className="text-sm text-gray-600">Pending Requests</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-red-600">0</p>
              <p className="text-sm text-gray-600">Denied Today</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
