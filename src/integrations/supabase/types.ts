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
      crm_activities: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          created_by_sora: boolean
          id: string
          metadata: Json | null
          opportunity_id: string
          type: Database["public"]["Enums"]["crm_activity_type"]
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          created_by_sora?: boolean
          id?: string
          metadata?: Json | null
          opportunity_id: string
          type?: Database["public"]["Enums"]["crm_activity_type"]
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          created_by_sora?: boolean
          id?: string
          metadata?: Json | null
          opportunity_id?: string
          type?: Database["public"]["Enums"]["crm_activity_type"]
        }
        Relationships: [
          {
            foreignKeyName: "crm_activities_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "crm_opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_opportunities: {
        Row: {
          assigned_to: string | null
          client_id: string | null
          closed_at: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          created_by_sora: boolean
          diagnostic_summary: string | null
          escalation_reason: string | null
          estimated_value: number | null
          id: string
          lost_reason: string | null
          needs_human_escalation: boolean
          next_action_at: string | null
          normativa: string | null
          priority_line: string | null
          risk_notes: string | null
          source: Database["public"]["Enums"]["crm_source"]
          source_ref: string | null
          stage: Database["public"]["Enums"]["crm_stage"]
          title: string
          updated_at: string
          urgency: Database["public"]["Enums"]["crm_urgency"]
          won_amount: number | null
        }
        Insert: {
          assigned_to?: string | null
          client_id?: string | null
          closed_at?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by_sora?: boolean
          diagnostic_summary?: string | null
          escalation_reason?: string | null
          estimated_value?: number | null
          id?: string
          lost_reason?: string | null
          needs_human_escalation?: boolean
          next_action_at?: string | null
          normativa?: string | null
          priority_line?: string | null
          risk_notes?: string | null
          source?: Database["public"]["Enums"]["crm_source"]
          source_ref?: string | null
          stage?: Database["public"]["Enums"]["crm_stage"]
          title: string
          updated_at?: string
          urgency?: Database["public"]["Enums"]["crm_urgency"]
          won_amount?: number | null
        }
        Update: {
          assigned_to?: string | null
          client_id?: string | null
          closed_at?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by_sora?: boolean
          diagnostic_summary?: string | null
          escalation_reason?: string | null
          estimated_value?: number | null
          id?: string
          lost_reason?: string | null
          needs_human_escalation?: boolean
          next_action_at?: string | null
          normativa?: string | null
          priority_line?: string | null
          risk_notes?: string | null
          source?: Database["public"]["Enums"]["crm_source"]
          source_ref?: string | null
          stage?: Database["public"]["Enums"]["crm_stage"]
          title?: string
          updated_at?: string
          urgency?: Database["public"]["Enums"]["crm_urgency"]
          won_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_opportunities_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_tasks: {
        Row: {
          assigned_to: string | null
          client_id: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_at: string | null
          id: string
          opportunity_id: string | null
          status: Database["public"]["Enums"]["crm_task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          client_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_at?: string | null
          id?: string
          opportunity_id?: string | null
          status?: Database["public"]["Enums"]["crm_task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          client_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_at?: string | null
          id?: string
          opportunity_id?: string | null
          status?: Database["public"]["Enums"]["crm_task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_tasks_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "crm_opportunities"
            referencedColumns: ["id"]
          },
        ]
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
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
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
          colors: string[]
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          image_urls: string[]
          location: string | null
          min_stock: number
          product_id: string
          product_name: string
          sizes: string[]
          spec_pdf_url: string | null
          stock: number
          subcategory: string | null
          unit_price: number
          updated_at: string
        }
        Insert: {
          category?: string | null
          colors?: string[]
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          image_urls?: string[]
          location?: string | null
          min_stock?: number
          product_id: string
          product_name: string
          sizes?: string[]
          spec_pdf_url?: string | null
          stock?: number
          subcategory?: string | null
          unit_price?: number
          updated_at?: string
        }
        Update: {
          category?: string | null
          colors?: string[]
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          image_urls?: string[]
          location?: string | null
          min_stock?: number
          product_id?: string
          product_name?: string
          sizes?: string[]
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
          confirmation_file_url: string | null
          contact_email: string
          contact_name: string
          contact_phone: string
          created_at: string
          equipment_items: Json
          equipment_type: string | null
          folio: string | null
          id: string
          latitude: number | null
          longitude: number | null
          municipality: string | null
          postal_code: string | null
          scheduled_date: string | null
          service_type: string | null
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
          confirmation_file_url?: string | null
          contact_email: string
          contact_name: string
          contact_phone: string
          created_at?: string
          equipment_items?: Json
          equipment_type?: string | null
          folio?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          municipality?: string | null
          postal_code?: string | null
          scheduled_date?: string | null
          service_type?: string | null
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
          confirmation_file_url?: string | null
          contact_email?: string
          contact_name?: string
          contact_phone?: string
          created_at?: string
          equipment_items?: Json
          equipment_type?: string | null
          folio?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          municipality?: string | null
          postal_code?: string | null
          scheduled_date?: string | null
          service_type?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["maintenance_request_status"]
          time_slot?: string | null
          total_units?: number
          tracking_code?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      notification_events: {
        Row: {
          body: string | null
          created_at: string
          failed: number
          id: string
          kind: string
          meta: Json
          read_at: string | null
          ref_number: string | null
          removed: number
          sent: number
          status: string
          tag: string | null
          title: string
          total_targets: number
          url: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string
          failed?: number
          id?: string
          kind?: string
          meta?: Json
          read_at?: string | null
          ref_number?: string | null
          removed?: number
          sent?: number
          status?: string
          tag?: string | null
          title: string
          total_targets?: number
          url?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string
          failed?: number
          id?: string
          kind?: string
          meta?: Json
          read_at?: string | null
          ref_number?: string | null
          removed?: number
          sent?: number
          status?: string
          tag?: string | null
          title?: string
          total_targets?: number
          url?: string | null
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
          paid_at: string | null
          payment_status: string | null
          state: string | null
          status: Database["public"]["Enums"]["order_status"]
          stripe_payment_intent: string | null
          stripe_session_id: string | null
          ticket_token: string | null
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
          paid_at?: string | null
          payment_status?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
          ticket_token?: string | null
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
          paid_at?: string | null
          payment_status?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
          ticket_token?: string | null
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
          sora_proximity_radius: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          sora_proximity_radius?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          sora_proximity_radius?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          kinds: string[]
          label: string | null
          last_delivered_at: string | null
          p256dh: string
          priority: string
          sound: boolean
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          kinds?: string[]
          label?: string | null
          last_delivered_at?: string | null
          p256dh: string
          priority?: string
          sound?: boolean
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          kinds?: string[]
          label?: string | null
          last_delivered_at?: string | null
          p256dh?: string
          priority?: string
          sound?: boolean
          updated_at?: string
          user_agent?: string | null
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
      stripe_webhook_events: {
        Row: {
          created_at: string
          error_message: string | null
          event_id: string | null
          event_type: string
          id: string
          order_id: string | null
          order_number: string | null
          payment_status: string | null
          processed_at: string | null
          processing_status: string
          raw_payload: Json | null
          received_at: string
          stripe_payment_intent: string | null
          stripe_session_id: string | null
          ticket_generated: boolean
          ticket_token: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_id?: string | null
          event_type: string
          id?: string
          order_id?: string | null
          order_number?: string | null
          payment_status?: string | null
          processed_at?: string | null
          processing_status?: string
          raw_payload?: Json | null
          received_at?: string
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
          ticket_generated?: boolean
          ticket_token?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_id?: string | null
          event_type?: string
          id?: string
          order_id?: string | null
          order_number?: string | null
          payment_status?: string | null
          processed_at?: string | null
          processing_status?: string
          raw_payload?: Json | null
          received_at?: string
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
          ticket_generated?: boolean
          ticket_token?: string | null
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
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
      create_maintenance_request: {
        Args: {
          _additional_notes: string
          _address: string
          _contact_email: string
          _contact_name: string
          _contact_phone: string
          _equipment_items: Json
          _equipment_type?: string
          _latitude: number
          _longitude: number
          _municipality: string
          _postal_code: string
          _scheduled_date: string
          _service_type?: string
          _state: string
          _time_slot: string
          _total_units: number
        }
        Returns: Json
      }
      crm_mark_overdue_tasks: { Args: never; Returns: undefined }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      generate_certificate_folio: {
        Args: {
          _service_type: Database["public"]["Enums"]["certificate_service_type"]
        }
        Returns: string
      }
      generate_maintenance_folio: {
        Args: { _pickup_date: string }
        Returns: string
      }
      generate_maintenance_tracking_code: { Args: never; Returns: string }
      get_admin_recipient_emails: {
        Args: never
        Returns: {
          email: string
        }[]
      }
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
      get_order_ticket: {
        Args: { _token: string }
        Returns: {
          address: string
          created_at: string
          municipality: string
          order_number: string
          paid_at: string
          payment_status: string
          state: string
          status: Database["public"]["Enums"]["order_status"]
          total: number
        }[]
      }
      get_ticket_token_by_order: {
        Args: { _order_number: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      regenerate_certificate_qr: { Args: { _id: string }; Returns: string }
      regenerate_equipment_qr: { Args: { _id: string }; Returns: string }
      user_owns_client: { Args: { _client_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "admin"
        | "technician"
        | "vendor"
        | "tecnico"
        | "client"
        | "superadmin"
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
      crm_activity_type:
        | "nota"
        | "llamada"
        | "email"
        | "whatsapp"
        | "visita"
        | "sora_msg"
        | "escalamiento"
        | "cambio_etapa"
        | "tarea"
        | "pago"
      crm_source:
        | "chat_sora"
        | "cotizacion"
        | "mantenimiento"
        | "manual"
        | "web"
      crm_stage:
        | "nuevo"
        | "diagnostico"
        | "cotizado"
        | "negociacion"
        | "ganado"
        | "perdido"
      crm_task_status: "pendiente" | "completada" | "vencida" | "cancelada"
      crm_urgency: "baja" | "media" | "alta" | "critica"
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
      app_role: [
        "admin",
        "technician",
        "vendor",
        "tecnico",
        "client",
        "superadmin",
      ],
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
      crm_activity_type: [
        "nota",
        "llamada",
        "email",
        "whatsapp",
        "visita",
        "sora_msg",
        "escalamiento",
        "cambio_etapa",
        "tarea",
        "pago",
      ],
      crm_source: ["chat_sora", "cotizacion", "mantenimiento", "manual", "web"],
      crm_stage: [
        "nuevo",
        "diagnostico",
        "cotizado",
        "negociacion",
        "ganado",
        "perdido",
      ],
      crm_task_status: ["pendiente", "completada", "vencida", "cancelada"],
      crm_urgency: ["baja", "media", "alta", "critica"],
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
