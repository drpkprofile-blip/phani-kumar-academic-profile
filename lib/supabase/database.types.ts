// Handwritten foundation types matching the migration. Regenerate from the
// connected database before implementing database-backed public reads.
export type PublicationRow = {
  id: number;
  title: string;
  year: string;
  journal: string;
  indexing: string[];
  doi: string | null;
  article_url: string | null;
  proof_url: string | null;
  publication_type: "Journal Article" | "Book Chapter" | "Conference Proceeding" | null;
  impact_factor: number | null;
  source_order: number | null;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type PublicationSettingsRow = {
  id: boolean;
  hero_publications: string;
  created_at: string;
  updated_at: string;
};

type Table<Row, Insert> = {
  Row: Row;
  Insert: Insert;
  Update: Partial<Insert>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      publications: Table<PublicationRow,
        Pick<PublicationRow, "title" | "year" | "journal" | "display_order"> &
        Partial<Omit<PublicationRow, "title" | "year" | "journal" | "display_order">>>;
      publication_settings: Table<PublicationSettingsRow,
        Pick<PublicationSettingsRow, "hero_publications"> &
        Partial<Omit<PublicationSettingsRow, "hero_publications">>>;
    };
    Views: { [key in never]: never };
    Functions: {
      is_publications_admin: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: { [key in never]: never };
    CompositeTypes: { [key in never]: never };
  };
};
