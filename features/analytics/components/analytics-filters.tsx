"use client";

import * as React from "react";
import { Calendar, RefreshCw, Filter, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface AnalyticsFiltersProps {
  onFilterChange: (filters: FilterState) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export interface FilterState {
  period: "day" | "week" | "month";
  range: 7 | 30 | 90 | 365;
  trendPeriod: "week" | "month";
  customStartDate?: string;
  customEndDate?: string;
}

const PERIODS = [
  { value: "day", label: "Daily" },
  { value: "week", label: "Weekly" },
  { value: "month", label: "Monthly" },
] as const;

const RANGES = [
  { value: 7, label: "Last 7 days" },
  { value: 30, label: "Last 30 days" },
  { value: 90, label: "Last 90 days" },
  { value: 365, label: "Last year" },
] as const;

const TREND_PERIODS = [
  { value: "week", label: "Week over Week" },
  { value: "month", label: "Month over Month" },
] as const;

export function AnalyticsFilters({
  onFilterChange,
  onRefresh,
  isLoading,
}: AnalyticsFiltersProps) {
  const [filters, setFilters] = React.useState<FilterState>({
    period: "week",
    range: 30,
    trendPeriod: "week",
  });

  const [isExpanded, setIsExpanded] = React.useState(true);
  const [dateMode, setDateMode] = React.useState<"quick" | "custom">("quick");

  const handleFilterChange = (
    key: keyof FilterState,
    value: string | number | undefined,
  ) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleDateModeChange = (mode: "quick" | "custom") => {
    setDateMode(mode);
    if (mode === "quick") {
      // Clear custom dates when switching to quick select
      const newFilters = {
        ...filters,
        customStartDate: undefined,
        customEndDate: undefined,
      };
      setFilters(newFilters);
      onFilterChange(newFilters);
    }
  };

  const handleCustomDateChange = (
    key: "customStartDate" | "customEndDate",
    value: string,
  ) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="justify-between w-full"
          aria-label={isExpanded ? "Collapse filters" : "Expand filters"}
        >
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters</span>
          </div>
          <ChevronUp
            className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? "" : "rotate-180"}`}
          />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="pt-3 space-y-3">
          {/* Date Mode Toggle */}
          <div className="flex items-center gap-2 pb-2 border-b">
            <Button
              variant={dateMode === "quick" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => handleDateModeChange("quick")}
              className="gap-1"
            >
              <CalendarDays className="h-4 w-4" />
              Quick Select
            </Button>
            <Button
              variant={dateMode === "custom" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => handleDateModeChange("custom")}
              className="gap-1"
            >
              <Calendar className="h-4 w-4" />
              Custom Range
            </Button>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {/* Period Select */}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                <Select
                  value={filters.period}
                  onValueChange={(value) => handleFilterChange("period", value)}
                >
                  <SelectTrigger className="w-[110px] sm:w-[120px] touch-target min-h-[44px]">
                    <SelectValue placeholder="Period" />
                  </SelectTrigger>
                  <SelectContent>
                    {PERIODS.map((period) => (
                      <SelectItem
                        key={period.value}
                        value={period.value}
                        className="touch-target min-h-[44px]"
                      >
                        {period.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {dateMode === "quick" ? (
                /* Quick Select Range */
                <Select
                  value={filters.range.toString()}
                  onValueChange={(value) =>
                    handleFilterChange("range", parseInt(value))
                  }
                >
                  <SelectTrigger className="w-[130px] sm:w-[140px] touch-target min-h-[44px]">
                    <SelectValue placeholder="Date range" />
                  </SelectTrigger>
                  <SelectContent>
                    {RANGES.map((range) => (
                      <SelectItem
                        key={range.value}
                        value={range.value.toString()}
                        className="touch-target min-h-[44px]"
                      >
                        {range.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                /* Custom Date Range */
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={filters.customStartDate ?? ""}
                    onChange={(e) =>
                      handleCustomDateChange("customStartDate", e.target.value)
                    }
                    className="w-[140px] touch-target"
                    placeholder="Start date"
                  />
                  <span className="text-muted-foreground">to</span>
                  <Input
                    type="date"
                    value={filters.customEndDate ?? ""}
                    onChange={(e) =>
                      handleCustomDateChange("customEndDate", e.target.value)
                    }
                    className="w-[140px] touch-target"
                    placeholder="End date"
                  />
                </div>
              )}

              {/* Trend Period Select */}
              <Select
                value={filters.trendPeriod}
                onValueChange={(value) =>
                  handleFilterChange("trendPeriod", value)
                }
              >
                <SelectTrigger className="w-[150px] sm:w-[160px] touch-target min-h-[44px]">
                  <SelectValue placeholder="Compare with" />
                </SelectTrigger>
                <SelectContent>
                  {TREND_PERIODS.map((period) => (
                    <SelectItem
                      key={period.value}
                      value={period.value}
                      className="touch-target min-h-[44px]"
                    >
                      {period.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Refresh Button */}
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={isLoading}
                className="touch-target min-h-[44px] px-4 w-full sm:w-auto"
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            )}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
