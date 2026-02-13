"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Shield, Lock } from "lucide-react";

export function SecuritySettings() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-3">
        <Shield className="h-5 w-5" />
        <div>
          <CardTitle>Security</CardTitle>
          <CardDescription>
            Manage your account security settings
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Password</Label>
            <p className="text-sm text-muted-foreground">
              Change your account password
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/settings/change-password">
              <Lock className="mr-2 h-4 w-4" />
              Change Password
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
