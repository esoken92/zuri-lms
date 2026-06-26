import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RequestsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Access Requests</h2>
        <Button>New Request</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>No pending access requests</p>
            <p className="text-sm mt-2">Access requests will appear here for approval</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
