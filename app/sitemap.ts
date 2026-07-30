import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://orcred.com";

  return [
    { url: `${base}/`,                  lastModified: new Date(), changeFrequency: "weekly",  priority: 1.0 },
    { url: `${base}/how-it-works`,      lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/join-waitlist`,   lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/get-verified`,      lastModified: new Date(), changeFrequency: "monthly", priority: 0.85 },
    { url: `${base}/about-us`,          lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/become-a-reviewer`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/contact`,           lastModified: new Date(), changeFrequency: "yearly",  priority: 0.5 },
    { url: `${base}/privacy`,           lastModified: new Date(), changeFrequency: "yearly",  priority: 0.3 },
    { url: `${base}/terms`,             lastModified: new Date(), changeFrequency: "yearly",  priority: 0.3 },
  ];
}
