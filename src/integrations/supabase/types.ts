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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      boarding_state: {
        Row: {
          id: number
          payload: Json
          updated_at: string | null
        }
        Insert: {
          id?: number
          payload?: Json
          updated_at?: string | null
        }
        Update: {
          id?: number
          payload?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      complaints: {
        Row: {
          created_at: string | null
          employee_name: string
          flight_no: string
          id: string
          notes: string | null
          passenger_name: string
          response: string | null
          status: string
          type: string
        }
        Insert: {
          created_at?: string | null
          employee_name: string
          flight_no: string
          id?: string
          notes?: string | null
          passenger_name: string
          response?: string | null
          status?: string
          type: string
        }
        Update: {
          created_at?: string | null
          employee_name?: string
          flight_no?: string
          id?: string
          notes?: string | null
          passenger_name?: string
          response?: string | null
          status?: string
          type?: string
        }
        Relationships: []
      }
      counters: {
        Row: {
          counter_no: string
          employee_name: string | null
          flight_no: string | null
          id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          counter_no: string
          employee_name?: string | null
          flight_no?: string | null
          id?: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          counter_no?: string
          employee_name?: string | null
          flight_no?: string | null
          id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      employees: {
        Row: {
          created_at: string | null
          full_name: string
          id: string
          password: string
          role: string
          username: string
        }
        Insert: {
          created_at?: string | null
          full_name: string
          id?: string
          password: string
          role?: string
          username: string
        }
        Update: {
          created_at?: string | null
          full_name?: string
          id?: string
          password?: string
          role?: string
          username?: string
        }
        Relationships: []
      }
      flights: {
        Row: {
          aircraft: string | null
          capacity: number
          created_at: string | null
          departure_time: string
          destination: string
          flight_no: string
          gate: string
          id: string
          origin: string
          status: string
          terminal: string
        }
        Insert: {
          aircraft?: string | null
          capacity?: number
          created_at?: string | null
          departure_time: string
          destination: string
          flight_no: string
          gate: string
          id?: string
          origin?: string
          status?: string
          terminal?: string
        }
        Update: {
          aircraft?: string | null
          capacity?: number
          created_at?: string | null
          departure_time?: string
          destination?: string
          flight_no?: string
          gate?: string
          id?: string
          origin?: string
          status?: string
          terminal?: string
        }
        Relationships: []
      }
      gate_changes: {
        Row: {
          changed_at: string | null
          changed_by: string | null
          flight_no: string
          id: string
          new_gate: string
          old_gate: string
          reason: string | null
        }
        Insert: {
          changed_at?: string | null
          changed_by?: string | null
          flight_no: string
          id?: string
          new_gate: string
          old_gate: string
          reason?: string | null
        }
        Update: {
          changed_at?: string | null
          changed_by?: string | null
          flight_no?: string
          id?: string
          new_gate?: string
          old_gate?: string
          reason?: string | null
        }
        Relationships: []
      }
      passengers: {
        Row: {
          bag_count: number | null
          bag_weight: number | null
          boarding_group: string | null
          boarding_pass_no: string | null
          carry_on_kg: number | null
          carry_on_weight: number | null
          checked_in_at: string | null
          checked_kg: number | null
          class: string | null
          counter: string | null
          customs_charge: number | null
          employee_id: string | null
          employee_name: string | null
          fast_track: boolean | null
          flight_id: string | null
          flight_no: string | null
          flight_number: string | null
          full_name: string | null
          gate: string | null
          id: string
          name: string | null
          nationality: string | null
          overweight_fee: number | null
          overweight_fee_paid: boolean | null
          overweight_kg: number | null
          passport: string | null
          passport_no: string | null
          priority: number | null
          seat: string | null
          seat_number: string | null
          status: string | null
          terminal: string | null
          ticket_class: string | null
          ticket_price: number | null
          total_charge: number | null
          wait_time_min: number | null
        }
        Insert: {
          bag_count?: number | null
          bag_weight?: number | null
          boarding_group?: string | null
          boarding_pass_no?: string | null
          carry_on_kg?: number | null
          carry_on_weight?: number | null
          checked_in_at?: string | null
          checked_kg?: number | null
          class?: string | null
          counter?: string | null
          customs_charge?: number | null
          employee_id?: string | null
          employee_name?: string | null
          fast_track?: boolean | null
          flight_id?: string | null
          flight_no?: string | null
          flight_number?: string | null
          full_name?: string | null
          gate?: string | null
          id?: string
          name?: string | null
          nationality?: string | null
          overweight_fee?: number | null
          overweight_fee_paid?: boolean | null
          overweight_kg?: number | null
          passport?: string | null
          passport_no?: string | null
          priority?: number | null
          seat?: string | null
          seat_number?: string | null
          status?: string | null
          terminal?: string | null
          ticket_class?: string | null
          ticket_price?: number | null
          total_charge?: number | null
          wait_time_min?: number | null
        }
        Update: {
          bag_count?: number | null
          bag_weight?: number | null
          boarding_group?: string | null
          boarding_pass_no?: string | null
          carry_on_kg?: number | null
          carry_on_weight?: number | null
          checked_in_at?: string | null
          checked_kg?: number | null
          class?: string | null
          counter?: string | null
          customs_charge?: number | null
          employee_id?: string | null
          employee_name?: string | null
          fast_track?: boolean | null
          flight_id?: string | null
          flight_no?: string | null
          flight_number?: string | null
          full_name?: string | null
          gate?: string | null
          id?: string
          name?: string | null
          nationality?: string | null
          overweight_fee?: number | null
          overweight_fee_paid?: boolean | null
          overweight_kg?: number | null
          passport?: string | null
          passport_no?: string | null
          priority?: number | null
          seat?: string | null
          seat_number?: string | null
          status?: string | null
          terminal?: string | null
          ticket_class?: string | null
          ticket_price?: number | null
          total_charge?: number | null
          wait_time_min?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "passengers_flight_id_fkey"
            columns: ["flight_id"]
            isOneToOne: false
            referencedRelation: "flights"
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
    Enums: {},
  },
} as const
