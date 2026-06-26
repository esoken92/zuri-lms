import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function GatePassPage() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/gatepass/passes">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle>Gate Passes</CardTitle>
              <CardDescription>Visitor and vehicle passes</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">Issue and manage gate passes</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/gatepass/logs">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle>Gate Logs</CardTitle>
              <CardDescription>Entry and exit records</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">View gate activity history</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/gatepass/pre-approved">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle>Pre-Approved Visitors</CardTitle>
              <CardDescription>Authorized visitor list</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">Manage pre-approved visitors</p>
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
              <p className="text-sm text-gray-600">Active Passes</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">0</p>
              <p className="text-sm text-gray-600">Entries Today</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">0</p>
              <p className="text-sm text-gray-600">Pre-Approved</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-red-600">0</p>
              <p className="text-sm text-gray-600">Pending Approval</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
