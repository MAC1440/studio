
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';

export default function CreateInvoicePage() {
  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Create Invoice</h1>
      <Card>
        <CardHeader>
          <CardTitle>Invoice Details</CardTitle>
        </CardHeader>
        <CardContent>
           <div className="flex flex-col items-center justify-center h-48 text-center border-2 border-dashed rounded-lg">
                <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold">Invoice Form Coming Soon</h3>
                <p className="text-muted-foreground">This is where the form to create a new invoice will be.</p>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
