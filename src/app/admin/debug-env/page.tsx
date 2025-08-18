
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle, XCircle } from "lucide-react";

export default function DebugEnvPage() {
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

    const isClientEmailSet = !!clientEmail;
    const isPrivateKeySet = !!privateKey;

    return (
        <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-6">Server Environment Variable Check</h1>
            <p className="mb-6 text-muted-foreground">
                This page checks if the server environment variables required for Firebase Admin SDK are being read correctly.
                This is a temporary debugging tool and should be removed after the issue is resolved.
                The actual values of the keys are not displayed for security reasons.
            </p>
            <Card>
                <CardHeader>
                    <CardTitle>Variable Status</CardTitle>
                    <CardDescription>
                        The status of the required secret environment variables on the server.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                            {isClientEmailSet ? <CheckCircle className="h-6 w-6 text-green-500" /> : <XCircle className="h-6 w-6 text-red-500" />}
                            <div>
                                <p className="font-mono text-sm font-medium">FIREBASE_ADMIN_CLIENT_EMAIL</p>
                                <p className="text-xs text-muted-foreground">The service account email address.</p>
                            </div>
                        </div>
                        <p className={`font-bold ${isClientEmailSet ? 'text-green-600' : 'text-red-600'}`}>
                            {isClientEmailSet ? 'Loaded Successfully' : 'NOT FOUND'}
                        </p>
                    </div>
                     <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                             {isPrivateKeySet ? <CheckCircle className="h-6 w-6 text-green-500" /> : <XCircle className="h-6 w-6 text-red-500" />}
                            <div>
                                <p className="font-mono text-sm font-medium">FIREBASE_ADMIN_PRIVATE_KEY</p>
                                 <p className="text-xs text-muted-foreground">The private key for the service account.</p>
                            </div>
                        </div>
                        <p className={`font-bold ${isPrivateKeySet ? 'text-green-600' : 'text-red-600'}`}>
                           {isPrivateKeySet ? 'Loaded Successfully' : 'NOT FOUND'}
                        </p>
                    </div>
                </CardContent>
            </Card>

            {(!isClientEmailSet || !isPrivateKeySet) && (
                <div className="mt-6 p-4 rounded-md bg-destructive/10 text-destructive border border-destructive/50">
                    <h3 className="font-bold">Action Required</h3>
                    <p className="text-sm mt-1">
                        One or more server-side environment variables were not found. Please ensure that you have created a `.env.local` file in the root of your project and have correctly added the `FIREBASE_ADMIN_CLIENT_EMAIL` and `FIREBASE_ADMIN_PRIVATE_KEY` values.
                        After adding them, you must **restart your development server** for the changes to take effect.
                    </p>
                </div>
            )}
        </div>
    );
}
