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
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Bell, User, Calendar, Mail } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="p-0">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        <Separator />

        {/* Profile Settings */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <User className="h-5 w-5" />
            <div>
              <CardTitle>Profile</CardTitle>
              <CardDescription>
                Update your personal information
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" placeholder="John" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" placeholder="Doe" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="john@example.com" />
            </div>
            <Button>Save Changes</Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <Bell className="h-5 w-5" />
            <div>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                Configure how you receive notifications
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive appointment reminders via email
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Browser Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Show push notifications in your browser
                </p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Appointment Reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Get reminded before scheduled appointments
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Appointment Settings */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <Calendar className="h-5 w-5" />
            <div>
              <CardTitle>Appointments</CardTitle>
              <CardDescription>
                Default settings for new appointments
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="defaultDuration">
                Default Duration (minutes)
              </Label>
              <Input id="defaultDuration" type="number" defaultValue="30" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bufferTime">
                Buffer Between Appointments (minutes)
              </Label>
              <Input id="bufferTime" type="number" defaultValue="5" />
            </div>
            <Button>Save Appointment Settings</Button>
          </CardContent>
        </Card>

        {/* Email Settings */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <Mail className="h-5 w-5" />
            <div>
              <CardTitle>Email Preferences</CardTitle>
              <CardDescription>
                Customize email content and frequency
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Confirmation Emails</Label>
                <p className="text-sm text-muted-foreground">
                  Receive email when appointment is confirmed
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Cancellation Emails</Label>
                <p className="text-sm text-muted-foreground">
                  Receive email when appointment is cancelled
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Weekly Summary</Label>
                <p className="text-sm text-muted-foreground">
                  Get a weekly summary of your appointments
                </p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>
              Irreversible actions for your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive">Delete Account</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
