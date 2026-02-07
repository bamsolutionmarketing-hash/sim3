
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pblanvceenrhagbnkhgl.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBibGFudmNlZW5yaGFnYm5raGdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0Nzc4ODAsImV4cCI6MjA4NjA1Mzg4MH0.TrkMtdgutaMsgqzDXziqRhHZVTbZSZKf5279ZDSJrz8'

export const supabase = createClient(supabaseUrl, supabaseKey)
