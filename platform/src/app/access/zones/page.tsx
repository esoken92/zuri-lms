import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ZonesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Access Zones</h2>
        <Button>Add Zone</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Defined Zones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>No access zones defined</p>
            <p className="text-sm mt-2">Create zones to control physical access</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
