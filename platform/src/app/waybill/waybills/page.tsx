import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function WaybillsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Waybills</h2>
        <Button>Create Waybill</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Waybills</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>No waybills created</p>
            <p className="text-sm mt-2">Create your first waybill to start tracking shipments</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
