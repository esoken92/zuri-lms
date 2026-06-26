import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SchedulesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Access Schedules</h2>
        <Button>Add Schedule</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Time-Based Access Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>No access schedules configured</p>
            <p className="text-sm mt-2">Create schedules to limit badge access by time</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
