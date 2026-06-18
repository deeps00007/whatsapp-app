"use client";

import { useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

type RealtimeEventType = "INSERT" | "UPDATE" | "DELETE";

export interface RealtimeTableEvent<T> {
  eventType: RealtimeEventType;
  new: T;
  old: Partial<T>;
}

interface UseRealtimeTableOptions<T> {
  table: string;
  filter?: string;
  channelName?: string;
  onEvent?: (event: RealtimeTableEvent<T>) => void;
  enabled?: boolean;
}

export function useRealtimeTable<T = Record<string, unknown>>({
  table,
  filter,
  channelName,
  onEvent,
  enabled = true,
}: UseRealtimeTableOptions<T>) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const onEventRef = useRef(onEvent);
  useEffect(() => {
    onEventRef.current = onEvent;
  });

  useEffect(() => {
    if (!enabled) return;

    const supabase = createClient();
    const name = channelName || `realtime:${table}${filter ? `:${filter}` : ""}`;

    const postgresConfig: {
      event: string;
      schema: string;
      table: string;
      filter?: string;
    } = {
      event: "*",
      schema: "public",
      table,
    };
    if (filter) postgresConfig.filter = filter;

    const channel = supabase
      .channel(name)
      .on("postgres_changes", postgresConfig as any, (payload: any) => {
        onEventRef.current?.({
          eventType: payload.eventType as RealtimeEventType,
          new: payload.new as T,
          old: payload.old as Partial<T>,
        });
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [table, filter, channelName, enabled]);

  const unsubscribe = useCallback(() => {
    if (channelRef.current) {
      const supabase = createClient();
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, []);

  return { unsubscribe };
}
