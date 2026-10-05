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
