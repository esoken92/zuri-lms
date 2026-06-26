import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function TyreSyncPage() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/tyresync/reports">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle>Tyre Reports</CardTitle>
              <CardDescription>Inspection reports and damage tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">View and manage tyre inspection records</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/tyresync/fleet">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle>Fleet Vehicles</CardTitle>
              <CardDescription>Vehicle fleet management</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">Manage vehicles and tyre configurations</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/tyresync/inventory">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle>Tyre Inventory</CardTitle>
              <CardDescription>Tyre stock and tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">Track tyre stock, purchases, and usage</p>
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
              <p className="text-sm text-gray-600">Total Reports</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">0</p>
              <p className="text-sm text-gray-600">Active Vehicles</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">0</p>
              <p className="text-sm text-gray-600">Tyres in Stock</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-red-600">0</p>
              <p className="text-sm text-gray-600">Scrapped This Month</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
