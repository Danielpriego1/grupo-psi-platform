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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          address: string | null
          appointment_type: Database["public"]["Enums"]["appointment_type"]
          assigned_to: string | null
          client_id: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          created_by: string | null
          duration_minutes: number
          id: string
          internal_notes: string | null
          latitude: number | null
          longitude: number | null
          municipality: string | null
          notes: string | null
          scheduled_at: string
          state: string | null
          status: Database["public"]["Enums"]["appointment_status"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          appointment_type?: Database["public"]["Enums"]["appointment_type"]
          assigned_to?: string | null
          client_id?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          duration_minutes?: number
          id?: string
          internal_notes?: string | null
          latitude?: number | null
          longitude?: number | null
          municipality?: string | null
          notes?: string | null
          scheduled_at: string
          state?: string | null
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          appointment_type?: Database["public"]["Enums"]["appointment_type"]
          assigned_to?: string | null
          client_id?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          duration_minutes?: number
          id?: string
          internal_notes?: string | null
          latitude?: number | null
          longitude?: number | null
          municipality?: string | null
          notes?: string | null
          scheduled_at?: string
          state?: string | null
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_partners: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      certificate_copy_requests: {
        Row: {
          amount_mxn: number
          certificate_id: string
          created_at: string
          download_token: string | null
          expires_at: string | null
          id: string
          paid_at: string | null
          payment_status: Database["public"]["Enums"]["certificate_copy_status"]
          requested_by: string | null
          stripe_session_id: string | null
          updated_at: string
        }
        Insert: {
          amount_mxn?: number
          certificate_id: string
          created_at?: string
          download_token?: string | null
          expires_at?: string | null
          id?: string
          paid_at?: string | null
          payment_status?: Database["public"]["Enums"]["certificate_copy_status"]
          requested_by?: string | null
          stripe_session_id?: string | null
          updated_at?: string
        }
        Update: {
          amount_mxn?: number
          certificate_id?: string
          created_at?: string
          download_token?: string | null
          expires_at?: string | null
          id?: string
          paid_at?: string | null
          payment_status?: Database["public"]["Enums"]["certificate_copy_status"]
          requested_by?: string | null
          stripe_session_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificate_copy_requests_certificate_id_fkey"
            columns: ["certificate_id"]
            isOneToOne: false
            referencedRelation: "certificates"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          branch_name: string | null
          client_id: string
          created_at: string
          equipment_id: string | null
          folio: string
          id: string
          issued_at: string
          issued_by: string | null
          notes: string | null
          pdf_url: string | null
          qr_token: string
          service_type: Database["public"]["Enums"]["certificate_service_type"]
          source_request_id: string | null
          status: Database["public"]["Enums"]["certificate_status"]
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          branch_name?: string | null
          client_id: string
          created_at?: string
          equipment_id?: string | null
          folio: string
          id?: string
          issued_at?: string
          issued_by?: string | null
          notes?: string | null
          pdf_url?: string | null
          qr_token?: string
          service_type: Database["public"]["Enums"]["certificate_service_type"]
          source_request_id?: string | null
          status?: Database["public"]["Enums"]["certificate_status"]
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          branch_name?: string | null
          client_id?: string
          created_at?: string
          equipment_id?: string | null
          folio?: string
          id?: string
          issued_at?: string
          issued_by?: string | null
          notes?: string | null
          pdf_url?: string | null
          qr_token?: string
          service_type?: Database["public"]["Enums"]["certificate_service_type"]
          source_request_id?: string | null
          status?: Database["public"]["Enums"]["certificate_status"]
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "certificates_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          city: string | null
          company_name: string
          contact_name: string | null
          created_at: string
          email: string | null
          id: string
          notes: string | null
          phone: string | null
          state: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          company_name: string
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          company_name?: string
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      deliveries: {
        Row: {
          assigned_driver: string | null
          created_at: string
          delivered_at: string | null
          delivery_address: string | null
          id: string
          notes: string | null
          order_id: string
          scheduled_date: string | null
          status: Database["public"]["Enums"]["delivery_status"]
          updated_at: string
        }
        Insert: {
          assigned_driver?: string | null
          created_at?: string
          delivered_at?: string | null
          delivery_address?: string | null
          id?: string
          notes?: string | null
          order_id: string
          scheduled_date?: string | null
          status?: Database["public"]["Enums"]["delivery_status"]
          updated_at?: string
        }
        Update: {
          assigned_driver?: string | null
          created_at?: string
          delivered_at?: string | null
          delivery_address?: string | null
          id?: string
          notes?: string | null
          order_id?: string
          scheduled_date?: string | null
          status?: Database["public"]["Enums"]["delivery_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment: {
        Row: {
          branch_name: string | null
          brand: string | null
          client_id: string
          created_at: string
          equipment_type: Database["public"]["Enums"]["equipment_type"]
          id: string
          model: string | null
          notes: string | null
          qr_token: string
          serial_number: string | null
          updated_at: string
        }
        Insert: {
          branch_name?: string | null
          brand?: string | null
          client_id: string
          created_at?: string
          equipment_type?: Database["public"]["Enums"]["equipment_type"]
          id?: string
          model?: string | null
          notes?: string | null
          qr_token?: string
          serial_number?: string | null
          updated_at?: string
        }
        Update: {
          branch_name?: string | null
          brand?: string | null
          client_id?: string
          created_at?: string
          equipment_type?: Database["public"]["Enums"]["equipment_type"]
          id?: string
          model?: string | null
          notes?: string | null
          qr_token?: string
          serial_number?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      inventory: {
        Row: {
          category: string | null
          created_at: string
          id: string
          image_url: string | null
          location: string | null
          min_stock: number
          product_id: string
          product_name: string
          spec_pdf_url: string | null
          stock: number
          subcategory: string | null
          unit_price: number
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          location?: string | null
          min_stock?: number
          product_id: string
          product_name: string
          spec_pdf_url?: string | null
          stock?: number
          subcategory?: string | null
          unit_price?: number
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          location?: string | null
          min_stock?: number
          product_id?: string
          product_name?: string
          spec_pdf_url?: string | null
          stock?: number
          subcategory?: string | null
          unit_price?: number
          updated_at?: string
        }
        Relationships: []
      }
      maintenance_requests: {
        Row: {
          additional_notes: string | null
          address: string | null
          contact_email: string
          contact_name: string
          contact_phone: string
          created_at: string
          equipment_items: Json
          id: string
          latitude: number | null
          longitude: number | null
          municipality: string | null
          postal_code: string | null
          scheduled_date: string | null
          state: string | null
          status: Database["public"]["Enums"]["maintenance_request_status"]
          time_slot: string | null
          total_units: number
          tracking_code: string | null
          updated_at: string
        }
        Insert: {
          additional_notes?: string | null
          address?: string | null
          contact_email: string
          contact_name: string
          contact_phone: string
          created_at?: string
          equipment_items?: Json
          id?: string
          latitude?: number | null
          longitude?: number | null
          municipality?: string | null
          postal_code?: string | null
          scheduled_date?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["maintenance_request_status"]
          time_slot?: string | null
          total_units?: number
          tracking_code?: string | null
          updated_at?: string
        }
        Update: {
          additional_notes?: string | null
          address?: string | null
          contact_email?: string
          contact_name?: string
          contact_phone?: string
          created_at?: string
          equipment_items?: Json
          id?: string
          latitude?: number | null
          longitude?: number | null
          municipality?: string | null
          postal_code?: string | null
          scheduled_date?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["maintenance_request_status"]
          time_slot?: string | null
          total_units?: number
          tracking_code?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          product_name: string
          quantity: number
          subtotal: number | null
          unit_price: number
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          product_name: string
          quantity?: number
          subtotal?: number | null
          unit_price?: number
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          product_name?: string
          quantity?: number
          subtotal?: number | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address: string | null
          assigned_to: string | null
          client_id: string | null
          created_at: string
          created_by: string | null
          id: string
          latitude: number | null
          longitude: number | null
          municipality: string | null
          notes: string | null
          order_number: string
          state: string | null
          status: Database["public"]["Enums"]["order_status"]
          total: number
          updated_at: string
        }
        Insert: {
          address?: string | null
          assigned_to?: string | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          municipality?: string | null
          notes?: string | null
          order_number: string
          state?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total?: number
          updated_at?: string
        }
        Update: {
          address?: string | null
          assigned_to?: string | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          municipality?: string | null
          notes?: string | null
          order_number?: string
          state?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      service_offerings: {
        Row: {
          created_at: string
          description: string | null
          icon_name: string | null
          id: string
          is_active: boolean
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon_name?: string | null
          id?: string
          is_active?: boolean
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon_name?: string | null
          id?: string
          is_active?: boolean
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      calendar_events: {
        Row: {
          address: string | null
          assigned_to: string | null
          client_id: string | null
          client_name: string | null
          contact_phone: string | null
          created_at: string | null
          end_at: string | null
          event_type: string | null
          id: string | null
          internal_notes: string | null
          latitude: number | null
          longitude: number | null
          municipality: string | null
          notes: string | null
          source: string | null
          source_id: string | null
          start_at: string | null
          state: string | null
          status: string | null
          title: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      generate_certificate_folio: {
        Args: {
          _service_type: Database["public"]["Enums"]["certificate_service_type"]
        }
        Returns: string
      }
      generate_maintenance_tracking_code: { Args: never; Returns: string }
      get_certificate_by_qr: {
        Args: { _token: string }
        Returns: {
          branch_name: string
          client_company: string
          equipment_brand: string
          equipment_model: string
          equipment_serial: string
          folio: string
          issued_at: string
          service_type: Database["public"]["Enums"]["certificate_service_type"]
          status: Database["public"]["Enums"]["certificate_status"]
          valid_until: string
        }[]
      }
      get_equipment_by_qr: { Args: { _token: string }; Returns: Json }
      get_maintenance_by_tracking_code: {
        Args: { _code: string }
        Returns: {
          contact_name: string
          created_at: string
          municipality: string
          scheduled_date: string
          state: string
          status: Database["public"]["Enums"]["maintenance_request_status"]
          time_slot: string
          total_units: number
          tracking_code: string
          updated_at: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      regenerate_certificate_qr: { Args: { _id: string }; Returns: string }
      regenerate_equipment_qr: { Args: { _id: string }; Returns: string }
      user_owns_client: { Args: { _client_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "technician" | "vendor" | "tecnico" | "client"
      appointment_status:
        | "scheduled"
        | "confirmed"
        | "completed"
        | "cancelled"
        | "no_show"
      appointment_type: "visit" | "inspection" | "pickup" | "meeting"
      certificate_copy_status: "pending" | "paid" | "failed" | "refunded"
      certificate_service_type:
        | "mantenimiento"
        | "calibracion"
        | "hidrostatica"
        | "pureza_aire"
        | "posichek"
      certificate_status: "vigente" | "por_vencer" | "vencido" | "revocado"
      delivery_status:
        | "pending"
        | "assigned"
        | "in_transit"
        | "delivered"
        | "failed"
      equipment_type: "scba" | "cilindro" | "compresor" | "mascara" | "otro"
      maintenance_request_status:
        | "pending"
        | "contacted"
        | "scheduled"
        | "completed"
        | "cancelled"
      order_status:
        | "pending"
        | "confirmed"
        | "in_progress"
        | "ready"
        | "delivered"
        | "cancelled"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "technician", "vendor", "tecnico", "client"],
      appointment_status: [
        "scheduled",
        "confirmed",
        "completed",
        "cancelled",
        "no_show",
      ],
      appointment_type: ["visit", "inspection", "pickup", "meeting"],
      certificate_copy_status: ["pending", "paid", "failed", "refunded"],
      certificate_service_type: [
        "mantenimiento",
        "calibracion",
        "hidrostatica",
        "pureza_aire",
        "posichek",
      ],
      certificate_status: ["vigente", "por_vencer", "vencido", "revocado"],
      delivery_status: [
        "pending",
        "assigned",
        "in_transit",
        "delivered",
        "failed",
      ],
      equipment_type: ["scba", "cilindro", "compresor", "mascara", "otro"],
      maintenance_request_status: [
        "pending",
        "contacted",
        "scheduled",
        "completed",
        "cancelled",
      ],
      order_status: [
        "pending",
        "confirmed",
        "in_progress",
        "ready",
        "delivered",
        "cancelled",
      ],
    },
  },
} as const
