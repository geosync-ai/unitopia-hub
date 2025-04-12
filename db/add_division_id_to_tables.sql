-- Add division_id to all unit tables
-- This script adds division relationships to existing tables

-- Add division_id to Tasks table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'unit_tasks' AND column_name = 'division_id'
    ) THEN
        ALTER TABLE unit_tasks 
        ADD COLUMN division_id VARCHAR REFERENCES divisions(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add index for faster queries on division_id
CREATE INDEX IF NOT EXISTS idx_unit_tasks_division_id ON unit_tasks(division_id);

-- Add division_id to Projects table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'unit_projects' AND column_name = 'division_id'
    ) THEN
        ALTER TABLE unit_projects 
        ADD COLUMN division_id VARCHAR REFERENCES divisions(id) ON DELETE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_unit_projects_division_id ON unit_projects(division_id);

-- Add division_id to Risks table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'unit_risks' AND column_name = 'division_id'
    ) THEN
        ALTER TABLE unit_risks 
        ADD COLUMN division_id VARCHAR REFERENCES divisions(id) ON DELETE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_unit_risks_division_id ON unit_risks(division_id);

-- Add division_id to Assets table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'unit_assets' AND column_name = 'division_id'
    ) THEN
        ALTER TABLE unit_assets 
        ADD COLUMN division_id VARCHAR REFERENCES divisions(id) ON DELETE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_unit_assets_division_id ON unit_assets(division_id);

-- Add division_id to KRAs table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'unit_kras' AND column_name = 'division_id'
    ) THEN
        ALTER TABLE unit_kras 
        ADD COLUMN division_id VARCHAR REFERENCES divisions(id) ON DELETE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_unit_kras_division_id ON unit_kras(division_id);

-- Add division_id to KPIs table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'unit_kpis' AND column_name = 'division_id'
    ) THEN
        ALTER TABLE unit_kpis 
        ADD COLUMN division_id VARCHAR REFERENCES divisions(id) ON DELETE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_unit_kpis_division_id ON unit_kpis(division_id);

-- Create a function to get user's division IDs
CREATE OR REPLACE FUNCTION get_user_division_ids(p_user_email TEXT)
RETURNS TABLE(division_id VARCHAR) AS $$
BEGIN
    RETURN QUERY
    SELECT dm.division_id
    FROM division_memberships dm
    JOIN staff_members sm ON dm.staff_member_id = sm.id
    WHERE sm.email = p_user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on tables
ALTER TABLE unit_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE unit_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE unit_risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE unit_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE unit_kras ENABLE ROW LEVEL SECURITY;
ALTER TABLE unit_kpis ENABLE ROW LEVEL SECURITY;

-- Drop existing RLS policies if they exist
DROP POLICY IF EXISTS unit_tasks_division_policy ON unit_tasks;
DROP POLICY IF EXISTS unit_projects_division_policy ON unit_projects;
DROP POLICY IF EXISTS unit_risks_division_policy ON unit_risks;
DROP POLICY IF EXISTS unit_assets_division_policy ON unit_assets;
DROP POLICY IF EXISTS unit_kras_division_policy ON unit_kras;
DROP POLICY IF EXISTS unit_kpis_division_policy ON unit_kpis;

-- Create RLS policies based on user's division access

-- Tasks
CREATE POLICY unit_tasks_division_policy ON unit_tasks
    USING (
        division_id IN (SELECT get_user_division_ids(auth.jwt() ->> 'email'))
    );

-- Projects
CREATE POLICY unit_projects_division_policy ON unit_projects
    USING (
        division_id IN (SELECT get_user_division_ids(auth.jwt() ->> 'email'))
    );

-- Risks
CREATE POLICY unit_risks_division_policy ON unit_risks
    USING (
        division_id IN (SELECT get_user_division_ids(auth.jwt() ->> 'email'))
    );

-- Assets
CREATE POLICY unit_assets_division_policy ON unit_assets
    USING (
        division_id IN (SELECT get_user_division_ids(auth.jwt() ->> 'email'))
    );

-- KRAs
CREATE POLICY unit_kras_division_policy ON unit_kras
    USING (
        division_id IN (SELECT get_user_division_ids(auth.jwt() ->> 'email'))
    );

-- KPIs
CREATE POLICY unit_kpis_division_policy ON unit_kpis
    USING (
        division_id IN (SELECT get_user_division_ids(auth.jwt() ->> 'email'))
    );
