import type { MetadataRoute } from "next";
import { listCapsules } from "@/lib/capsules";
import { SITE_URL } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/new`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];

  let capsules: MetadataRoute.Sitemap = [];
  try {
    const rows = await listCapsules();
    capsules = rows.map((capsule) => ({
      url: `${SITE_URL}/capsule/${capsule.id}`,
      lastModified: new Date(capsule.createdAt),
      changeFrequency: "weekly",
      priority: 0.6,
    }));
  } catch (error) {
    console.error(error);
  }

  return [...staticRoutes, ...capsules];
}
