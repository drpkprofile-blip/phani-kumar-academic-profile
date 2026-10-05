export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          created_at: string
          description: string
          display_order: number
          extra_proof_url: string | null
          id: number
          proof_url: string | null
          source_order: number | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          display_order: number
          extra_proof_url?: string | null
          id?: number
          proof_url?: string | null
          source_order?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          display_order?: number
          extra_proof_url?: string | null
          id?: number
          proof_url?: string | null
          source_order?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      peer_reviews: {
        Row: {
          created_at: string
          display_order: number
          id: number
          review_text: string
          source_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order: number
          id?: number
          review_text: string
          source_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: number
          review_text?: string
          source_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      peer_review_settings: {
        Row: {
          completed_reviews_count: number
          created_at: string
          hero_counter_text: string
          singleton: boolean
          updated_at: string
        }
        Insert: {
          completed_reviews_count: number
          created_at?: string
          hero_counter_text: string
          singleton?: boolean
          updated_at?: string
        }
        Update: {
          completed_reviews_count?: number
          created_at?: string
          hero_counter_text?: string
          singleton?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      profile_settings: {
        Row: {
          academic_identity: Json
          citations_image_url: string
          google_scholar_citations_text: string
          google_scholar_h_index_text: string
          google_scholar_i10_index_text: string
          created_at: string
          department: string
          description: string
          designation: string
          email: string
          experience_counter_text: string
          first_name: string
          institution: string
          last_name: string
          name: string
          phone: string
          photo_url: string
          profile_label: string
          profile_links: Json
          qualifications: string
          research_interests: Json
          singleton: boolean
          skills: Json
          technical_tools: Json
          updated_at: string
          youtube_channel: Json
        }
        Insert: {
          academic_identity: Json
          citations_image_url?: string
          google_scholar_citations_text?: string
          google_scholar_h_index_text?: string
          google_scholar_i10_index_text?: string
          created_at?: string
          department: string
          description: string
          designation: string
          email: string
          experience_counter_text: string
          first_name: string
          institution: string
          last_name: string
          name: string
          phone: string
          photo_url: string
          profile_label: string
          profile_links: Json
          qualifications: string
          research_interests: Json
          singleton?: boolean
          skills: Json
          technical_tools: Json
          updated_at?: string
          youtube_channel: Json
        }
        Update: {
          academic_identity?: Json
          citations_image_url?: string
          google_scholar_citations_text?: string
          google_scholar_h_index_text?: string
          google_scholar_i10_index_text?: string
          created_at?: string
          department?: string
          description?: string
          designation?: string
          email?: string
          experience_counter_text?: string
          first_name?: string
          institution?: string
          last_name?: string
          name?: string
          phone?: string
          photo_url?: string
          profile_label?: string
          profile_links?: Json
          qualifications?: string
          research_interests?: Json
          singleton?: boolean
          skills?: Json
          technical_tools?: Json
          updated_at?: string
          youtube_channel?: Json
        }
        Relationships: []
      }
      professional_memberships: {
        Row: {
          chapter: string | null
          created_at: string
          date_text: string | null
          designation: string | null
          display_order: number
          id: number
          membership_number: string | null
          membership_type: string | null
          organization_name: string
          proof_url: string | null
          source_order: number | null
          updated_at: string
          validity_text: string | null
        }
        Insert: {
          chapter?: string | null
          created_at?: string
          date_text?: string | null
          designation?: string | null
          display_order: number
          id?: number
          membership_number?: string | null
          membership_type?: string | null
          organization_name: string
          proof_url?: string | null
          source_order?: number | null
          updated_at?: string
          validity_text?: string | null
        }
        Update: {
          chapter?: string | null
          created_at?: string
          date_text?: string | null
          designation?: string | null
          display_order?: number
          id?: number
          membership_number?: string | null
          membership_type?: string | null
          organization_name?: string
          proof_url?: string | null
          source_order?: number | null
          updated_at?: string
          validity_text?: string | null
        }
        Relationships: []
      }
      subjects_taught: {
        Row: {
          academic_year: string | null
          branch: string | null
          course_code: string | null
          created_at: string
          display_order: number
          id: number
          program: string | null
          proof_url: string | null
          semester: string | null
          source_order: number | null
          subject_name: string
          subject_type: string | null
          updated_at: string
        }
        Insert: {
          academic_year?: string | null
          branch?: string | null
          course_code?: string | null
          created_at?: string
          display_order: number
          id?: number
          program?: string | null
          proof_url?: string | null
          semester?: string | null
          source_order?: number | null
          subject_name: string
          subject_type?: string | null
          updated_at?: string
        }
        Update: {
          academic_year?: string | null
          branch?: string | null
          course_code?: string | null
          created_at?: string
          display_order?: number
          id?: number
          program?: string | null
          proof_url?: string | null
          semester?: string | null
          source_order?: number | null
          subject_name?: string
          subject_type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      projects_guided: {
        Row: {
          academic_year: string | null
          batch: string | null
          branch: string | null
          co_guide_names: string[] | null
          created_at: string
          degree_program: string | null
          display_order: number
          guide_name: string | null
          id: number
          project_level: string | null
          project_title: string
          proof_url: string | null
          source_order: number | null
          student_names: string[] | null
          updated_at: string
        }
        Insert: {
          academic_year?: string | null
          batch?: string | null
          branch?: string | null
          co_guide_names?: string[] | null
          created_at?: string
          degree_program?: string | null
          display_order: number
          guide_name?: string | null
          id?: number
          project_level?: string | null
          project_title: string
          proof_url?: string | null
          source_order?: number | null
          student_names?: string[] | null
          updated_at?: string
        }
        Update: {
          academic_year?: string | null
          batch?: string | null
          branch?: string | null
          co_guide_names?: string[] | null
          created_at?: string
          degree_program?: string | null
          display_order?: number
          guide_name?: string | null
          id?: number
          project_level?: string | null
          project_title?: string
          proof_url?: string | null
          source_order?: number | null
          student_names?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      activities: {
        Row: {
          activity_type: string
          created_at: string
          date_text: string | null
          details: string | null
          display_order: number
          duration_text: string | null
          id: number
          institution: string
          proof_url: string | null
          source_order: number | null
          title: string
          updated_at: string
          year: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          date_text?: string | null
          details?: string | null
          display_order: number
          duration_text?: string | null
          id?: number
          institution: string
          proof_url?: string | null
          source_order?: number | null
          title: string
          updated_at?: string
          year: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          date_text?: string | null
          details?: string | null
          display_order?: number
          duration_text?: string | null
          id?: number
          institution?: string
          proof_url?: string | null
          source_order?: number | null
          title?: string
          updated_at?: string
          year?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_activity_type_fkey"
            columns: ["activity_type"]
            isOneToOne: false
            referencedRelation: "activity_categories"
            referencedColumns: ["label"]
          },
        ]
      }
      certifications: {
        Row: {
          certificate_url: string | null
          created_at: string
          display_order: number
          fdp_url: string | null
          id: number
          source_order: number | null
          title: string
          updated_at: string
        }
        Insert: {
          certificate_url?: string | null
          created_at?: string
          display_order: number
          fdp_url?: string | null
          id?: number
          source_order?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          certificate_url?: string | null
          created_at?: string
          display_order?: number
          fdp_url?: string | null
          id?: number
          source_order?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      activity_categories: {
        Row: {
          created_at: string
          display_order: number
          label: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order: number
          label: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          label?: string
          updated_at?: string
        }
        Relationships: []
      }
      publication_settings: {
        Row: {
          created_at: string
          hero_publications: string
          id: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          hero_publications: string
          id?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          hero_publications?: string
          id?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      publications: {
        Row: {
          article_url: string | null
          created_at: string
          display_order: number
          doi: string | null
          id: number
          impact_factor: number | null
          indexing: string[]
          journal: string
          proof_url: string | null
          publication_type: string | null
          source_order: number | null
          title: string
          updated_at: string
          year: string
        }
        Insert: {
          article_url?: string | null
          created_at?: string
          display_order: number
          doi?: string | null
          id?: number
          impact_factor?: number | null
          indexing?: string[]
          journal: string
          proof_url?: string | null
          publication_type?: string | null
          source_order?: number | null
          title: string
          updated_at?: string
          year: string
        }
        Update: {
          article_url?: string | null
          created_at?: string
          display_order?: number
          doi?: string | null
          id?: number
          impact_factor?: number | null
          indexing?: string[]
          journal?: string
          proof_url?: string | null
          publication_type?: string | null
          source_order?: number | null
          title?: string
          updated_at?: string
          year?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_save_activity: {
        Args: { p_id?: number; p_activity?: Json; p_expected_updated_at?: string }
        Returns: number
      }
      admin_delete_activity: {
        Args: { p_id: number; p_expected_updated_at: string; p_confirmed: boolean }
        Returns: number
      }
      admin_move_activity: {
        Args: { p_id: number; p_year: string; p_position: number; p_expected_order: number[] }
        Returns: undefined
      }
      admin_delete_publication: {
        Args: {
          p_confirmed: boolean
          p_expected_updated_at: string
          p_id: number
        }
        Returns: number
      }
      admin_move_publication: {
        Args: { p_expected_order: number[]; p_id: number; p_position: number }
        Returns: undefined
      }
      admin_save_certification: {
        Args: { p_certification?: Json; p_expected_updated_at?: string; p_id?: number }
        Returns: number
      }
      admin_delete_certification: {
        Args: { p_confirmed: boolean; p_expected_updated_at: string; p_id: number }
        Returns: number
      }
      admin_save_achievement: {
        Args: { p_achievement?: Json; p_expected_updated_at?: string; p_id?: number }
        Returns: number
      }
      admin_save_professional_membership: {
        Args: { p_membership?: Json; p_expected_updated_at?: string; p_id?: number }
        Returns: number
      }
      admin_delete_professional_membership: {
        Args: { p_id: number; p_expected_updated_at: string; p_confirmed: boolean }
        Returns: number
      }
      admin_move_professional_membership: {
        Args: { p_id: number; p_position: number; p_expected_order: number[] }
        Returns: undefined
      }
      admin_save_subject_taught: {
        Args: { p_expected_updated_at?: string; p_id?: number; p_subject?: Json }
        Returns: number
      }
      admin_delete_subject_taught: {
        Args: { p_confirmed: boolean; p_expected_updated_at: string; p_id: number }
        Returns: number
      }
      admin_move_subject_taught: {
        Args: { p_expected_order: number[]; p_id: number; p_position: number }
        Returns: undefined
      }
      admin_save_project_guided: {
        Args: { p_expected_updated_at?: string; p_id?: number; p_project?: Json }
        Returns: number
      }
      admin_save_peer_review: {
        Args: { p_expected_updated_at?: string; p_id?: number; p_review_text?: string }
        Returns: number
      }
      admin_delete_peer_review: {
        Args: { p_confirmed: boolean; p_expected_updated_at: string; p_id: number }
        Returns: number
      }
      admin_move_peer_review: {
        Args: { p_expected_order: number[]; p_id: number; p_position: number }
        Returns: undefined
      }
      admin_update_peer_review_settings: {
        Args: { p_completed_reviews_count: number; p_expected_updated_at: string; p_hero_counter_text: string }
        Returns: undefined
      }
      admin_delete_project_guided: {
        Args: { p_confirmed: boolean; p_expected_updated_at: string; p_id: number }
        Returns: number
      }
      admin_move_project_guided: {
        Args: { p_expected_order: number[]; p_id: number; p_position: number }
        Returns: undefined
      }
      admin_delete_achievement: {
        Args: { p_confirmed: boolean; p_expected_updated_at: string; p_id: number }
        Returns: number
      }
      admin_move_achievement: {
        Args: { p_expected_order: number[]; p_id: number; p_position: number }
        Returns: undefined
      }
      admin_move_certification: {
        Args: { p_expected_order: number[]; p_id: number; p_position: number }
        Returns: undefined
      }
      admin_save_publication: {
        Args: {
          p_expected_updated_at?: string
          p_id?: number
          p_publication?: Json
        }
        Returns: number
      }
      is_publications_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
