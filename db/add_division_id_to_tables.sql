-- Add division_id to all unit tables
-- This script adds division relationships to existing tables

-- Add division_id to Tasks table
ALTER TABLE unit_tasks 
ADD COLUMN division_id VARCHAR REFERENCES divisions(id) ON DELETE CASCADE;

-- Add index for faster queries on division_id
CREATE INDEX idx_unit_tasks_division_id ON unit_tasks(division_id);

-- Add division_id to Projects table
ALTER TABLE unit_projects 
ADD COLUMN division_id VARCHAR REFERENCES divisions(id) ON DELETE CASCADE;

-- Add index for faster queries on division_id
CREATE INDEX idx_unit_projects_division_id ON unit_projects(division_id);

-- Add division_id to Risks table
ALTER TABLE unit_risks 
ADD COLUMN division_id VARCHAR REFERENCES divisions(id) ON DELETE CASCADE;

-- Add index for faster queries on division_id
CREATE INDEX idx_unit_risks_division_id ON unit_risks(division_id);

-- Add division_id to Assets table
ALTER TABLE unit_assets 
ADD COLUMN division_id VARCHAR REFERENCES divisions(id) ON DELETE CASCADE;

-- Add index for faster queries on division_id
CREATE INDEX idx_unit_assets_division_id ON unit_assets(division_id);

-- Add division_id to KRAs table
ALTER TABLE unit_kras 
ADD COLUMN division_id VARCHAR REFERENCES divisions(id) ON DELETE CASCADE;

-- Add index for faster queries on division_id
CREATE INDEX idx_unit_kras_division_id ON unit_kras(division_id);

-- Add division_id to KPIs table
ALTER TABLE unit_kpis 
ADD COLUMN division_id VARCHAR REFERENCES divisions(id) ON DELETE CASCADE;

-- Add index for faster queries on division_id
CREATE INDEX idx_unit_kpis_division_id ON unit_kpis(division_id);

-- Create a function to get user's division IDs
CREATE OR REPLACE FUNCTION get_user_division_ids(p_user_email TEXT)
RETURNS TABLE(division_id VARCHAR) AS $$
BEGIN
    RETURN QUERY
    SELECT dm.division_id
    FROM division_memberships dm
    WHERE dm.user_id = p_user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add RLS policies to filter based on division membership
-- Enable RLS on tables
ALTER TABLE unit_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE unit_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE unit_risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE unit_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE unit_kras ENABLE ROW LEVEL SECURITY;
ALTER TABLE unit_kpis ENABLE ROW LEVEL SECURITY;

-- Create policy for tasks
CREATE POLICY unit_tasks_division_policy ON unit_tasks
    USING (
        division_id IN (SELECT get_user_division_ids(auth.jwt() ->> 'email'))
    );

-- Create policy for projects
CREATE POLICY unit_projects_division_policy ON unit_projects
    USING (
        division_id IN (SELECT get_user_division_ids(auth.jwt() ->> 'email'))
    );

-- Create policy for risks
CREATE POLICY unit_risks_division_policy ON unit_risks
    USING (
        division_id IN (SELECT get_user_division_ids(auth.jwt() ->> 'email'))
    );

-- Create policy for assets
CREATE POLICY unit_assets_division_policy ON unit_assets
    USING (
        division_id IN (SELECT get_user_division_ids(auth.jwt() ->> 'email'))
    );

-- Create policy for KRAs
CREATE POLICY unit_kras_division_policy ON unit_kras
    USING (
        division_id IN (SELECT get_user_division_ids(auth.jwt() ->> 'email'))
    );

-- Create policy for KPIs
CREATE POLICY unit_kpis_division_policy ON unit_kpis
    USING (
        division_id IN (SELECT get_user_division_ids(auth.jwt() ->> 'email'))
    ); 