import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PODPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Proof of Delivery</h2>

      <Card>
        <CardHeader>
          <CardTitle>Delivery Confirmations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>No POD records</p>
            <p className="text-sm mt-2">Proof of delivery records will appear here after deliveries</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
