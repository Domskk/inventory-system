'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '../lib/supabase'
import { Item } from '../types/item'
import { REALTIME_SUBSCRIBE_STATES } from '@supabase/supabase-js'

interface PostgresChangePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  schema: string;
  table: string;
  commit_timestamp: string;
  old?: Partial<Item>;
  new?: Partial<Item>;
}

export function useItems() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchItems = useCallback(async () => {
    const { data: itemsData, error } = await supabase
      .from('items')
      .select('*')
      .order('inserted_at', { ascending: false })

    if (error) {
      console.error('Failed to load items:', error)
    } else {
      const mappedItems: Item[] = (itemsData || []).map((row) => ({
        id: row.id,
        name: row.name,
        description: row.description ?? undefined,
        quantity: row.quantity ?? 0,
        price: row.price ?? undefined,
        image_url: row.image_url ?? undefined,
        inserted_at: row.inserted_at ?? new Date().toISOString(),
      }))
      setItems(mappedItems)
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  useEffect(() => {
    const channel = supabase.channel('items-realtime')

    channel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'items',
        },
        (payload: PostgresChangePayload) => {
          const newItem = payload.new
          const oldItem = payload.old

          if (payload.eventType === 'INSERT') {
            const mappedNewItem: Item = {
              id: newItem?.id ?? '',
              name: newItem?.name ?? '',
              description: newItem?.description ?? undefined,
              quantity: newItem?.quantity ?? 0,
              price: newItem?.price ?? undefined,
              image_url: newItem?.image_url ?? undefined,
              inserted_at: newItem?.inserted_at ?? new Date().toISOString(),
            }
            setItems((prev) => [...prev, mappedNewItem])
          } else if (payload.eventType === 'UPDATE') {
            const mappedNewItem: Item = {
              id: newItem?.id ?? '',
              name: newItem?.name ?? '',
              description: newItem?.description ?? undefined,
              quantity: newItem?.quantity ?? 0,
              price: newItem?.price ?? undefined,
              image_url: newItem?.image_url ?? undefined,
              inserted_at: newItem?.inserted_at ?? new Date().toISOString(),
            }
            setItems((prev) => prev.map((item) =>
              item.id === mappedNewItem.id ? mappedNewItem : item
            ))
          } else if (payload.eventType === 'DELETE') {
            setItems((prev) => prev.filter((item) => item.id !== oldItem?.id))
          }
        }
      )
      .subscribe((status: REALTIME_SUBSCRIBE_STATES) => {
        if (status === 'CHANNEL_ERROR') {
          console.error('Subscription error')
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const updateItem = useCallback(async (id: string, updates: Partial<Item>) => {
    const { error } = await supabase
      .from('items')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      console.error('Update error:', error)
      return false
    }
    return true
  }, [supabase])

  const deleteItem = useCallback(async (id: string) => {
    const { error } = await supabase.from('items').delete().eq('id', id)
    if (error) {
      console.error('Delete error:', error)
      return false
    }
    return true
  }, [supabase])

  return { items, loading, refetch: fetchItems, updateItem, deleteItem }
}