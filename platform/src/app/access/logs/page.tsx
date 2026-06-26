import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AccessLogsPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Access Logs</h2>

      <Card>
        <CardHeader>
          <CardTitle>Entry/Exit History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>No access activity recorded</p>
            <p className="text-sm mt-2">Access logs will appear here as badges are used</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
