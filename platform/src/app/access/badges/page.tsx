import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function BadgesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Access Badges</h2>
        <Button>Issue Badge</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Issued Badges</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>No badges issued</p>
            <p className="text-sm mt-2">Issue access badges to personnel</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
