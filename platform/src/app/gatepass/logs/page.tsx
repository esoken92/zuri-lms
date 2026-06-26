import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function GateLogsPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Gate Logs</h2>

      <Card>
        <CardHeader>
          <CardTitle>Entry/Exit History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>No gate activity recorded</p>
            <p className="text-sm mt-2">Gate logs will appear here as visitors enter and exit</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
