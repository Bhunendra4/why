import { useQuery } from "@tanstack/react-query";
import { useActor } from "./useActor";

export function useGetImage() {
  const { actor, isFetching } = useActor();
  return useQuery<string | null>({
    queryKey: ["image"],
    queryFn: async () => {
      if (!actor) return null;
      const blob = await actor.getImage();
      if (!blob) return null;
      return blob.getDirectURL();
    },
    enabled: !!actor && !isFetching,
  });
}
