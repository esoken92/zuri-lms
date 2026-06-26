import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function WaybillPage() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/waybill/waybills">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle>Waybills</CardTitle>
              <CardDescription>Shipping waybills</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">Create and manage waybills</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/waybill/tracking">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle>Tracking</CardTitle>
              <CardDescription>Real-time shipment tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">Track shipments in transit</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/waybill/pod">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle>Proof of Delivery</CardTitle>
              <CardDescription>Delivery confirmations</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">View POD records and signatures</p>
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
              <p className="text-sm text-gray-600">In Transit</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">0</p>
              <p className="text-sm text-gray-600">Delivered Today</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">0</p>
              <p className="text-sm text-gray-600">Pending POD</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-red-600">0</p>
              <p className="text-sm text-gray-600">Delayed</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
