import "server-only";

import { profile as referenceProfile, type AcademicIdentity, type ProfileLink } from "../data/profile";
import { counters } from "../data/counters";
import { pageLinks } from "../data/page-content";
import { createClient } from "./supabase/server";
import type { Database, Json } from "./supabase/database.types";

export type ManagedProfile = {
  name: string; firstName: string; lastName: string; qualifications: string;
  designation: string; department: string; institution: string; profileLabel: string;
  description: string; email: string; phone: string; address: string; photo: string;
  citationsImageUrl: string;
  googleScholarMetrics: { citationsText: string; hIndexText: string; i10IndexText: string };
  academicIdentity: AcademicIdentity[]; profileLinks: ProfileLink[];
  youtubeChannel: { title: string; href: string; image: string };
  technicalTools: string[]; skills: string[]; researchInterests: string[];
};

type ProfileSettingsRow = Database["public"]["Tables"]["profile_settings"]["Row"];

export type PublicProfileSettings = {
  profile: ManagedProfile;
  experienceCounterText: string;
};

const referenceManagedProfile: ManagedProfile = {
  ...(referenceProfile as unknown as ManagedProfile),
  citationsImageUrl: pageLinks.citationsImage,
};

function jsonArray<T>(value: Json, fallback: T[]): T[] {
  return Array.isArray(value) ? value as T[] : fallback;
}

function mapProfileSettings(row: ProfileSettingsRow): PublicProfileSettings {
  const youtube = row.youtube_channel;
  const youtubeChannel = !Array.isArray(youtube) && youtube !== null && typeof youtube === "object"
    ? youtube as { title?: string; href?: string; image?: string }
    : {};

  return {
    profile: {
      name: row.name,
      firstName: row.first_name,
      lastName: row.last_name,
      qualifications: row.qualifications,
      designation: row.designation,
      department: row.department,
      institution: row.institution,
      profileLabel: row.profile_label,
      description: row.description,
      email: row.email,
      phone: row.phone,
      address: referenceProfile.address,
      photo: row.photo_url,
      citationsImageUrl: row.citations_image_url,
      googleScholarMetrics: {
        citationsText: row.google_scholar_citations_text,
        hIndexText: row.google_scholar_h_index_text,
        i10IndexText: row.google_scholar_i10_index_text,
      },
      academicIdentity: jsonArray<AcademicIdentity>(row.academic_identity, [...referenceProfile.academicIdentity]),
      profileLinks: jsonArray<ProfileLink>(row.profile_links, [...referenceProfile.profileLinks]),
      youtubeChannel: {
        title: youtubeChannel.title ?? referenceProfile.youtubeChannel.title,
        href: youtubeChannel.href ?? referenceProfile.youtubeChannel.href,
        image: youtubeChannel.image ?? referenceProfile.youtubeChannel.image,
      },
      technicalTools: jsonArray<string>(row.technical_tools, [...referenceProfile.technicalTools]),
      skills: jsonArray<string>(row.skills, [...referenceProfile.skills]),
      researchInterests: jsonArray<string>(row.research_interests, [...referenceProfile.researchInterests]),
    },
    experienceCounterText: row.experience_counter_text,
  };
}

export async function getPublicProfileSettings(): Promise<PublicProfileSettings> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    return {
      profile: referenceManagedProfile,
      experienceCounterText: counters.experienceYears,
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profile_settings")
    .select("*")
    .eq("singleton", true)
    .single();
  if (error?.code === "PGRST205" || error?.code === "42P01") {
    return {
      profile: referenceManagedProfile,
      experienceCounterText: counters.experienceYears,
    };
  }
  if (error || !data) throw new Error("Unable to read public profile settings from Supabase");
  return mapProfileSettings(data);
}

export function mapProfileSettingsRow(row: ProfileSettingsRow): PublicProfileSettings {
  return mapProfileSettings(row);
}
