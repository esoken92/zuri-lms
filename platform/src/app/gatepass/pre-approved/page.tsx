import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PreApprovedPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Pre-Approved Visitors</h2>
        <Button>Add Visitor</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Authorized Visitors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>No pre-approved visitors</p>
            <p className="text-sm mt-2">Add visitors who have regular access to your site</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
