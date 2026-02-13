"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Loader2 } from "lucide-react";

interface ProfileSettingsProps {
  fullName: string;
  email: string;
  isLoadingSession: boolean;
  isSavingProfile: boolean;
  onFullNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onSave: () => void;
}

export function ProfileSettings({
  fullName,
  email,
  isLoadingSession,
  isSavingProfile,
  onFullNameChange,
  onEmailChange,
  onSave,
}: ProfileSettingsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-3">
        <User className="h-5 w-5" />
        <div>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your personal information</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            placeholder="John Doe"
            value={fullName}
            onChange={(e) => onFullNameChange(e.target.value)}
            disabled={isLoadingSession}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="john@example.com"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            disabled={isLoadingSession}
          />
        </div>
        <Button onClick={onSave} disabled={isLoadingSession || isSavingProfile}>
          {isSavingProfile ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
