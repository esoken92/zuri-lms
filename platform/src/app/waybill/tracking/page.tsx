import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TrackingPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Shipment Tracking</h2>

      <Card>
        <CardHeader>
          <CardTitle>Active Shipments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>No shipments in transit</p>
            <p className="text-sm mt-2">Active shipments will appear here with tracking events</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
