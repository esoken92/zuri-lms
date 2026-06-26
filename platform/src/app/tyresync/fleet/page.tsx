import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function FleetPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Fleet Vehicles</h2>
        <Button>Add Vehicle</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vehicle Fleet</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>No vehicles registered</p>
            <p className="text-sm mt-2">Add your first vehicle to start tracking tyres</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
