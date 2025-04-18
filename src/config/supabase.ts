// Supabase configuration
const supabaseConfig = {
  url: "https://dmasclpgspatxncspcvt.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtYXNjbHBnc3BhdHhuY3NwY3Z0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5OTY1MDksImV4cCI6MjA1OTU3MjUwOX0.xDoSiZKsCkCwHVqtSS16Jc2awIZDCvCtIqxqlMUcuAM",
  
  // Tables configuration
  tables: {
    notes: "notes",
    users: "users",
    // Division related tables
    divisions: "divisions",
    division_memberships: "division_memberships",
    staff_members: "staff_members",
    organization_units: "organization_units",
    // Unit tables
    unit_tasks: "unit_tasks",
    unit_projects: "unit_projects",
    unit_risks: "unit_risks",
    unit_assets: "unit_assets",
    unit_kras: "unit_kras",
    unit_kpis: "unit_kpis"
  }
};

// Log configuration in development
if (process.env.NODE_ENV === 'development') {
  console.log('Supabase config loaded');
}

export default supabaseConfig; 