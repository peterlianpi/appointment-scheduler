"use client";

import * as React from "react";
import { Calendar, RefreshCw, Filter } from "lucide-react";
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

interface AnalyticsFiltersProps {
  onFilterChange: (filters: FilterState) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export interface FilterState {
  period: "day" | "week" | "month";
  range: 30 | 90 | 365;
  trendPeriod: "week" | "month";
}

const PERIODS = [
  { value: "day", label: "Daily" },
  { value: "week", label: "Weekly" },
  { value: "month", label: "Monthly" },
] as const;

const RANGES = [
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

  const handleFilterChange = (
    key: keyof FilterState,
    value: string | number,
  ) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <CollapsibleTrigger asChild>
        <button
          className="flex items-center justify-between w-full p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors touch-target"
          aria-label={isExpanded ? "Collapse filters" : "Expand filters"}
        >
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters</span>
          </div>
          <ChevronUp
            className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? "" : "rotate-180"}`}
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="pt-3 space-y-3">
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

              {/* Range Select */}
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
