import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function InventoryPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Tyre Inventory</h2>
        <Button>Add Tyre</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tyre Stock</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>No tyres in inventory</p>
            <p className="text-sm mt-2">Add tyres to track purchases and usage</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
