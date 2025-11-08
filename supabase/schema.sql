-- Create participants table
CREATE TABLE IF NOT EXISTS participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  employee_id VARCHAR(100) NOT NULL UNIQUE,
  assigned_number INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create assignments table to track number assignments
CREATE TABLE IF NOT EXISTS assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
  number INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  UNIQUE(number)
);

-- Create audit_logs table for tracking changes
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_id UUID REFERENCES participants(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  number INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create index on employee_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_participants_employee_id ON participants(employee_id);

-- Create index on assigned_number for faster lookups
CREATE INDEX IF NOT EXISTS idx_participants_assigned_number ON participants(assigned_number);

-- Create index on assignments number for faster lookups
CREATE INDEX IF NOT EXISTS idx_assignments_number ON assignments(number);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_participants_updated_at BEFORE UPDATE ON participants
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your security needs)
-- For now, allow all operations. In production, you should restrict these.
CREATE POLICY "Allow all operations on participants" ON participants
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on assignments" ON assignments
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on audit_logs" ON audit_logs
  FOR ALL USING (true) WITH CHECK (true);

