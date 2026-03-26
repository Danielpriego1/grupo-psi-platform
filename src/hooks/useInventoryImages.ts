import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

let cache: Record<string, string> | null = null;
let fetching = false;
let listeners: Array<() => void> = [];

async function fetchImages() {
  if (cache || fetching) return;
  fetching = true;
  const { data } = await supabase
    .from("inventory")
    .select("product_id, image_url")
    .not("image_url", "is", null);
  const map: Record<string, string> = {};
  data?.forEach((row: any) => {
    if (row.image_url) map[row.product_id] = row.image_url;
  });
  cache = map;
  fetching = false;
  listeners.forEach((l) => l());
}

export function useInventoryImages(): Record<string, string> {
  const [images, setImages] = useState<Record<string, string>>(cache ?? {});

  useEffect(() => {
    if (cache) {
      setImages(cache);
      return;
    }
    const listener = () => setImages(cache ?? {});
    listeners.push(listener);
    fetchImages();
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }, []);

  return images;
}
