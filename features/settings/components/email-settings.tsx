"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Mail } from "lucide-react";

export function EmailSettings() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-3">
        <Mail className="h-5 w-5" />
        <div>
          <CardTitle>Email Preferences</CardTitle>
          <CardDescription>
            Configure your email notification preferences
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Marketing Emails</Label>
            <p className="text-sm text-muted-foreground">
              Receive updates about new features
            </p>
          </div>
          <Switch defaultChecked />
        </div>
      </CardContent>
    </Card>
  );
}
