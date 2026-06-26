import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TyreReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Tyre Reports</h2>
        <Button>New Report</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Inspections</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>No tyre reports yet</p>
            <p className="text-sm mt-2">Create your first inspection report to get started</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
