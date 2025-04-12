export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      app_config: {
        Row: {
          created_at: string | null
          id: string
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          created_at?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          created_at?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      business_unit_links: {
        Row: {
          created_at: string | null
          id: string
          page_id: string
          source: string
          title: string
          unit_id: string
          updated_at: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          page_id: string
          source: string
          title: string
          unit_id: string
          updated_at?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          id?: string
          page_id?: string
          source?: string
          title?: string
          unit_id?: string
          updated_at?: string | null
          url?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          created_at: string | null
          id: string
          modified: string | null
          name: string
          owner: string
          shared: boolean | null
          size: string
          type: string
          unit_id: string | null
          url: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          modified?: string | null
          name: string
          owner: string
          shared?: boolean | null
          size: string
          type: string
          unit_id?: string | null
          url?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          modified?: string | null
          name?: string
          owner?: string
          shared?: boolean | null
          size?: string
          type?: string
          unit_id?: string | null
          url?: string | null
        }
        Relationships: []
      }
      notes: {
        Row: {
          content: string | null
          created_at: string
          id: number
          name: string
          type: string | null
          updated_at: string | null
          user_email: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: number
          name?: string
          type?: string | null
          updated_at?: string | null
          user_email?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: number
          name?: string
          type?: string | null
          updated_at?: string | null
          user_email?: string | null
        }
        Relationships: []
      }
      organization_units: {
        Row: {
          code: string | null
          created_at: string
          description: string | null
          id: string
          manager: string | null
          name: string
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          manager?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          manager?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      unit_assets: {
        Row: {
          assigned_to: string | null
          checklist: Json | null
          created_at: string | null
          department: string | null
          id: string
          image_url: string | null
          name: string
          notes: string | null
          purchase_date: string | null
          serial_number: string | null
          status: string | null
          type: string | null
          unit_id: string | null
          updated_at: string | null
          warranty_expiry: string | null
        }
        Insert: {
          assigned_to?: string | null
          checklist?: Json | null
          created_at?: string | null
          department?: string | null
          id?: string
          image_url?: string | null
          name: string
          notes?: string | null
          purchase_date?: string | null
          serial_number?: string | null
          status?: string | null
          type?: string | null
          unit_id?: string | null
          updated_at?: string | null
          warranty_expiry?: string | null
        }
        Update: {
          assigned_to?: string | null
          checklist?: Json | null
          created_at?: string | null
          department?: string | null
          id?: string
          image_url?: string | null
          name?: string
          notes?: string | null
          purchase_date?: string | null
          serial_number?: string | null
          status?: string | null
          type?: string | null
          unit_id?: string | null
          updated_at?: string | null
          warranty_expiry?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "unit_assets_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "organization_units"
            referencedColumns: ["id"]
          },
        ]
      }
      unit_kpis: {
        Row: {
          actual: string | null
          checklist: Json | null
          created_at: string | null
          date: string | null
          description: string | null
          id: string
          kra_id: string | null
          name: string
          notes: string | null
          start_date: string | null
          status: string | null
          target: string | null
          unit_id: string | null
          updated_at: string | null
        }
        Insert: {
          actual?: string | null
          checklist?: Json | null
          created_at?: string | null
          date?: string | null
          description?: string | null
          id?: string
          kra_id?: string | null
          name: string
          notes?: string | null
          start_date?: string | null
          status?: string | null
          target?: string | null
          unit_id?: string | null
          updated_at?: string | null
        }
        Update: {
          actual?: string | null
          checklist?: Json | null
          created_at?: string | null
          date?: string | null
          description?: string | null
          id?: string
          kra_id?: string | null
          name?: string
          notes?: string | null
          start_date?: string | null
          status?: string | null
          target?: string | null
          unit_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "unit_kpis_kra_id_fkey"
            columns: ["kra_id"]
            isOneToOne: false
            referencedRelation: "unit_kras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unit_kpis_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "organization_units"
            referencedColumns: ["id"]
          },
        ]
      }
      unit_kras: {
        Row: {
          checklist: Json | null
          created_at: string | null
          department: string | null
          end_date: string | null
          id: string
          name: string
          objective_id: string | null
          objective_name: string | null
          progress: number | null
          responsible: string | null
          start_date: string | null
          status: string | null
          unit_id: string | null
          updated_at: string | null
        }
        Insert: {
          checklist?: Json | null
          created_at?: string | null
          department?: string | null
          end_date?: string | null
          id?: string
          name: string
          objective_id?: string | null
          objective_name?: string | null
          progress?: number | null
          responsible?: string | null
          start_date?: string | null
          status?: string | null
          unit_id?: string | null
          updated_at?: string | null
        }
        Update: {
          checklist?: Json | null
          created_at?: string | null
          department?: string | null
          end_date?: string | null
          id?: string
          name?: string
          objective_id?: string | null
          objective_name?: string | null
          progress?: number | null
          responsible?: string | null
          start_date?: string | null
          status?: string | null
          unit_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "unit_kras_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "organization_units"
            referencedColumns: ["id"]
          },
        ]
      }
      unit_projects: {
        Row: {
          budget: number | null
          budget_spent: number | null
          checklist: Json | null
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          manager: string | null
          name: string
          progress: number | null
          start_date: string | null
          status: string
          unit_id: string | null
          updated_at: string | null
        }
        Insert: {
          budget?: number | null
          budget_spent?: number | null
          checklist?: Json | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          manager?: string | null
          name: string
          progress?: number | null
          start_date?: string | null
          status: string
          unit_id?: string | null
          updated_at?: string | null
        }
        Update: {
          budget?: number | null
          budget_spent?: number | null
          checklist?: Json | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          manager?: string | null
          name?: string
          progress?: number | null
          start_date?: string | null
          status?: string
          unit_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "unit_projects_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "organization_units"
            referencedColumns: ["id"]
          },
        ]
      }
      unit_risks: {
        Row: {
          category: string | null
          checklist: Json | null
          created_at: string | null
          description: string | null
          id: string
          identification_date: string | null
          impact: string | null
          likelihood: string | null
          mitigation_plan: string | null
          owner: string | null
          project_id: string | null
          project_name: string | null
          status: string | null
          title: string
          unit_id: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          checklist?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          identification_date?: string | null
          impact?: string | null
          likelihood?: string | null
          mitigation_plan?: string | null
          owner?: string | null
          project_id?: string | null
          project_name?: string | null
          status?: string | null
          title: string
          unit_id?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          checklist?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          identification_date?: string | null
          impact?: string | null
          likelihood?: string | null
          mitigation_plan?: string | null
          owner?: string | null
          project_id?: string | null
          project_name?: string | null
          status?: string | null
          title?: string
          unit_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_risk_project"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "unit_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unit_risks_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "organization_units"
            referencedColumns: ["id"]
          },
        ]
      }
      unit_tasks: {
        Row: {
          assigned_to: string | null
          assignee: string | null
          checklist: Json | null
          completion_percentage: number | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: string | null
          project_id: string | null
          project_name: string | null
          start_date: string | null
          status: string
          title: string
          unit_id: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          assignee?: string | null
          checklist?: Json | null
          completion_percentage?: number | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          project_id?: string | null
          project_name?: string | null
          start_date?: string | null
          status: string
          title: string
          unit_id?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          assignee?: string | null
          checklist?: Json | null
          completion_percentage?: number | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          project_id?: string | null
          project_name?: string | null
          start_date?: string | null
          status?: string
          title?: string
          unit_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_task_project"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "unit_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unit_tasks_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "organization_units"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          created_at: string
          department: string | null
          email: string | null
          first_name: string | null
          id: string
          is_admin: boolean | null
          last_name: string | null
          position: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          is_admin?: boolean | null
          last_name?: string | null
          position?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          department?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          is_admin?: boolean | null
          last_name?: string | null
          position?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_unit_memberships: {
        Row: {
          created_at: string
          id: string
          role: string
          unit_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: string
          unit_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          unit_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_unit_memberships_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "organization_units"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
